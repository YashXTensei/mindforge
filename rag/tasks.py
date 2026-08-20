"""
Celery tasks for the RAG pipeline.
These run in the background so the user doesn't have to wait.

Flow:
  Document uploaded → post_save signal → process_document.delay(doc_id)
  Note saved        → manual trigger    → process_note.delay(note_id)

Pipeline per task:
  Update status → Extract text → Chunk → Embed → Save chunks to DB → Mark completed
"""

import logging
from celery import shared_task
from django.conf import settings
from django.contrib.contenttypes.models import ContentType

logger = logging.getLogger(__name__)

DOC_RATE = settings.RATE_LIMITS.get('DOCUMENT_PROCESS_RATE', '5/m')


@shared_task(bind=True, max_retries=2, rate_limit=DOC_RATE)
def process_document(self, document_id):
    """
    Full RAG pipeline for a PDF Document.
    Extract text → Chunk → Embed → Save to DB.
    """
    from vault.models import Document
    from .extraction import extract_text_from_file
    from .chunking import chunk_text
    from .embeddings import generate_embeddings
    from .models import Chunk

    try:
        doc = Document.objects.get(id=document_id)
        logger.info(f"Processing document: {doc.title} (ID: {doc.id})")

        # ── Step 1: Extract Text ──
        doc.update_status('extracting')

        import tempfile
        import os
        import requests
        
        # Download file to a local temp path to support remote Cloudinary storage
        ext = os.path.splitext(doc.original_filename)[1].lower() if doc.original_filename else os.path.splitext(doc.file.name)[1].lower()
        
        file_url = doc.file.url
        
        # Cloudinary's free plan blocks unauthenticated access for raw files.
        # Use the Cloudinary SDK to generate a signed URL for download.
        if 'cloudinary.com' in file_url:
            import cloudinary.utils
            # Extract the public_id from the stored file name
            public_id = doc.file.name
            # Determine resource_type: 'raw' for RawMediaCloudinaryStorage
            signed_url, _ = cloudinary.utils.cloudinary_url(
                public_id,
                resource_type="raw",
                type="upload",
                sign_url=True,
            )
            if ext and not signed_url.lower().endswith(ext):
                signed_url += ext
            file_url = signed_url
            logger.info(f"Using signed Cloudinary URL for doc {doc.id}")

        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as temp_file:
            response = requests.get(file_url)
            response.raise_for_status()
            temp_file.write(response.content)
            temp_file_path = temp_file.name

        try:
            pages = extract_text_from_file(temp_file_path)
        finally:
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)

        if not pages:
            doc.mark_completed()
            logger.info(f"Document {doc.id} has no extractable text, marked completed")
            return

        # ── Step 2: Chunk ──
        doc.update_status('chunking')

        chunks = chunk_text(pages)
        logger.info(f"Document {doc.id}: {len(chunks)} chunks created")

        if not chunks:
            doc.mark_completed()
            return

        # ── Step 3: Generate Embeddings ──
        doc.update_status('embedding')

        chunk_texts = [c['content'] for c in chunks]
        embeddings = generate_embeddings(chunk_texts)

        # ── Step 4: Save Chunks to DB ──
        # Delete old chunks first (in case of reprocessing)
        content_type = ContentType.objects.get_for_model(Document)
        Chunk.objects.filter(
            content_type=content_type,
            object_id=doc.id,
        ).delete()

        # Bulk create new chunks
        chunk_objects = []
        for chunk_data, embedding in zip(chunks, embeddings):
            chunk_objects.append(Chunk(
                content_type=content_type,
                object_id=doc.id,
                content=chunk_data['content'],
                embedding=embedding,
                chunk_index=chunk_data['chunk_index'],
                source_title=doc.title,
                metadata=chunk_data['metadata'],
                user=doc.user,
            ))

        Chunk.objects.bulk_create(chunk_objects)

        # ── Step 5: Extract Topics for Learning Engine (Phase 4) ──
        # This step is independent of the RAG pipeline.
        # If it fails, we still mark the document as completed
        # because chunks are already saved and search/chat will work.
        try:
            from learning.generation import extract_topics_from_text
            from learning.services import save_topics_for_content

            # Combine chunk texts to give Gemini enough context
            # We use the first ~15000 chars (handled inside extract_topics_from_text)
            full_text = ' '.join(chunk_texts)
            
            topics = extract_topics_from_text(full_text)
            
            if topics:
                saved = save_topics_for_content(doc.user, doc, topics)
                logger.info(f"Document {doc.id}: {len(saved)} topics extracted: {topics}")
            else:
                logger.info(f"Document {doc.id}: No topics extracted")
                
        except Exception as topic_err:
            # Topic extraction is a "nice to have" — don't fail the whole pipeline
            logger.warning(f"Document {doc.id}: Topic extraction failed (non-fatal): {topic_err}")

        # ── Done! ──
        doc.mark_completed()
        logger.info(f"Document {doc.id} processed: {len(chunk_objects)} chunks saved")

    except Document.DoesNotExist:
        logger.error(f"Document {document_id} not found")

    except Exception as e:
        logger.error(f"Document {document_id} processing failed: {str(e)}")
        try:
            doc = Document.objects.get(id=document_id)
            doc.mark_failed(e)
        except Document.DoesNotExist:
            pass

        raise self.retry(exc=e, countdown=60)


