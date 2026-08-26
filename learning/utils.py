from django.utils import timezone
from .models import TopicMastery

def build_review_context(mastery: TopicMastery) -> str:
    """
    Generates a human-readable explanation of why a topic is being reviewed.
    This provides context to the user before they answer a question.
    """
    parts = []
    
    # 1. Time since last review
    if mastery.last_reviewed:
        days_since = (timezone.now() - mastery.last_reviewed).days
        if days_since == 0:
            parts.append(f"You reviewed '{mastery.topic_name}' today.")
        elif days_since == 1:
            parts.append(f"You reviewed '{mastery.topic_name}' yesterday.")
        else:
            parts.append(f"You last reviewed '{mastery.topic_name}' {days_since} days ago.")
    else:
        parts.append(f"This is your first time reviewing '{mastery.topic_name}'.")
        
    # 2. Confidence/Accuracy insight
    accuracy_pct = mastery.accuracy * 100
    
    if mastery.total_reviews > 0:
        if mastery.confidence_level < 0.4:
            parts.append("Your confidence is low — this needs reinforcement.")
        elif mastery.confidence_level < 0.7:
            parts.append("You're getting there but haven't fully retained this yet.")
        else:
             parts.append("You know this well! Just a quick refresher.")
             
        parts.append(f"Overall accuracy: {accuracy_pct:.0f}% across {mastery.total_reviews} reviews.")
        
    # 3. Weak areas targeting
    if mastery.weak_sub_concepts:
        # Show top 2-3 weak areas
        weak_str = ', '.join(mastery.weak_sub_concepts[:3])
        parts.append(f"Pay special attention to these weak areas: {weak_str}.")
        
    return " ".join(parts)
