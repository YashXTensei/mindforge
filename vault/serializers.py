from rest_framework import serializers
from .models import PDF, Resource
from taxonomy.serializers import CategorySerializer, TagSerializer
from django.conf import settings
import os
from django.conf import settings as django_settings

class PDFSerializer(serializers.ModelSerializer):
    # Read operations ke liye detailed category/tags
    category_detail = CategorySerializer(source='category', read_only=True)
    tags_detail = TagSerializer(source='tags', many=True, read_only=True)

    class Meta:
        model = PDF
        fields = [
            'id', 'title', 'description', 'file', 'original_filename',
            'file_size', 'page_count', 'category', 'category_detail',
            'tags', 'tags_detail', 'is_favorite', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'original_filename', 'file_size',
            'page_count', 'created_at', 'updated_at'
        ]

    def validate_file(self, value):
        # Extension check
        ext = os.path.splitext(value.name)[1].lower()
        if ext not in django_settings.ALLOWED_UPLOAD_EXTENSIONS:
            allowed = ', '.join(django_settings.ALLOWED_UPLOAD_EXTENSIONS)
            raise serializers.ValidationError(
                f'Only {allowed} files are allowed.'
            )
        # Size check
        if value.size > django_settings.MAX_PDF_UPLOAD_SIZE:
            raise serializers.ValidationError('File size cannot exceed 20MB.')
        return value

    def create(self, validated_data):
        """
        Auto-populate original_filename and file_size from the uploaded file.
        User ko manually nahi bhejne padenge yeh fields.
        """
        uploaded_file = validated_data['file']
        validated_data['original_filename'] = uploaded_file.name
        validated_data['file_size'] = uploaded_file.size
        return super().create(validated_data)


class ResourceSerializer(serializers.ModelSerializer):
    category_detail = CategorySerializer(source='category', read_only=True)
    tags_detail = TagSerializer(source='tags', many=True, read_only=True)

    class Meta:
        model = Resource
        fields = [
            'id', 'title', 'description', 'url', 'resource_type',
            'category', 'category_detail', 'tags', 'tags_detail',
            'is_favorite', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']