from django.contrib import admin
from .models import Category, Tag, Note

# Register your models here.

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'created_at')
    list_filter = ('user',)
    search_fields = ('name',)

@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ('name', 'user')
    list_filter = ('user',)
    search_fields = ('name',)

@admin.register(Note)
class NoteAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'category', 'is_pinned', 'created_at')
    list_filter = ('is_pinned', 'user', 'category', 'tags')
    search_fields = ('title', 'content')
    date_hierarchy = 'created_at'