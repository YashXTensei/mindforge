from django.db import models
from django.conf import settings
from taxonomy.models import Category, Tag


class BaseKnowledge(models.Model):
    """
    Abstract base model for all knowledge items in the vault.
    Shared fields for PDF, Resource, and any future content types.
    """
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='%(class)ss'  # <-- dynamic related_name!
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='%(class)ss'
    )
    tags = models.ManyToManyField(Tag, blank=True, related_name='%(class)ss')
    is_favorite = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True  # <-- No table created for this model!
        ordering = ['-updated_at']

    def __str__(self):
        return self.title


def pdf_upload_path(instance, filename):
    """
    Files organized per user: media/pdfs/user_<id>/filename.pdf
    This keeps uploads organized and prevents conflicts.
    """
    return f'pdfs/user_{instance.user.id}/{filename}'


class PDF(BaseKnowledge):
    """Uploaded PDF documents."""
    file = models.FileField(upload_to=pdf_upload_path)
    original_filename = models.CharField(max_length=255, default='', blank=True)
    file_size = models.PositiveIntegerField(help_text='File size in bytes')
    page_count = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text='Number of pages (extracted after upload)'
    )

    class Meta(BaseKnowledge.Meta):
        verbose_name = 'PDF'
        verbose_name_plural = 'PDFs'


class Resource(BaseKnowledge):
    """External bookmarks/references — articles, videos, repos, docs."""

    class ResourceType(models.TextChoices):
        ARTICLE = 'article', 'Article'
        VIDEO = 'video', 'Video'
        DOCUMENTATION = 'documentation', 'Documentation'
        REPOSITORY = 'repository', 'Repository'
        WEBSITE = 'website', 'Website'
        OTHER = 'other', 'Other'

    url = models.URLField(max_length=2000)
    resource_type = models.CharField(
        max_length=20,
        choices=ResourceType.choices,
        default=ResourceType.OTHER
    )

    class Meta(BaseKnowledge.Meta):
        pass