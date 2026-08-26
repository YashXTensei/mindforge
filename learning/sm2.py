from datetime import timedelta
from django.utils import timezone
from .models import TopicMastery

def update_sm2(mastery: TopicMastery, quality: int) -> None:
    """
    Updates the SM-2 algorithm parameters for a TopicMastery instance.
    
    Args:
        mastery: The TopicMastery instance to update.
        quality: User's answer quality, mapped from ReviewItem.is_correct.
                 0-5 scale, but we simplify based on correct/incorrect:
                 - Correct: 4 (Good)
                 - Incorrect: 1 (Bad)
    """
    # 1. Update basic performance stats
    mastery.total_reviews += 1
    
    if quality >= 3:
        # User answered correctly
        mastery.total_correct += 1
        mastery.consecutive_correct += 1
        
        # 2. Calculate new interval
        if mastery.consecutive_correct == 1:
            mastery.review_interval_days = 1
        elif mastery.consecutive_correct == 2:
            mastery.review_interval_days = 3
        else:
            # SM-2 Formula: I(n) = I(n-1) * EF
            mastery.review_interval_days = round(
                mastery.review_interval_days * mastery.easiness_factor
            )
            
        # 3. Update Easiness Factor (EF)
        # SM-2 Formula: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
        mastery.easiness_factor = max(
            1.3,
            mastery.easiness_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
        )
        
    else:
        # User answered incorrectly
        mastery.consecutive_correct = 0
        mastery.review_interval_days = 1
        # EF does not change on incorrect answers in this simplified implementation
        # (Though original SM-2 does decrease it slightly)
        
    # 4. Update confidence level
    # Confidence = accuracy × experience_factor
    # experience_factor ramps up gradually so you need multiple reviews to reach mastery.
    # After 1 correct: ~17%, after 3: ~50%, after 5: ~83%, after 6+: can reach 100%
    experience_factor = min(1.0, mastery.total_reviews / 6)
    mastery.confidence_level = min(1.0, mastery.accuracy * experience_factor)
    
    # 5. Set timestamps
    mastery.last_reviewed = timezone.now()
    # Next review date is calculated from today
    mastery.next_review_date = timezone.now().date() + timedelta(days=mastery.review_interval_days)
    
    # Save the updated mastery record
    mastery.save()
