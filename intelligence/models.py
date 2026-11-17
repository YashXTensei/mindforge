"""
Intelligence Models — Phase 6.1

Contradiction: When two claims from different sources say opposite things.
Example:
  Claim A (from PDF-1): "Python is dynamically typed"
  Claim B (from PDF-2): "Python requires explicit type declarations"
  → Contradiction detected!
"""

from django.db import models
from django.conf import settings
from graph.models import Claim


class Contradiction(models.Model):
    """
    A detected contradiction between two claims in the user's knowledge base.
    
    Created automatically when the system finds semantically similar claims
    that say opposite things (confirmed by Gemini).
    """
    class Severity(models.TextChoices):
        LOW = 'low', 'Low — Minor inconsistency'
        MEDIUM = 'medium', 'Medium — Conflicting statements'
        HIGH = 'high', 'High — Direct contradiction'

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='contradictions'
    )
    claim_a = models.ForeignKey(
        Claim,
        on_delete=models.CASCADE,
        related_name='contradictions_as_a',
        help_text='First claim in the contradiction pair'
    )
    claim_b = models.ForeignKey(
        Claim,
        on_delete=models.CASCADE,
        related_name='contradictions_as_b',
        help_text='Second claim in the contradiction pair'
    )
    explanation = models.TextField(
        help_text='AI-generated explanation of why these claims contradict each other'
    )
    severity = models.CharField(
        max_length=10,
        choices=Severity.choices,
        default=Severity.MEDIUM,
    )

    # Resolution tracking
    is_resolved = models.BooleanField(default=False)
    resolved_note = models.TextField(
        blank=True,
        default='',
        help_text='User note explaining the resolution'
    )
    resolved_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['claim_a', 'claim_b']
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_resolved']),
        ]

    def __str__(self):
        return f"Contradiction: '{self.claim_a.claim_text[:40]}' vs '{self.claim_b.claim_text[:40]}'"
