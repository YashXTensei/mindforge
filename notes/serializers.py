from rest_framework import serializers
from .models import Note
from taxonomy.serializers import CategorySerializer, TagSerializer  # <-- taxonomy se!
from taxonomy.models import Category, Tag  # <-- models bhi taxonomy se


class NoteSerializer(serializers.ModelSerializer):
    category_detail = CategorySerializer(source='category', read_only=True)
    tags_detail = TagSerializer(source='tags', many=True, read_only=True)

    process_with_ai = serializers.BooleanField(write_only=True, default=True)

    class Meta:
        model = Note
        fields = [
            'id', 'title', 'content', 'category', 'category_detail',
            'tags', 'tags_detail', 'is_pinned', 'extract_topics', 'processing_status',
            'process_with_ai', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'processing_status', 'created_at', 'updated_at']

    def create(self, validated_data):
        process_with_ai = validated_data.pop('process_with_ai', True)
        note = Note(**{k: v for k, v in validated_data.items() if k != 'tags'})
        if not process_with_ai:
            note._skip_auto_process = True
        note.save()
        # Set tags (M2M) after save
        if 'tags' in validated_data:
            note.tags.set(validated_data['tags'])
        return note

    def update(self, instance, validated_data):
        process_with_ai = validated_data.pop('process_with_ai', True)
        old_extract_topics = instance.extract_topics
        old_status = instance.processing_status
        
        if not process_with_ai:
            instance._skip_auto_process = True
        
        note = super().update(instance, validated_data)
        
        # If user just checked extract_topics on a completed note
        if note.extract_topics and not old_extract_topics and note.processing_status == 'completed':
            note.update_status('pending')
        # If user checked process_with_ai on an unprocessed note
        elif process_with_ai and old_status == 'unprocessed':
            note.update_status('pending')
        
        return note