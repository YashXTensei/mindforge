from rest_framework import serializers
from .models import Contradiction


class ContradictionSerializer(serializers.ModelSerializer):
    """Full contradiction detail including nested claim info."""

    claim_a_detail = serializers.SerializerMethodField()
    claim_b_detail = serializers.SerializerMethodField()

    class Meta:
        model = Contradiction
        fields = [
            'id', 'explanation', 'severity', 'is_resolved',
            'resolved_note', 'created_at', 'resolved_at',
            'claim_a_detail', 'claim_b_detail',
        ]

    def _claim_to_dict(self, claim):
        """Convert a Claim to a frontend-friendly dict."""
        source_name = "Unknown Source"
        try:
            source = claim.source
            if source and hasattr(source, 'title'):
                source_name = source.title
        except Exception:
            pass

        return {
            'id': claim.id,
            'claim_text': claim.claim_text,
            'evidence_text': claim.evidence_text,
            'topic_name': claim.topic.topic_name if claim.topic else 'Unknown',
            'source_name': source_name,
        }

    def get_claim_a_detail(self, obj):
        return self._claim_to_dict(obj.claim_a)

    def get_claim_b_detail(self, obj):
        return self._claim_to_dict(obj.claim_b)


class ContradictionResolveSerializer(serializers.ModelSerializer):
    """For PATCH /resolve/ — only accepts resolution fields."""

    class Meta:
        model = Contradiction
        fields = ['resolved_note']
