from rest_framework import serializers
from .models import TopicMastery, TopicSource, ReviewSession, ReviewItem

class TopicSourceSerializer(serializers.ModelSerializer):
    """Serializer for the sources linked to a topic."""
    source_title = serializers.SerializerMethodField()
    source_type = serializers.SerializerMethodField()

    class Meta:
        model = TopicSource
        fields = ['id', 'source_title', 'source_type', 'object_id']

    def get_source_title(self, obj):
        if obj.source and hasattr(obj.source, 'title'):
            return obj.source.title
        return "Unknown Source"

    def get_source_type(self, obj):
        return obj.content_type.model


class TopicMasterySerializer(serializers.ModelSerializer):
    """Serializer for the main Topics Dashboard view."""
    sources = TopicSourceSerializer(many=True, read_only=True)
    is_due = serializers.SerializerMethodField()

    class Meta:
        model = TopicMastery
        fields = [
            'id', 
            'topic_name', 
            'confidence_level', 
            'accuracy', 
            'total_reviews',
            'next_review_date',
            'is_due',
            'weak_sub_concepts',
            'sources'
        ]

    def get_is_due(self, obj):
        return obj.is_due_for_review()


class ReviewItemSerializer(serializers.ModelSerializer):
    """Serializer for an individual review question."""
    topic_name = serializers.CharField(source='mastery.topic_name', read_only=True)
    
    # Conditionally return these fields only if already answered
    user_answer = serializers.CharField(read_only=True)
    is_correct = serializers.BooleanField(read_only=True)
    correct_answer = serializers.SerializerMethodField()
    explanation = serializers.SerializerMethodField()

    class Meta:
        model = ReviewItem
        fields = [
            'id', 
            'topic_name', 
            'question_text', 
            'options', 
            'review_context',
            'difficulty_level',
            'user_answer',
            'is_correct',
            'correct_answer',
            'explanation'
        ]

    def get_correct_answer(self, obj):
        if obj.user_answer:
            return obj.correct_answer
        return None

    def get_explanation(self, obj):
        if obj.user_answer:
            return obj.explanation
        return None


class ReviewSessionSerializer(serializers.ModelSerializer):
    """Serializer for the active daily review session."""
    items = ReviewItemSerializer(many=True, read_only=True)

    class Meta:
        model = ReviewSession
        fields = [
            'id', 
            'created_at', 
            'completed_at', 
            'total_items', 
            'correct_items', 
            'is_completed',
            'items'
        ]
