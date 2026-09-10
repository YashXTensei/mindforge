"""
Serializers for the Knowledge Graph API.
"""

from rest_framework import serializers
from .models import TopicRelationship, Claim


class ClaimSerializer(serializers.ModelSerializer):
    """Serializer for claims panel — shown when a node is clicked."""
    source_title = serializers.SerializerMethodField()
    source_type = serializers.SerializerMethodField()

    class Meta:
        model = Claim
        fields = [
            'id', 'claim_text', 'evidence_text',
            'source_title', 'source_type', 'created_at'
        ]

    def get_source_title(self, obj):
        """Get the title of the source Document/Note."""
        try:
            source = obj.source
            if source and hasattr(source, 'title'):
                return source.title
            return f"{obj.content_type.model} #{obj.object_id}"
        except Exception:
            return "Unknown source"

    def get_source_type(self, obj):
        return obj.content_type.model  # 'document' or 'note'
