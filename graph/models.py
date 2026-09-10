"""
Knowledge Graph Models — Phase 5

Two core models:
1. TopicRelationship — Directed edges between topics (PREREQ / RELATED)
2. Claim — Structured factual claims extracted from documents/notes, linked to topics

Together they form the Knowledge Graph:
  Nodes = TopicMastery (from Phase 4)
  Edges = TopicRelationship (new)
  Evidence = Claim (new)
"""

from django.db import models
from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType

from learning.models import TopicMastery


class TopicRelationship(models.Model):
    """
    Directed edges between topics in the knowledge graph.

    Examples:
      - "JavaScript Closures" --PREREQ--> "React Hooks"
        (You need closures to understand hooks)
      - "REST API" --RELATED--> "HTTP Methods"
        (These topics are related but neither is a prerequisite)
    """
    class RelationshipType(models.TextChoices):
        PREREQUISITE = 'PREREQ', 'Is Prerequisite For'
        RELATED = 'RELATED', 'Is Related To'

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='topic_relationships'
    )
    source_topic = models.ForeignKey(
        TopicMastery,
        on_delete=models.CASCADE,
        related_name='outgoing_edges',
        help_text='The prerequisite / source topic'
    )
    target_topic = models.ForeignKey(
        TopicMastery,
        on_delete=models.CASCADE,
        related_name='incoming_edges',
        help_text='The topic that depends on / is related to the source'
    )
    relationship_type = models.CharField(
        max_length=20,
        choices=RelationshipType.choices
    )
    weight = models.FloatField(
        default=1.0,
        help_text='AI confidence score (0.0 to 1.0)'
    )

    # "Why are these topics connected?" — makes the graph *useful*, not just pretty
    relationship_reason = models.TextField(
        blank=True,
        default='',
        help_text='AI-generated explanation: "B requires A because concept X from A is needed to understand Y in B"'
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['source_topic', 'target_topic', 'relationship_type']
        indexes = [
            models.Index(fields=['user', 'relationship_type']),
        ]

    def __str__(self):
        return f"{self.source_topic.topic_name} --{self.relationship_type}--> {self.target_topic.topic_name}"


class Claim(models.Model):
    """
    A structured factual claim extracted from a document/note.

    Example:
      Topic: "React Hooks"
      Claim: "useEffect runs after every render by default"
      Evidence: "The useEffect hook fires after the browser has painted..."
      Source: Document #42 ("React Advanced Patterns.pdf")

    Claims give the graph its depth — each node (topic) isn't just a label,
    it's backed by concrete evidence from the user's own materials.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='claims'
    )
    topic = models.ForeignKey(
        TopicMastery,
        on_delete=models.CASCADE,
        related_name='claims'
    )
    claim_text = models.TextField(
        help_text='The factual claim: "React uses virtual DOM for efficient updates"'
    )
    evidence_text = models.TextField(
        help_text='Direct quote from the source document supporting this claim'
    )

    # Source tracking — Document or Note (same pattern as TopicSource in learning)
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    source = GenericForeignKey('content_type', 'object_id')

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['user', 'topic']),
            models.Index(fields=['content_type', 'object_id']),
        ]

    def __str__(self):
        return f"[{self.topic.topic_name}] {self.claim_text[:80]}"
