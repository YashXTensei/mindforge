from rest_framework import serializers
from .models import Note
from taxonomy.serializers import CategorySerializer, TagSerializer  # <-- taxonomy se!
from taxonomy.models import Category, Tag  # <-- models bhi taxonomy se


class NoteSerializer(serializers.ModelSerializer):
    category_detail = CategorySerializer(source='category', read_only=True)
    tags_detail = TagSerializer(source='tags', many=True, read_only=True)

    class Meta:
        model = Note
        fields = [
            'id', 'title', 'content', 'category', 'category_detail',
            'tags', 'tags_detail', 'is_pinned', 'processing_status',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'processing_status', 'created_at', 'updated_at']