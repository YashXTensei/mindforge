"""
Business logic for the Learning Engine.

This file is the "glue" between the AI (generation.py) and the database (models.py).
It handles creating/updating TopicMastery records when topics are extracted.

WHY A SEPARATE FILE?
Django best practice: keep models.py for schema, views.py for HTTP,
and services.py for business logic. This keeps each file focused.
"""

import logging
from datetime import date
from django.contrib.contenttypes.models import ContentType
from .models import TopicMastery, TopicSource

logger = logging.getLogger(__name__)


def save_topics_for_content(user, content_object, topics: list[str]) -> list[TopicMastery]:
    """
    Takes a list of topic strings and creates/updates TopicMastery records.
    Also links each topic to its source document/note via TopicSource.
    
    Args:
        user: The Django User who owns this content.
        content_object: The Document or Note instance the topics came from.
        topics: List of topic strings like ["React Hooks", "JWT Auth"].
    
    Returns:
        List of TopicMastery instances that were created or updated.
    
    WHAT HAPPENS HERE (step by step):
    
    1. For each topic string (e.g., "React Hooks"):
       a. Check if the user already has a TopicMastery for "React Hooks".
          - YES → Don't create a duplicate, just link this new document as an additional source.
          - NO  → Create a new TopicMastery with default SM-2 values (EF=2.5, interval=1 day).
       
    2. Create a TopicSource linking this topic to the specific Document/Note.
       This way we know "React Hooks" came from "react-tutorial.pdf" AND "my-notes.md".
    
    WHY get_or_create?
    Imagine a user uploads 3 PDFs about React. All three will extract "React Hooks" as a topic.
    We don't want 3 separate TopicMastery records. We want ONE, with 3 sources linked to it.
    get_or_create handles this: if it exists, just fetch it. If not, create it.
    """
    # Get the ContentType for the source object (Document or Note)
    content_type = ContentType.objects.get_for_model(content_object)
    
    # ── FIX 1: Re-upload protection ──
    # If this document/note already has topics extracted, skip to avoid duplicates
    existing_sources = TopicSource.objects.filter(
        content_type=content_type,
        object_id=content_object.id,
    ).count()
    
    if existing_sources > 0:
        logger.info(f"Topics already extracted for {content_type.model} {content_object.id}, skipping")
        return []
    
    saved_masteries = []
    
    for topic_name in topics:
        # Clean up the topic name
        topic_name = topic_name.strip().title()  # "react hooks" → "React Hooks"
        
        if not topic_name:
            continue
        
        # ── FIX 2: Smarter topic matching ──
        # Instead of exact match, try case-insensitive match first
        # This prevents "React Props And State" and "React Props Vs State" 
        # from creating duplicates
        existing_mastery = TopicMastery.objects.filter(
            user=user,
            topic_name__iexact=topic_name,
        ).first()
        
        if not existing_mastery:
            # Also try a "fuzzy" match: check if any existing topic CONTAINS 
            # the core words (ignore common filler words like "and", "vs", "the", "of")
            core_words = set(topic_name.lower().split()) - {'and', 'vs', 'the', 'of', 'in', 'a', 'an', 'for', 'with'}
            if core_words:
                for existing in TopicMastery.objects.filter(user=user):
                    existing_core = set(existing.topic_name.lower().split()) - {'and', 'vs', 'the', 'of', 'in', 'a', 'an', 'for', 'with'}
                    # If 80%+ of the words match, it's the same topic
                    if core_words and existing_core:
                        overlap = len(core_words & existing_core) / max(len(core_words), len(existing_core))
                        if overlap >= 0.8:
                            existing_mastery = existing
                            logger.info(f"Fuzzy matched '{topic_name}' → '{existing.topic_name}'")
                            break
        
        if existing_mastery:
            mastery = existing_mastery
            logger.info(f"Topic already exists: '{mastery.topic_name}' for user {user.username}, linking new source")
        else:
            mastery = TopicMastery.objects.create(
                user=user,
                topic_name=topic_name,
                next_review_date=date.today(),
                confidence_level=0.0,
                easiness_factor=2.5,
                review_interval_days=1,
            )
            logger.info(f"New topic created: '{topic_name}' for user {user.username}")
        
        # Link this document/note as a source for this topic.
        TopicSource.objects.get_or_create(
            topic=mastery,
            content_type=content_type,
            object_id=content_object.id,
        )
        
        saved_masteries.append(mastery)
    
    return saved_masteries
