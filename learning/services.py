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
    # ContentType is Django's way of saying "what model is this object from?"
    # It lets us link TopicSource to ANY model (Document, Note, etc.) without hardcoding.
    content_type = ContentType.objects.get_for_model(content_object)
    
    saved_masteries = []
    
    for topic_name in topics:
        # Clean up the topic name
        topic_name = topic_name.strip().title()  # "react hooks" → "React Hooks"
        
        if not topic_name:
            continue
            
        # get_or_create returns a tuple: (object, was_it_created?)
        # If "React Hooks" already exists for this user, it returns the existing one.
        # If not, it creates a new one with the defaults we specify.
        mastery, created = TopicMastery.objects.get_or_create(
            user=user,
            topic_name=topic_name,
            defaults={
                'next_review_date': date.today(),  # Review immediately (first time)
                'confidence_level': 0.0,
                'easiness_factor': 2.5,             # SM-2 default
                'review_interval_days': 1,
            }
        )
        
        if created:
            logger.info(f"New topic created: '{topic_name}' for user {user.username}")
        else:
            logger.info(f"Topic already exists: '{topic_name}' for user {user.username}, linking new source")
        
        # Link this document/note as a source for this topic.
        # unique_together on TopicSource prevents duplicate links.
        TopicSource.objects.get_or_create(
            topic=mastery,
            content_type=content_type,
            object_id=content_object.id,
        )
        
        saved_masteries.append(mastery)
    
    return saved_masteries
