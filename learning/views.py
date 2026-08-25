from rest_framework import viewsets, views, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import TopicMastery, ReviewSession, ReviewItem
from .serializers import TopicMasterySerializer, ReviewSessionSerializer
from .generation import generate_review_question
from .utils import build_review_context
from .sm2 import update_sm2
import logging

logger = logging.getLogger(__name__)

class TopicViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API for the Topics Dashboard.
    User can see all topics they are learning, their mastery levels, and sources.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = TopicMasterySerializer

    def get_queryset(self):
        # Return topics ordered by next review date (due soonest first)
        return TopicMastery.objects.filter(user=self.request.user).order_by('next_review_date')


class DailyReviewView(views.APIView):
    """
    Handles fetching and submitting the daily review session.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Get today's review session. If one doesn't exist, create it.
        """
        user = request.user
        today = timezone.now().date()

        # 1. Check if user already has an active session today
        active_session = ReviewSession.objects.filter(
            user=user, 
            completed_at__isnull=True,
            created_at__date=today
        ).first()

        if active_session:
            serializer = ReviewSessionSerializer(active_session)
            return Response(serializer.data)

        # 2. No active session. Find topics due for review today.
        due_topics = TopicMastery.objects.filter(
            user=user, 
            next_review_date__lte=today
        ).order_by('next_review_date')[:10]  # Max 10 questions per day to prevent burnout

        if not due_topics.exists():
            return Response({"message": "You're all caught up for today! No topics due for review."}, status=status.HTTP_200_OK)

        # 3. Create a new session
        session = ReviewSession.objects.create(
            user=user,
            total_items=due_topics.count()
        )

        # 4. Generate questions for each due topic via Gemini
        for mastery in due_topics:
            # Build context text from the source documents
            context_text = ""
            for source in mastery.sources.all():
                src_obj = source.source  # GenericForeignKey field
                if src_obj:
                    # We grab a small snippet of the source content to send to Gemini
                    if hasattr(src_obj, 'text_content') and src_obj.text_content:
                         context_text += f"\nFrom {src_obj.title}:\n{src_obj.text_content[:2000]}"
                    elif hasattr(src_obj, 'content') and src_obj.content:
                         context_text += f"\nFrom {src_obj.title}:\n{src_obj.content[:2000]}"
            
            if not context_text.strip():
                # Fallback if no text could be extracted
                context_text = f"General knowledge about {mastery.topic_name}"

            # Determine difficulty based on current confidence
            diff_level = 1
            if mastery.confidence_level > 0.4: diff_level = 2
            if mastery.confidence_level > 0.7: diff_level = 3

            # Call Gemini!
            q_data = generate_review_question(mastery.topic_name, context_text, diff_level)
            
            if q_data:
                reasoning = build_review_context(mastery)
                
                ReviewItem.objects.create(
                    session=session,
                    mastery=mastery,
                    question_text=q_data['question'],
                    options=q_data['options'],
                    correct_answer=q_data['correct_answer'],
                    explanation=q_data['explanation'],
                    difficulty_level=diff_level,
                    review_context=reasoning
                )
            else:
                session.total_items -= 1
                session.save()

        # If Gemini failed on all questions (rare but possible)
        if session.total_items == 0:
            session.delete()
            return Response({"error": "Failed to generate questions. Please try again later."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        serializer = ReviewSessionSerializer(session)
        return Response(serializer.data)


class SubmitAnswerView(views.APIView):
    """
    Handles when a user submits an answer to a review question.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, item_id):
        try:
            item = ReviewItem.objects.get(id=item_id, session__user=request.user)
        except ReviewItem.DoesNotExist:
            return Response({"error": "Question not found"}, status=status.HTTP_404_NOT_FOUND)

        if item.user_answer:
            return Response({"error": "Already answered"}, status=status.HTTP_400_BAD_REQUEST)

        user_answer = request.data.get('answer')
        if user_answer not in ['A', 'B', 'C', 'D']:
            return Response({"error": "Invalid answer format"}, status=status.HTTP_400_BAD_REQUEST)

        # Evaluate answer
        is_correct = (user_answer == item.correct_answer)
        item.user_answer = user_answer
        item.is_correct = is_correct
        item.save()

        # Trigger SM-2 Algorithm
        # Quality score: 4 for correct, 1 for incorrect (simplified for MCQ)
        quality = 4 if is_correct else 1
        update_sm2(item.mastery, quality)

        # Update Session Score
        session = item.session
        if is_correct:
            session.correct_items += 1
            
        # Check if session is complete
        answered_count = session.items.exclude(user_answer__isnull=True).count()
        if answered_count == session.total_items:
            session.completed_at = timezone.now()
        session.save()

        # Return the result with the explanation (which was hidden before)
        return Response({
            "is_correct": is_correct,
            "correct_answer": item.correct_answer,
            "explanation": item.explanation,
            "session_completed": session.is_completed
        })
