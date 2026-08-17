# Phase 4 Implementation Plan: Proactive Learning Engine

> Last Updated: 17 August 2026

## 1. Vision & Goal

"MindForge knows what I know, knows what I'm likely to forget, and actively makes me revise it."

Phase 4 transforms MindForge from a passive storage system into an active learning companion. It uses spaced repetition and topic-level mastery to ensure the user actually retains the knowledge they upload.

---

## 2. Core Features

### Keep ✅
- **Topic-Level Mastery**: Track understanding at the granular concept level, not just the document level.
- **Spaced Repetition (SM-2)**: Algorithmically calculate the exact day a user is likely to forget a topic.
- **Daily Review**: A unified dashboard showing due topics and generating targeted questions.
- **Adaptive Questions**: Generate questions dynamically based on what the user needs to review.
- **Quiz History/Performance**: Track success rates over time to measure knowledge retention.
- **Gemini Model Fallback**: Stick to the robust Gemini pipeline for consistent generation.

### Add ⭐
- **"Why am I reviewing this?" Context**: Every question explains why it's being asked (e.g., "You studied React Hooks 14 days ago and struggled with this concept. Let's review.").
- **Difficulty Adaptation**: The AI adjusts the difficulty of generated questions based on the user's previous performance on that specific topic.
- **Weak Sub-Concept Targeting**: If a user consistently fails questions about "useEffect dependencies" but aces "useState", the AI targets the weak sub-concept specifically.

### Don't Build ❌
- Standalone Flashcard Generator (wrapper — ChatGPT does it better)
- Generic AI Quiz Generator (wrapper — same reason)
- 10-provider infrastructure (unnecessary complexity)
- Random AI features that don't serve the core memory-tracking goal

---

## 3. Database Schema (Django Models)

### New App: `learning/`

```python
# learning/models.py

class TopicMastery(models.Model):
    """Tracks a user's mastery of a specific topic across their vault."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='topic_masteries')
    topic_name = models.CharField(max_length=200)
    
    # Source tracking (which documents/notes this topic was extracted from)
    # Using M2M through ContentType for polymorphic relations to Document & Note
    source_content_type = models.ManyToManyField(ContentType, through='TopicSource')
    
    # SM-2 Algorithm Fields
    confidence_level = models.FloatField(default=0.0)         # 0.0 to 1.0
    easiness_factor = models.FloatField(default=2.5)          # SM-2 EF (min 1.3)
    review_interval_days = models.IntegerField(default=1)     # Current interval
    next_review_date = models.DateField()                     # When to review next
    last_reviewed = models.DateTimeField(null=True, blank=True)
    consecutive_correct = models.IntegerField(default=0)
    
    # Performance tracking
    total_reviews = models.IntegerField(default=0)
    total_correct = models.IntegerField(default=0)
    
    # Weak area tracking
    weak_sub_concepts = models.JSONField(default=list, blank=True)
    # Example: ["useEffect cleanup", "dependency array rules"]
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['user', 'topic_name']


class TopicSource(models.Model):
    """Links a TopicMastery to its source Document or Note."""
    topic = models.ForeignKey(TopicMastery, on_delete=models.CASCADE)
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    source = GenericForeignKey('content_type', 'object_id')


class ReviewSession(models.Model):
    """A single daily review session."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='review_sessions')
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    score = models.FloatField(null=True)          # Percentage correct
    total_items = models.IntegerField(default=0)
    correct_items = models.IntegerField(default=0)


class ReviewItem(models.Model):
    """A single question within a review session."""
    DIFFICULTY_CHOICES = [
        (1, 'Easy'),
        (2, 'Medium'),
        (3, 'Hard'),
    ]
    
    session = models.ForeignKey(ReviewSession, on_delete=models.CASCADE, related_name='items')
    mastery = models.ForeignKey(TopicMastery, on_delete=models.CASCADE, related_name='review_items')
    
    # Question content
    question_text = models.TextField()
    options = models.JSONField()                   # {"A": "...", "B": "...", "C": "...", "D": "..."}
    correct_answer = models.CharField(max_length=1)  # "A", "B", "C", or "D"
    explanation = models.TextField()               # AI explanation of correct answer
    
    # Context & difficulty
    review_context = models.TextField()            # "Why am I reviewing this?"
    difficulty_level = models.IntegerField(choices=DIFFICULTY_CHOICES)
    
    # User response
    user_answer = models.CharField(max_length=1, null=True, blank=True)
    is_correct = models.BooleanField(null=True)
    answered_at = models.DateTimeField(null=True, blank=True)
```

