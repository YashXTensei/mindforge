from django.contrib import admin
from .models import TopicRelationship, Claim


@admin.register(TopicRelationship)
class TopicRelationshipAdmin(admin.ModelAdmin):
    list_display = ('source_topic', 'relationship_type', 'target_topic', 'weight', 'user', 'created_at')
    list_filter = ('relationship_type', 'created_at')
    search_fields = ('source_topic__topic_name', 'target_topic__topic_name', 'relationship_reason')
    raw_id_fields = ('user', 'source_topic', 'target_topic')


@admin.register(Claim)
class ClaimAdmin(admin.ModelAdmin):
    list_display = ('topic', 'short_claim', 'content_type', 'object_id', 'user', 'created_at')
    list_filter = ('content_type', 'created_at')
    search_fields = ('claim_text', 'evidence_text', 'topic__topic_name')
    raw_id_fields = ('user', 'topic')

    @admin.display(description='Claim')
    def short_claim(self, obj):
        return obj.claim_text[:100] + ('...' if len(obj.claim_text) > 100 else '')
