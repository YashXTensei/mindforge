from rest_framework import serializers
from .models import Document, Resource
from taxonomy.serializers import CategorySerializer, TagSerializer
import os
from django.conf import settings as django_settings

# vault/serializers.py (Snippet)
class DocumentSerializer(serializers.ModelSerializer): # Name changed
    category_detail = CategorySerializer(source='category', read_only=True)
    tags_detail = TagSerializer(source='tags', many=True, read_only=True)

    process_with_ai = serializers.BooleanField(write_only=True, default=True)

    class Meta:
        model = Document # Model changed
        fields = [
            'id', 'title', 'file', 'description', 'category', 'category_detail',
            'tags', 'tags_detail', 'file_size', 'page_count', 'is_favorite', 'extract_topics',
            'processing_status', 'processed_at', 'process_with_ai',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['file_size', 'page_count', 'processing_status', 'processed_at']
        
    # Apna validate_file logic same rakho bas 10MB limit rakho

    def validate_file(self, value):
        # Extension check
        ext = os.path.splitext(value.name)[1].lower()
        if ext not in django_settings.ALLOWED_UPLOAD_EXTENSIONS:
            allowed = ', '.join(django_settings.ALLOWED_UPLOAD_EXTENSIONS)
            raise serializers.ValidationError(
                f'Only {allowed} files are allowed.'
            )
        # Size check
        if value.size > django_settings.MAX_DOCUMENT_UPLOAD_SIZE:
            raise serializers.ValidationError('File size cannot exceed 20MB.')
        return value

    def create(self, validated_data):
        """
        Auto-populate original_filename and file_size from the uploaded file.
        Also check for duplicate uploads (same filename + same size = likely same file).
        """
        process_with_ai = validated_data.pop('process_with_ai', True)
        
        uploaded_file = validated_data['file']
        validated_data['original_filename'] = uploaded_file.name
        validated_data['file_size'] = uploaded_file.size
        
        # Duplicate detection: same user + same filename + same file size
        user = validated_data.get('user') or self.context['request'].user
        if Document.objects.filter(
            user=user,
            original_filename=uploaded_file.name,
            file_size=uploaded_file.size,
        ).exists():
            raise serializers.ValidationError(
                {'file': [f'You already have a document named "{uploaded_file.name}" with the same file size. Please delete the existing one first or rename your file.']}
            )
        
        # Extract tags before creating (M2M needs save first)
        tags = validated_data.pop('tags', [])
        doc = Document(**validated_data)
        if not process_with_ai:
            doc._skip_auto_process = True
        doc.save()
        if tags:
            doc.tags.set(tags)
        return doc

    def update(self, instance, validated_data):
        process_with_ai = validated_data.pop('process_with_ai', True)
        old_extract_topics = instance.extract_topics
        old_status = instance.processing_status
        
        if not process_with_ai:
            instance._skip_auto_process = True
        
        doc = super().update(instance, validated_data)
        
        # If user just checked extract_topics on a completed doc, re-trigger processing
        if doc.extract_topics and not old_extract_topics and doc.processing_status == 'completed':
            doc.update_status('pending')
        # If user checked process_with_ai on an unprocessed doc
        elif process_with_ai and old_status == 'unprocessed':
            doc.update_status('pending')
        
        return doc

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        # Generate a signed Cloudinary URL so the browser can access restricted files
        if ret.get('file') and 'cloudinary.com' in ret['file'] and instance.original_filename:
            import cloudinary.utils
            ext = os.path.splitext(instance.original_filename)[1].lower()
            public_id = instance.file.name
            signed_url, _ = cloudinary.utils.cloudinary_url(
                public_id,
                resource_type="raw",
                type="upload",
                sign_url=True,
            )
            if ext and not signed_url.lower().endswith(ext):
                signed_url += ext
            ret['file'] = signed_url
        return ret


class ResourceSerializer(serializers.ModelSerializer):
    category_detail = CategorySerializer(source='category', read_only=True)
    tags_detail = TagSerializer(source='tags', many=True, read_only=True)

    class Meta:
        model = Resource
        fields = [
            'id', 'title', 'description', 'url', 'resource_type',
            'category', 'category_detail', 'tags', 'tags_detail',
            'is_favorite', 'extract_topics', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']