---

## 4. System Architecture

### 4.1 Auto Topic Extraction (Extension of existing pipeline)

Modify the existing `process_document` and `process_note` Celery tasks in `rag/tasks.py`:

```
[Existing Pipeline]
Upload → Extract Text → Chunk → Embed → Store in PGVector

[Extended Pipeline]  
Upload → Extract Text → Chunk → Embed → Store in PGVector
                                    ↓
                          Topic Extraction (NEW)
                                    ↓
                          Create/Update TopicMastery (NEW)
```

- After chunking is complete, concatenate the first ~3000 tokens of text.
- Send to Gemini with a structured prompt requesting 3-5 topics as JSON.
- For each topic: find or create a `TopicMastery` record for this user.
- If the topic already exists, add this document as an additional source.

### 4.2 SM-2 Spaced Repetition Algorithm

```python
def update_sm2(mastery: TopicMastery, quality: int) -> None:
    """
    quality: 0-5 scale (0=complete fail, 5=perfect)
    Mapped from is_correct: correct=4, incorrect=1
    """
    mastery.total_reviews += 1
    
    if quality >= 3:  # Correct
        mastery.total_correct += 1
        mastery.consecutive_correct += 1
        
        if mastery.consecutive_correct == 1:
            mastery.review_interval_days = 1
        elif mastery.consecutive_correct == 2:
            mastery.review_interval_days = 3
        else:
            mastery.review_interval_days = round(
                mastery.review_interval_days * mastery.easiness_factor
            )
        
        # Update easiness factor
        mastery.easiness_factor = max(1.3, 
            mastery.easiness_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
        )
    else:  # Incorrect
        mastery.consecutive_correct = 0
        mastery.review_interval_days = 1
    
    mastery.confidence_level = min(1.0, mastery.total_correct / max(1, mastery.total_reviews))
    mastery.last_reviewed = timezone.now()
    mastery.next_review_date = timezone.now().date() + timedelta(days=mastery.review_interval_days)
    mastery.save()
```

### 4.3 Adaptive Question Generation

The prompt to Gemini includes context that drives difficulty and targeting:

```python
prompt = f"""
Generate a multiple-choice question about "{topic.topic_name}".

Context from the user's study materials:
{relevant_chunks_text}

Difficulty: {"EASY - test basic understanding" if confidence < 0.4 
             else "MEDIUM - test application" if confidence < 0.7 
             else "HARD - test edge cases and deep understanding"}

{"Focus specifically on these weak areas: " + str(topic.weak_sub_concepts) if topic.weak_sub_concepts else ""}

Return JSON with this exact schema:
{{
    "question": "...",
    "options": {{"A": "...", "B": "...", "C": "...", "D": "..."}},
    "correct_answer": "A|B|C|D",
    "explanation": "Why this is correct and why other options are wrong"
}}
"""
```

### 4.4 "Why Am I Reviewing This?" Generation

This is NOT generated by the LLM. It's constructed from TopicMastery metadata:

