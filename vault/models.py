from django.db import models
from django.conf import settings
from taxonomy.models import Category, Tag
from django.core.validators import FileExtensionValidator
import os
import uuid

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


def document_upload_path(instance, filename):
    ext = filename.split('.')[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    return os.path.join(f"vault/{instance.user.id}/documents", filename)
class Document(models.Model):  # Changed from PDF
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='documents')
    title = models.CharField(max_length=255)
    original_filename = models.CharField(max_length=255)
    file = models.FileField(
        upload_to=document_upload_path,
        validators=[FileExtensionValidator(allowed_extensions=['pdf', 'png', 'jpg', 'jpeg', 'webp'])] # Image support add kar diya
    )
    description = models.TextField(blank=True, null=True)
    category = models.ForeignKey('taxonomy.Category', on_delete=models.SET_NULL, null=True, blank=True, related_name='documents')
    tags = models.ManyToManyField('taxonomy.Tag', blank=True, related_name='documents')
    
    file_size = models.BigIntegerField(null=True, blank=True)
    page_count = models.IntegerField(null=True, blank=True) # Yeh image ke case mein null rahega
    is_favorite = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        ordering = ['-created_at']
    def __str__(self):
        return self.title


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