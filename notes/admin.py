from django.contrib import admin
from .models import Note


@admin.register(Note)
class NoteAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'category', 'is_pinned', 'created_at')
    list_filter = ('is_pinned', 'user', 'category', 'tags')
    search_fields = ('title', 'content')
    date_hierarchy = 'created_at'