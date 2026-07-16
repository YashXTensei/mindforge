from django.contrib import admin
from .models import Document, Resource


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'original_filename', 'file_size', 'category', 'is_favorite', 'created_at')
    list_filter = ('is_favorite', 'user', 'category')
    search_fields = ('title', 'description', 'original_filename')
    date_hierarchy = 'created_at'
    readonly_fields = ('original_filename', 'file_size', 'page_count')

    def save_model(self, request, obj, form, change):
        """
        Admin se upload karte waqt bhi file_size aur 
        original_filename auto-populate karo.
        """
        if obj.file:
            obj.original_filename = obj.file.name
            obj.file_size = obj.file.size
        super().save_model(request, obj, form, change)


@admin.register(Resource)
class ResourceAdmin(admin.ModelAdmin):
    list_display = ('title', 'resource_type', 'user', 'category', 'is_favorite', 'created_at')
    list_filter = ('resource_type', 'is_favorite', 'user', 'category')
    search_fields = ('title', 'description', 'url')
    date_hierarchy = 'created_at'