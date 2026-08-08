"""
RAG Engine Tests — Testing the AI pipeline without hitting real APIs.

Strategy:
  - Mock Cohere (embeddings) and Gemini (chat) to avoid API costs.
  - Test the logic, not the external services.
"""

import pytest
from unittest.mock import patch, MagicMock
from django.contrib.auth.models import User
from django.contrib.contenttypes.models import ContentType
from rest_framework.test import APIClient

from rag.models import Chunk, ChatConversation, ChatMessage
from rag.chat import requires_previous_context


# ──────────────────────────────────────────────
# Fixtures
# ──────────────────────────────────────────────

@pytest.fixture
def user(db):
    """Create a test user."""
    return User.objects.create_user(username='testuser', password='testpass123')


@pytest.fixture
def auth_client(user):
    """Authenticated API client."""
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.fixture
def sample_chunks(user):
    """Create sample chunks with fake embeddings for testing."""
    ct = ContentType.objects.get_for_model(User)  # dummy content type
    fake_embedding = [0.1] * 1024  # 1024-dim zero-ish vector

    chunks = []
    for i, (title, content) in enumerate([
        ('React Notes', 'React is a JavaScript library for building user interfaces.'),
        ('Python Basics', 'Python is a high-level programming language known for simplicity.'),
        ('Codeforces Rating', 'My current Codeforces rating is 1504, Specialist rank.'),
    ]):
        chunk = Chunk.objects.create(
            user=user,
            content_type=ct,
            object_id=1,
            content=content,
            embedding=fake_embedding,
            embedding_model='embed-english-v3.0',
            chunk_index=i,
            source_title=title,
            metadata={'page_num': 1},
        )
        chunks.append(chunk)
    return chunks


# ──────────────────────────────────────────────
# 1. Context Dependency Detection Tests
# ──────────────────────────────────────────────

class TestContextDependencyDetection:
    """Test the requires_previous_context() helper."""

    def test_short_standalone_query(self):
        """Short but self-contained queries should NOT need context."""
        assert requires_previous_context('What is Redis') is False

    def test_pronoun_detected(self):
        """Queries with pronouns like 'it', 'this' need context."""
        assert requires_previous_context('Tell me more about it') is True

    def test_again_detected(self):
        """'again' is a strong context signal."""
        assert requires_previous_context('Check again?') is True

    def test_standalone_query(self):
        """Fully self-contained queries should NOT need context."""
        assert requires_previous_context('Explain how AVL trees work in detail') is False

    def test_recheck_detected(self):
        """'recheck' should trigger context dependency."""
        assert requires_previous_context('Recheck the results please') is True

    def test_continue_detected(self):
        """'continue' should trigger context dependency."""
        assert requires_previous_context('Continue from where you left off') is True


# ──────────────────────────────────────────────
# 2. Semantic Search Tests (with mocked embeddings)
# ──────────────────────────────────────────────

class TestSemanticSearch:
    """Test semantic search with threshold and recency boosting."""

    @pytest.mark.django_db
    @patch('rag.search.generate_query_embedding')
    def test_search_returns_results(self, mock_embed, user, sample_chunks):
        """Search should return chunks when embedding matches."""
        from rag.search import semantic_search
        mock_embed.return_value = [0.1] * 1024  # Same as sample chunks

        results = semantic_search('React JavaScript', user)
        assert len(results) > 0
        assert all('score' in r for r in results)
        assert all('final_score' in r for r in results)

    @pytest.mark.django_db
    @patch('rag.search.generate_query_embedding')
    def test_search_respects_user_isolation(self, mock_embed, sample_chunks):
        """User A should not see User B's chunks."""
        from rag.search import semantic_search
        mock_embed.return_value = [0.1] * 1024

        other_user = User.objects.create_user(username='otheruser', password='pass123')
        results = semantic_search('React', other_user)
        assert len(results) == 0

    @pytest.mark.django_db
    @patch('rag.search.generate_query_embedding')
    def test_search_results_have_created_at(self, mock_embed, user, sample_chunks):
        """Results should include created_at for temporal awareness."""
        from rag.search import semantic_search
        mock_embed.return_value = [0.1] * 1024

        results = semantic_search('React', user)
        if results:
            assert 'created_at' in results[0]

    @pytest.mark.django_db
    @patch('rag.search.generate_query_embedding')
    def test_empty_query_returns_empty(self, mock_embed, user):
        """Empty query should return empty results."""
        from rag.search import semantic_search
        results = semantic_search('', user)
        assert results == []
        mock_embed.assert_not_called()


