"""
Django signals to auto-trigger RAG processing.

When a Document is uploaded (created), automatically queue it for processing.
Notes are NOT auto-triggered — user may still be editing.
Notes can be manually triggered via API or processed on-demand.
"""

from django.db import transaction
from django.db.models.signals import post_save
from django.dispatch import receiver
from vault.models import Document


@receiver(post_save, sender=Document)
def trigger_document_processing(sender, instance, created, **kwargs):
    """
    When a new Document is uploaded, queue it for background processing.
    Uses transaction.on_commit to ensure the DB row is committed
    before Celery picks up the task (prevents race condition).
    """
    if created or getattr(instance, '_file_changed', False):
        def queue_task():
            from .tasks import process_document
            process_document.delay(instance.id)

        transaction.on_commit(queue_task)
