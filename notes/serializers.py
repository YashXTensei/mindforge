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
        note = super().create(validated_data)
        if not process_with_ai:
            note._skip_auto_process = True
        return note

    def update(self, instance, validated_data):
        process_with_ai = validated_data.pop('process_with_ai', True)
        note = super().update(instance, validated_data)
        if not process_with_ai:
            note._skip_auto_process = True
        return note