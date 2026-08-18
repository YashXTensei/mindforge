from django.contrib import admin
from .models import TopicMastery, TopicSource, ReviewSession, ReviewItem


class TopicSourceInline(admin.TabularInline):
    model = TopicSource
    extra = 0
    readonly_fields = ['content_type', 'object_id', 'created_at']


@admin.register(TopicMastery)
class TopicMasteryAdmin(admin.ModelAdmin):
    list_display = [
        'topic_name', 'user', 'confidence_level',
        'next_review_date', 'total_reviews', 'total_correct',
        'review_interval_days'
    ]
    list_filter = ['user', 'next_review_date']
    search_fields = ['topic_name']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [TopicSourceInline]


class ReviewItemInline(admin.TabularInline):
    model = ReviewItem
    extra = 0
    readonly_fields = [
        'mastery', 'question_text', 'correct_answer',
        'user_answer', 'is_correct', 'difficulty_level'
    ]


@admin.register(ReviewSession)
class ReviewSessionAdmin(admin.ModelAdmin):
    list_display = [
        'user', 'created_at', 'completed_at',
        'score', 'total_items', 'correct_items'
    ]
    list_filter = ['user', 'created_at']
    readonly_fields = ['created_at']
    inlines = [ReviewItemInline]
