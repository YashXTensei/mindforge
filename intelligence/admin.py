from django.contrib import admin
from .models import Contradiction


@admin.register(Contradiction)
class ContradictionAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'severity', 'is_resolved', 'created_at']
    list_filter = ['severity', 'is_resolved', 'created_at']
    search_fields = ['claim_a__claim_text', 'claim_b__claim_text', 'explanation']
    readonly_fields = ['created_at', 'resolved_at']
