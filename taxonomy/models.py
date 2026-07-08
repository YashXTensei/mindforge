from django.db import models
from django.conf import settings


class Category(models.Model):
    """Shared category model — used by Notes, PDFs, Resources."""
    name = models.CharField(max_length=100)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='categories'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'categories'
        ordering = ['name']
        unique_together = ['name', 'user']

    def __str__(self):
        return self.name


class Tag(models.Model):
    """Shared tag model — used by Notes, PDFs, Resources."""
    name = models.CharField(max_length=50)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='tags'
    )

    class Meta:
        ordering = ['name']
        unique_together = ['name', 'user']

    def __str__(self):
        return self.name