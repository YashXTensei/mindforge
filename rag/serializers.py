from rest_framework import serializers
from .models import Chunk, ChatConversation, ChatMessage


class ChunkSerializer(serializers.ModelSerializer):
    source_type = serializers.SerializerMethodField()

    class Meta:
        model = Chunk
        fields = ['id', 'content', 'source_title', 'source_type', 'object_id',
                  'chunk_index', 'metadata', 'created_at']

    def get_source_type(self, obj):
        return obj.content_type.model


class SemanticSearchResultSerializer(serializers.Serializer):
    """Serializer for semantic search results (not model-based)."""
    chunk_id = serializers.IntegerField()
    content = serializers.CharField()
    source_title = serializers.CharField()
    source_type = serializers.CharField()
    source_id = serializers.IntegerField()
    chunk_index = serializers.IntegerField()
    metadata = serializers.DictField()
    distance = serializers.FloatField()
    score = serializers.FloatField()


class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ['id', 'role', 'content', 'sources', 'prompt_tokens',
                  'completion_tokens', 'model_name', 'created_at']
        read_only_fields = ['id', 'role', 'sources', 'prompt_tokens',
                           'completion_tokens', 'model_name', 'created_at']


class ChatConversationSerializer(serializers.ModelSerializer):
    messages = ChatMessageSerializer(many=True, read_only=True)
    message_count = serializers.SerializerMethodField()

    class Meta:
        model = ChatConversation
        fields = ['id', 'title', 'message_count', 'messages', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_message_count(self, obj):
        return obj.messages.count()


class ChatConversationListSerializer(serializers.ModelSerializer):
    """Lighter serializer for listing conversations (without messages)."""
    message_count = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = ChatConversation
        fields = ['id', 'title', 'message_count', 'last_message', 'created_at', 'updated_at']

    def get_message_count(self, obj):
        return obj.messages.count()

    def get_last_message(self, obj):
        last = obj.messages.order_by('-created_at').first()
        if last:
            return {'role': last.role, 'content': last.content[:100], 'created_at': last.created_at}
        return None
