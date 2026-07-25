from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from .search import semantic_search
from .chat import chat
from .serializers import (
    SemanticSearchResultSerializer,
    ChatConversationSerializer,
    ChatConversationListSerializer,
    ChatMessageSerializer,
)
from .models import ChatConversation


class SemanticSearchView(APIView):
    """
    GET /api/rag/search/?q=What is React?
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        query = request.query_params.get('q', '').strip()
        if not query:
            return Response(
                {'error': 'Query parameter "q" is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        top_k = request.query_params.get('top_k')
        if top_k:
            try:
                top_k = int(top_k)
            except ValueError:
                top_k = None

        results = semantic_search(query, request.user, top_k=top_k)
        serializer = SemanticSearchResultSerializer(results, many=True)
        return Response(serializer.data)


class ProcessingStatusView(APIView):
    """
    GET /api/rag/status/
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from vault.models import Document
        from notes.models import Note

        documents = Document.objects.filter(user=request.user).values(
            'id', 'title', 'processing_status', 'error_message', 'processed_at'
        )
        notes = Note.objects.filter(user=request.user).values(
            'id', 'title', 'processing_status', 'error_message', 'processed_at'
        )

        return Response({
            'documents': list(documents),
            'notes': list(notes),
        })


class TriggerProcessingView(APIView):
    """
    POST /api/rag/process/
    Body: {"type": "note", "id": 5}
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        source_type = request.data.get('type')
        source_id = request.data.get('id')

        if not source_type or not source_id:
            return Response(
                {'error': '"type" and "id" are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if source_type == 'document':
            from vault.models import Document
            from .tasks import process_document
            try:
                doc = Document.objects.get(id=source_id, user=request.user)
                doc.update_status('pending')
                process_document.delay(doc.id)
                return Response({'message': f'Document "{doc.title}" queued for processing'})
            except Document.DoesNotExist:
                return Response({'error': 'Document not found'}, status=404)

        elif source_type == 'note':
            from notes.models import Note
            from .tasks import process_note
            try:
                note = Note.objects.get(id=source_id, user=request.user)
                note.update_status('pending')
                process_note.delay(note.id)
                return Response({'message': f'Note "{note.title}" queued for processing'})
            except Note.DoesNotExist:
                return Response({'error': 'Note not found'}, status=404)

        return Response(
            {'error': '"type" must be "document" or "note"'},
            status=status.HTTP_400_BAD_REQUEST
        )


# ──────────────────────────────────────────────
# Chat API Views
# ──────────────────────────────────────────────

class ChatView(APIView):
    """
    POST /api/rag/chat/
    Body: {"message": "What is React?", "conversation_id": null}

    Sends a message and gets AI response with source citations.
    If conversation_id is null, creates a new conversation.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        message = request.data.get('message', '').strip()
        conversation_id = request.data.get('conversation_id')

        if not message:
            return Response(
                {'error': '"message" is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            if conversation_id:
                # Verify conversation belongs to user
                ChatConversation.objects.get(id=conversation_id, user=request.user)

            result = chat(conversation_id, message, request.user)
            return Response(result)

        except ChatConversation.DoesNotExist:
            return Response(
                {'error': 'Conversation not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ConversationListView(APIView):
    """
    GET /api/rag/conversations/
    Returns all conversations for the user (without full message history).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        conversations = ChatConversation.objects.filter(user=request.user)
        serializer = ChatConversationListSerializer(conversations, many=True)
        return Response(serializer.data)


class ConversationDetailView(APIView):
    """
    GET /api/rag/conversations/<id>/
    Returns a conversation with its full message history.

    DELETE /api/rag/conversations/<id>/
    Deletes a conversation and all its messages.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            conversation = ChatConversation.objects.get(id=pk, user=request.user)
            serializer = ChatConversationSerializer(conversation)
            return Response(serializer.data)
        except ChatConversation.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

    def delete(self, request, pk):
        try:
            conversation = ChatConversation.objects.get(id=pk, user=request.user)
            conversation.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except ChatConversation.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)
