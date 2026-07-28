from django.db import models
from django.conf import settings
from taxonomy.models import Category, Tag
from rag.mixins import ProcessingMixin

class Note(ProcessingMixin, models.Model):
    """
    User's notes with Markdown content.
    Core content model of MindForge.
    """
    title = models.CharField(max_length=200)
    content = models.TextField(blank=True, default='')
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notes'
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='notes'
    )
    tags = models.ManyToManyField(Tag, blank=True, related_name='notes')
    is_pinned = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return self.title

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._original_content = self.content if self.pk else None

    def save(self, *args, **kwargs):
        if self.pk and self.content != self._original_content:
            self._content_changed = True
        else:
            self._content_changed = False
        super().save(*args, **kwargs)
        self._original_content = self.content