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