```python
def build_review_context(mastery: TopicMastery) -> str:
    days_since = (timezone.now() - mastery.last_reviewed).days if mastery.last_reviewed else None
    accuracy = f"{(mastery.total_correct / max(1, mastery.total_reviews)) * 100:.0f}%"
    
    parts = []
    if days_since:
        parts.append(f"You last reviewed '{mastery.topic_name}' {days_since} days ago.")
    
    if mastery.confidence_level < 0.4:
        parts.append("Your confidence is low — this needs reinforcement.")
    elif mastery.confidence_level < 0.7:
        parts.append("You're getting there but haven't fully retained this yet.")
    
    if mastery.weak_sub_concepts:
        parts.append(f"You've struggled with: {', '.join(mastery.weak_sub_concepts[:3])}.")
    
    parts.append(f"Overall accuracy: {accuracy} across {mastery.total_reviews} reviews.")
    
    return " ".join(parts)
```

---

## 5. API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/learning/topics/` | List all user topics with mastery levels, filterable/sortable |
| GET | `/api/learning/topics/{id}/` | Detail view for a specific topic |
| GET | `/api/learning/daily-review/` | Get/create today's review session (generates questions if needed) |
| POST | `/api/learning/daily-review/{session_id}/submit/` | Submit answers → evaluate → update SM-2 |
| GET | `/api/learning/review-history/` | Past sessions with scores and dates |
| GET | `/api/learning/stats/` | Quick stats: topics due today, streak, weakest topics |

---

## 6. Frontend Components (React + Tailwind)

### Daily Review Dashboard (integrated into main Dashboard)
- Banner: "You have X topics due for review today" with "Start Review" CTA.
- Quick stats: current streak, topics mastered, weakest area.

### Review Interface (new page/modal)
- Full-focus mode, one question at a time.
- Top section: "Why am I reviewing this?" context in a subtle card.
- Question with 4 clickable option cards.
- On submit: green/red feedback animation + explanation text.
- Progress bar showing X/Y questions completed.
- Final score screen with summary.

### Topics List (new page or section)
- Grid/list of all extracted topics.
- Each shows: topic name, confidence bar (colored), next review date, source documents.
- Sort by: confidence level, next review date, total reviews.

---

## 7. File Changes

| File | Type | What Changes |
|---|---|---|
| `learning/models.py` | **NEW** | TopicMastery, TopicSource, ReviewSession, ReviewItem |
| `learning/serializers.py` | **NEW** | Serializers for all learning models |
| `learning/views.py` | **NEW** | ViewSets for topics, daily review, history |
| `learning/urls.py` | **NEW** | API routing |
| `learning/admin.py` | **NEW** | Admin registration |
| `learning/sm2.py` | **NEW** | SM-2 algorithm implementation |
| `learning/generation.py` | **NEW** | Question generation pipeline (Gemini prompts) |
| `learning/tasks.py` | **NEW** | Celery tasks for review session generation |
| `rag/tasks.py` | **MODIFY** | Add topic extraction step after chunking/embedding |
| `config/urls.py` | **MODIFY** | Include learning app URLs |
| `config/settings.py` | **MODIFY** | Add 'learning' to INSTALLED_APPS |
| `frontend/src/api/learning.js` | **NEW** | Learning API calls |
| `frontend/src/pages/DailyReview.jsx` | **NEW** | Review interface page |
| `frontend/src/pages/Topics.jsx` | **NEW** | Topics list page |
| `frontend/src/components/learning/` | **NEW** | ReviewCard, TopicCard, ReviewStats components |

---

## 8. Verification Plan

### Automated Tests
- Unit tests for SM-2 algorithm (correct answers increase interval, incorrect resets it)
- Unit tests for `build_review_context` function
- API tests for daily review flow (mock Gemini responses)
- Test that topic extraction integrates into existing document processing pipeline

### Manual Verification
1. Upload a new PDF → verify topics are auto-extracted and TopicMastery records created
2. Navigate to Daily Review → verify questions are generated for due topics
3. Answer a question incorrectly → verify `next_review_date` is set to tomorrow
4. Answer a question correctly 3 times → verify interval grows (1 → 3 → 7 days)
5. Verify weak sub-concepts are tracked after incorrect answers
6. Verify "Why am I reviewing this?" shows accurate, human-readable context