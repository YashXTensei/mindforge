# Phase 4 Implementation Plan: Proactive Learning Engine

## 1. Vision & Goal

"MindForge knows what I know, knows what I'm likely to forget, and actively makes me revise it."

Instead of a generic AI wrapper that just generates flashcards on demand, Phase 4 transforms MindForge into a **Proactive Learning Engine**. It uses spaced repetition and Topic-level mastery to ensure the user actually retains the knowledge they upload.

## 2. Core Features (The "Keep" List)

- **Topic-Level Mastery**: Track understanding at the granular concept level, not just the document level.
- **Spaced Repetition (SM-2)**: Algorithmically calculate the exact day a user is likely to forget a topic.
- **Daily Review**: A unified dashboard showing due topics and generating targeted questions.
- **Adaptive Questions**: Generate questions dynamically based on what the user needs to review.
- **Quiz History/Performance**: Track success rates over time to measure knowledge retention.
- **Gemini Model Fallback**: Stick to the robust Gemini pipeline for consistent generation.

## 3. New Additions (The "Add" List)

- **"Why am I reviewing this?" Context**: Every question will explain why it's being asked (e.g., "You studied React Hooks 14 days ago and struggled with this concept. Let's review.").
- **Difficulty Adaptation**: The AI will adjust the difficulty of generated questions based on the user's previous performance on that specific topic.
- **Weak Sub-Concept Targeting**: If a user consistently fails questions about "useEffect dependencies" but aces "useState", the AI will target the weak sub-concept specifically.

## 4. What We Are NOT Building

- ❌ Standalone Flashcard Generator (too generic)
- ❌ Generic AI Quiz Generator (too generic)
- ❌ 10-provider infrastructure (unnecessary complexity)
- ❌ Random AI features that don't serve the core memory-tracking goal.

## 5. Database Schema (Django Models)

**`TopicMastery`**
- `user` (ForeignKey)
- `topic_name` (CharField)
- `source_documents` (ManyToManyField to Document/Note)
- `confidence_level` (Float: 0.0 to 1.0)
- `last_reviewed` (DateTimeField)
- `next_review_date` (DateTimeField)
- `review_interval_days` (IntegerField)
- `consecutive_correct` (IntegerField)
- `weak_sub_concepts` (JSONField - stores specific areas the user struggles with)

**`ReviewSession`**
- `user` (ForeignKey)
- `created_at` (DateTimeField)
- `score` (FloatField)

**`ReviewItem`**
- `session` (ForeignKey)
- `mastery_tracker` (ForeignKey to TopicMastery)
- `question_text` (TextField)
- `options` (JSONField)
- `correct_answer` (CharField)
- `user_answer` (CharField, nullable)
- `is_correct` (BooleanField, nullable)
- `review_context` (TextField) -> e.g., "Why am I reviewing this?"
- `difficulty_level` (IntegerField) -> To track how hard the generated question was.

## 6. System Architecture (Backend & AI)

1. **Daily Review Trigger**: 
   - A background Celery beat task runs nightly to identify `TopicMastery` records where `next_review_date <= today`.
   - Or triggered dynamically when the user hits the Daily Review dashboard.
2. **Adaptive Generation Pipeline**:
   - The AI receives the topic, the source chunks, the current `confidence_level`, and `weak_sub_concepts`.
   - **Prompt Engineering**: The prompt instructs Gemini to generate a question with a specific difficulty level matching the confidence score, specifically targeting any weak sub-concepts.
   - It also generates a brief `review_context` explaining why the user is seeing this.
3. **Spaced Repetition Evaluator**:
   - When answers are submitted, the backend calculates the new `next_review_date` (SM-2 logic) and updates the `weak_sub_concepts` if the user got it wrong.

## 7. API Endpoints

- `GET /api/learning/daily-review/` -> Fetches today's pending questions.
- `POST /api/learning/daily-review/{session_id}/submit/` -> Submits answers, triggers spaced repetition updates.
- `GET /api/learning/topics/` -> Returns a list of topics and their current mastery levels for the user dashboard.

## 8. Frontend UI Components

- **Daily Review Dashboard**: The primary call-to-action on the home page.
- **Adaptive Review Interface**:
  - Displays the "Why am I reviewing this?" context prominently.
  - Presents the question.
  - On submit, shows immediate feedback, the AI's explanation, and adjusts the internal score.
- **Knowledge Map / Stats Tab**: Visualizes strong vs. weak topics so the user can see their learning progress.