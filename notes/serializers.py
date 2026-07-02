from rest_framework import serializers
from .models import Category, Tag, Note

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'created_at']
        read_only_fields = ['id', 'created_at']

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name']
        read_only_fields = ['id']

class NoteSerializer(serializers.ModelSerializer):
    # Category aur Tags ko detail mein read karne ke liye (sirf ID na dikhe)
    # Pura category object aaye response mein, par write karte time id lenge
    category_detail = CategorySerializer(source='category', read_only=True)
    tags_detail = TagSerializer(source='tags', many=True, read_only=True)

    class Meta:
        model = Note
        fields = [
            'id', 'title', 'content', 'category', 'category_detail',
            'tags', 'tags_detail', 'is_pinned', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']