@shared_task(bind=True, max_retries=2, rate_limit=DOC_RATE)
def process_note(self, note_id):
    """
    Full RAG pipeline for a Note.
    Extract text → Chunk → Embed → Save to DB.
    """
    from notes.models import Note
    from .extraction import extract_text_from_note
    from .chunking import chunk_text
    from .embeddings import generate_embeddings
    from .models import Chunk

    try:
        note = Note.objects.get(id=note_id)
        logger.info(f"Processing note: {note.title} (ID: {note.id})")

        # ── Step 1: Extract Text ──
        note.update_status('extracting')

        pages = extract_text_from_note(note)

        if not pages:
            note.mark_completed()
            logger.info(f"Note {note.id} is empty, marked completed")
            return

        # ── Step 2: Chunk ──
        note.update_status('chunking')

        chunks = chunk_text(pages)
        logger.info(f"Note {note.id}: {len(chunks)} chunks created")

        if not chunks:
            note.mark_completed()
            return

        # ── Step 3: Generate Embeddings ──
        note.update_status('embedding')

        chunk_texts = [c['content'] for c in chunks]
        embeddings = generate_embeddings(chunk_texts)

        # ── Step 4: Save Chunks to DB ──
        content_type = ContentType.objects.get_for_model(Note)
        Chunk.objects.filter(
            content_type=content_type,
            object_id=note.id,
        ).delete()

        chunk_objects = []
        for chunk_data, embedding in zip(chunks, embeddings):
            chunk_objects.append(Chunk(
                content_type=content_type,
                object_id=note.id,
                content=chunk_data['content'],
                embedding=embedding,
                chunk_index=chunk_data['chunk_index'],
                source_title=note.title,
                metadata=chunk_data['metadata'],
                user=note.user,
            ))

        Chunk.objects.bulk_create(chunk_objects)

        # ── Step 5: Extract Topics for Learning Engine (Phase 4) ──
        try:
            from learning.generation import extract_topics_from_text
            from learning.services import save_topics_for_content

            full_text = ' '.join(chunk_texts)
            topics = extract_topics_from_text(full_text)
            
            if topics:
                saved = save_topics_for_content(note.user, note, topics)
                logger.info(f"Note {note.id}: {len(saved)} topics extracted: {topics}")
            else:
                logger.info(f"Note {note.id}: No topics extracted")
                
        except Exception as topic_err:
            logger.warning(f"Note {note.id}: Topic extraction failed (non-fatal): {topic_err}")

        # ── Done! ──
        note.mark_completed()
        logger.info(f"Note {note.id} processed: {len(chunk_objects)} chunks saved")

    except Note.DoesNotExist:
        logger.error(f"Note {note_id} not found")

    except Exception as e:
        logger.error(f"Note {note_id} processing failed: {str(e)}")
        try:
            note = Note.objects.get(id=note_id)
            note.mark_failed(e)
        except Note.DoesNotExist:
            pass

        raise self.retry(exc=e, countdown=60)


@shared_task
def reprocess_failed():
    """
    Find all failed documents/notes and reprocess them.
    Can be triggered manually from admin or scheduled via Celery Beat.
    """
    from vault.models import Document
    from notes.models import Note

    failed_docs = Document.objects.filter(processing_status='failed', retry_count__lt=3)
    failed_notes = Note.objects.filter(processing_status='failed', retry_count__lt=3)

    count = 0
    for doc in failed_docs:
        process_document.delay(doc.id)
        count += 1

    for note in failed_notes:
        process_note.delay(note.id)
        count += 1

    logger.info(f"Requeued {count} failed items for reprocessing")
    return count


@shared_task
def cleanup_stuck_processing():
    """
    Safety net: Reset items stuck in processing states for > 1 hour.
    If a Celery worker crashes mid-processing (OOM, deploy, etc.),
    the document/note stays in 'extracting'/'chunking'/'embedding' forever.
    This task finds those orphans and marks them as 'failed' so they
    can be retried by reprocess_failed or manually by the user.
    """
    from datetime import timedelta
    from django.utils import timezone
    from vault.models import Document
    from notes.models import Note

    cutoff = timezone.now() - timedelta(hours=1)
    stuck_statuses = ['extracting', 'chunking', 'embedding', 'pending']

    stuck_docs = Document.objects.filter(
        processing_status__in=stuck_statuses,
        updated_at__lt=cutoff,
    )
    stuck_notes = Note.objects.filter(
        processing_status__in=stuck_statuses,
        updated_at__lt=cutoff,
    )

    doc_count = stuck_docs.update(processing_status='failed', error_message='Stuck in processing for >1 hour (auto-reset)')
    note_count = stuck_notes.update(processing_status='failed', error_message='Stuck in processing for >1 hour (auto-reset)')

    total = doc_count + note_count
    if total > 0:
        logger.warning(f"Reset {total} stuck items (docs={doc_count}, notes={note_count})")
    return total

