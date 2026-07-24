from django.db import models

class ProcessingStatus(models.TextChoices):
    PENDING = 'pending', 'Pending'
    EXTRACTING = 'extracting', 'Extracting Text'
    CHUNKING = 'chunking', 'Chunking'
    EMBEDDING = 'embedding', 'Generating Embeddings'
    COMPLETED = 'completed', 'Completed'
    FAILED = 'failed', 'Failed'

class ProcessingMixin(models.Model):
    processing_status = models.CharField(
        max_length=20,
        choices=ProcessingStatus.choices,
        default=ProcessingStatus.PENDING,
    )
    error_message = models.TextField(blank=True, default='')
    retry_count = models.IntegerField(default=0)
    failed_at = models.DateTimeField(null=True, blank=True)
    processed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        abstract = True

    def update_status(self, status):
        """Helper to update processing status in one line."""
        self.processing_status = status
        self.save(update_fields=['processing_status'])

    def mark_completed(self):
        """Mark processing as completed with timestamp."""
        from django.utils import timezone
        self.processing_status = ProcessingStatus.COMPLETED
        self.processed_at = timezone.now()
        self.error_message = ''
        self.save(update_fields=['processing_status', 'processed_at', 'error_message'])

    def mark_failed(self, error):
        """Mark processing as failed with error details."""
        from django.utils import timezone
        self.processing_status = ProcessingStatus.FAILED
        self.error_message = str(error)[:1000]
        self.retry_count += 1
        self.failed_at = timezone.now()
        self.save(update_fields=[
            'processing_status', 'error_message', 'retry_count', 'failed_at'
        ])
