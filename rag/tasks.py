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

        pages = extract_text_from_file(doc.file.path)

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
