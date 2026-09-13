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
    Also handles manual re-triggering from serializers when status is set to pending.
    """
    if getattr(instance, '_signal_processing', False):
        return

    if getattr(instance, '_skip_auto_process', False):
        return

    if created or getattr(instance, '_file_changed', False):
        def queue_task():
            from .tasks import process_document
            instance._signal_processing = True
            instance.update_status('pending')
            instance._signal_processing = False
            process_document.delay(instance.id)

        transaction.on_commit(queue_task)
    else:
        if instance.processing_status == 'pending':
            # Serializer set it to pending (e.g. process_with_ai checked) — queue it
            def queue_task():
                from .tasks import process_document
                process_document.delay(instance.id)
            transaction.on_commit(queue_task)
            
        # Title changed. Update chunks!
        if instance.title != getattr(instance, '_original_title', None):
            def update_chunks():
                from .models import Chunk
                from django.contrib.contenttypes.models import ContentType
                ctype = ContentType.objects.get_for_model(Document)
                Chunk.objects.filter(content_type=ctype, object_id=instance.id).update(source_title=instance.title)
            
            transaction.on_commit(update_chunks)

from notes.models import Note

@receiver(post_save, sender=Note)
def trigger_note_processing(sender, instance, created, **kwargs):
    """
    Auto-trigger note processing when:
    1. Note is newly created with content and process_with_ai is not skipped
    2. Note content changed on an already-processed note (re-process)
    3. Status was set to 'pending' by serializer (extract_topics toggled)
    
    Uses _signal_processing flag to prevent recursive loops since
    update_status() triggers another post_save.
    """
    # Prevent recursive signal calls
    if getattr(instance, '_signal_processing', False):
        return
    
    # User opted out of AI processing
    if getattr(instance, '_skip_auto_process', False):
        return

    if created and instance.content.strip():
        # New note with content — queue for processing
        def queue_task():
            from .tasks import process_note
            instance._signal_processing = True
            instance.update_status('pending')
            instance._signal_processing = False
            process_note.delay(instance.id)
        transaction.on_commit(queue_task)
    elif not created:
        if instance.processing_status == 'pending':
            # Serializer set it to pending (e.g., extract_topics toggled) — just queue
            def queue_task():
                from .tasks import process_note
                process_note.delay(instance.id)
            transaction.on_commit(queue_task)
        
        # Title changed — update chunk titles
        if instance.title != getattr(instance, '_original_title', None):
            def update_chunks():
                from .models import Chunk
                from django.contrib.contenttypes.models import ContentType
                ctype = ContentType.objects.get_for_model(Note)
                Chunk.objects.filter(content_type=ctype, object_id=instance.id).update(source_title=instance.title)
            transaction.on_commit(update_chunks)

from django.db.models.signals import post_delete

@receiver(post_delete, sender=Document)
@receiver(post_delete, sender=Note)
def cleanup_on_delete(sender, instance, **kwargs):
    """
    Ensure all chunks and topic sources associated with a Document or Note are completely 
    deleted when the source document is deleted, preventing ghost context.
    """
    from .models import Chunk
    from learning.models import TopicSource
    from django.contrib.contenttypes.models import ContentType
    
    ctype = ContentType.objects.get_for_model(sender)
    
    # Explicitly delete chunks
    Chunk.objects.filter(content_type=ctype, object_id=instance.id).delete()
    
    # Explicitly delete topic sources (this will trigger the post_delete signal in learning 
    # to clean up orphaned TopicMastery objects)
    TopicSource.objects.filter(content_type=ctype, object_id=instance.id).delete()
