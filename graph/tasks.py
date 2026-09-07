"""
Celery tasks for the Knowledge Graph.

recompile_all_documents: One-time task to compile knowledge from existing
documents that were processed before Phase 5 was deployed.
Idempotent — skips documents that already have claims.
"""

import logging
import time
from celery import shared_task
from django.contrib.contenttypes.models import ContentType

from learning.models import TopicMastery
from .models import Claim
from .services import compile_knowledge

logger = logging.getLogger(__name__)


@shared_task
def recompile_all_documents(user_id=None):
    """
    Compile knowledge from existing processed documents and notes.
    Idempotent: skips sources that already have claims.

    Args:
        user_id: optional — if provided, only recompile for this user.
                 If None, recompile for all users.

    Usage:
        # From Django shell or admin:
        from graph.tasks import recompile_all_documents
        recompile_all_documents.delay()           # all users
        recompile_all_documents.delay(user_id=1)  # specific user
    """
    from vault.models import Document
    from notes.models import Note
    from rag.models import Chunk

    doc_ct = ContentType.objects.get_for_model(Document)
    note_ct = ContentType.objects.get_for_model(Note)

    # Get documents/notes to process
    doc_filter = {'processing_status': 'completed'}
    note_filter = {'processing_status': 'completed'}

    if user_id:
        doc_filter['user_id'] = user_id
        note_filter['user_id'] = user_id

    documents = Document.objects.filter(**doc_filter)
    notes = Note.objects.filter(**note_filter)

    # Get IDs of sources that already have claims (skip these)
    existing_doc_ids = set(
        Claim.objects.filter(content_type=doc_ct)
        .values_list('object_id', flat=True)
        .distinct()
    )
    existing_note_ids = set(
        Claim.objects.filter(content_type=note_ct)
        .values_list('object_id', flat=True)
        .distinct()
    )

    compiled_count = 0
    skipped_count = 0
    failed_count = 0

    # Process documents
    for doc in documents:
        if doc.id in existing_doc_ids:
            skipped_count += 1
            continue

        try:
            # Get chunks for this document
            chunk_texts = list(
                Chunk.objects.filter(content_type=doc_ct, object_id=doc.id)
                .order_by('chunk_index')
                .values_list('content', flat=True)
            )

            if not chunk_texts:
                skipped_count += 1
                continue

            # Get user's topics
            user_topics = TopicMastery.objects.filter(user=doc.user).values('id', 'topic_name')
            topics_with_ids = [{"id": t['id'], "name": t['topic_name']} for t in user_topics]

            if not topics_with_ids:
                skipped_count += 1
                continue

            compile_knowledge(doc.user, chunk_texts, topics_with_ids, doc)
            compiled_count += 1
            logger.info(f"Recompiled document {doc.id}: {doc.title}")

            # Rate limit — 2 second delay between Gemini calls
            time.sleep(2)

        except Exception as e:
            failed_count += 1
            logger.error(f"Failed to recompile document {doc.id}: {e}")

    # Process notes
    for note in notes:
        if note.id in existing_note_ids:
            skipped_count += 1
            continue

        try:
            chunk_texts = list(
                Chunk.objects.filter(content_type=note_ct, object_id=note.id)
                .order_by('chunk_index')
                .values_list('content', flat=True)
            )

            if not chunk_texts:
                skipped_count += 1
                continue

            user_topics = TopicMastery.objects.filter(user=note.user).values('id', 'topic_name')
            topics_with_ids = [{"id": t['id'], "name": t['topic_name']} for t in user_topics]

            if not topics_with_ids:
                skipped_count += 1
                continue

            compile_knowledge(note.user, chunk_texts, topics_with_ids, note)
            compiled_count += 1
            logger.info(f"Recompiled note {note.id}: {note.title}")

            # Rate limit
            time.sleep(2)

        except Exception as e:
            failed_count += 1
            logger.error(f"Failed to recompile note {note.id}: {e}")

    summary = (
        f"Recompile complete: {compiled_count} compiled, "
        f"{skipped_count} skipped, {failed_count} failed"
    )
    logger.info(summary)
    return summary
