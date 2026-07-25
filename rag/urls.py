from django.urls import path
from .views import (
    SemanticSearchView,
    ProcessingStatusView,
    TriggerProcessingView,
    ChatView,
    ConversationListView,
    ConversationDetailView,
)

urlpatterns = [
    # Search
    path('search/', SemanticSearchView.as_view(), name='semantic-search'),

    # Processing
    path('status/', ProcessingStatusView.as_view(), name='processing-status'),
    path('process/', TriggerProcessingView.as_view(), name='trigger-processing'),

    # Chat
    path('chat/', ChatView.as_view(), name='rag-chat'),
    path('conversations/', ConversationListView.as_view(), name='conversation-list'),
    path('conversations/<int:pk>/', ConversationDetailView.as_view(), name='conversation-detail'),
]