# ──────────────────────────────────────────────
# 3. Chat API Tests (with mocked Gemini)
# ──────────────────────────────────────────────

class TestChatAPI:
    """Test chat endpoints and conversation management."""

    @pytest.mark.django_db
    def test_chat_requires_auth(self):
        """Unauthenticated users should get 401."""
        client = APIClient()
        response = client.post('/api/rag/chat/', {'message': 'Hello'})
        assert response.status_code == 401

    @pytest.mark.django_db
    def test_chat_empty_message(self, auth_client):
        """Empty message should return 400."""
        response = auth_client.post('/api/rag/chat/', {'message': ''})
        assert response.status_code == 400

    @pytest.mark.django_db
    def test_conversation_list(self, auth_client, user):
        """Should return user's conversations."""
        ChatConversation.objects.create(user=user, title='Test Chat')
        response = auth_client.get('/api/rag/conversations/')
        assert response.status_code == 200
        assert len(response.data) == 1

    @pytest.mark.django_db
    def test_conversation_isolation(self, auth_client):
        """User should not see other users' conversations."""
        other_user = User.objects.create_user(username='other', password='pass123')
        ChatConversation.objects.create(user=other_user, title='Secret Chat')

        response = auth_client.get('/api/rag/conversations/')
        assert response.status_code == 200
        assert len(response.data) == 0

    @pytest.mark.django_db
    def test_conversation_delete(self, auth_client, user):
        """User should be able to delete their own conversation."""
        conv = ChatConversation.objects.create(user=user, title='To Delete')
        response = auth_client.delete(f'/api/rag/conversations/{conv.id}/')
        assert response.status_code == 204
        assert not ChatConversation.objects.filter(id=conv.id).exists()

    @pytest.mark.django_db
    def test_conversation_delete_other_user(self, auth_client):
        """User should NOT be able to delete another user's conversation."""
        other_user = User.objects.create_user(username='other2', password='pass')
        conv = ChatConversation.objects.create(user=other_user, title='Not Yours')
        response = auth_client.delete(f'/api/rag/conversations/{conv.id}/')
        assert response.status_code == 404


# ──────────────────────────────────────────────
# 4. RAG Processing Trigger Tests
# ──────────────────────────────────────────────

class TestProcessingTrigger:
    """Test the /api/rag/process/ endpoint."""

    @pytest.mark.django_db
    def test_trigger_requires_auth(self):
        """Unauthenticated should get 401."""
        client = APIClient()
        response = client.post('/api/rag/process/', {'type': 'note', 'id': 1})
        assert response.status_code == 401

    @pytest.mark.django_db
    def test_trigger_missing_params(self, auth_client):
        """Missing type or id should return 400."""
        response = auth_client.post('/api/rag/process/', {})
        assert response.status_code == 400

    @pytest.mark.django_db
    def test_trigger_invalid_type(self, auth_client):
        """Invalid type should return 400."""
        response = auth_client.post('/api/rag/process/', {'type': 'invalid', 'id': 1})
        assert response.status_code == 400


# ──────────────────────────────────────────────
# 5. Throttling Tests
# ──────────────────────────────────────────────

class TestThrottling:
    """Test rate limiting on AI endpoints."""

    @pytest.mark.django_db
    def test_search_requires_auth(self):
        """Unauthenticated search should get 401."""
        client = APIClient()
        response = client.get('/api/rag/search/?q=test')
        assert response.status_code == 401

    @pytest.mark.django_db
    def test_search_empty_query(self, auth_client):
        """Empty search query should return 400."""
        response = auth_client.get('/api/rag/search/?q=')
        assert response.status_code == 400
