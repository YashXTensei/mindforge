from django.contrib import admin
from .models import Chunk, ChatConversation, ChatMessage

@admin.register(Chunk)
class ChunkAdmin(admin.ModelAdmin):
    list_display = ('source_title', 'content_type', 'object_id', 'chunk_index', 'user', 'created_at')
    list_filter = ('content_type', 'user')
    search_fields = ('source_title', 'content')
    readonly_fields = ('created_at',)
    
@admin.register(ChatConversation)
class ChatConversationAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'updated_at', 'created_at')
    list_filter = ('user',)
    search_fields = ('title',)
    readonly_fields = ('created_at', 'updated_at')

@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ('role', 'get_username', 'conversation', 'prompt_tokens', 'completion_tokens', 'created_at')
    list_filter = ('role', 'model_name')
    search_fields = ('content', 'conversation__title', 'conversation__user__username')
    readonly_fields = ('created_at',)

    def get_username(self, obj):
        return obj.conversation.user.username
    get_username.short_description = 'Account User'
