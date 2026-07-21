Phase 3 — RAG Engine Implementation Plan (v2)
Updated based on architecture review feedback. Changes: Processing status tracking, flexible embeddings, GenericForeignKey, failure handling, Cohere+Gemini split.

Architecture Decisions
1. Processing Status Pipeline
Track document/note processing through each stage with a status field:


PENDING → EXTRACTING → CHUNKING → EMBEDDING → COMPLETED
                                                   ↘ FAILED
Added to both Document and Note models as a new mixin/fields.

2. Flexible Embedding Dimensions
Instead of hardcoding VectorField(1024), dimensions will come from settings.py:

python

# settings.py
RAG_CONFIG = {
    'EMBEDDING_PROVIDER': 'cohere',
    'EMBEDDING_MODEL': 'embed-english-v3.0',
    'EMBEDDING_DIMENSIONS': 1024,
    'CHAT_PROVIDER': 'gemini',
    'CHAT_MODEL': 'gemini-2.0-flash',
    'CHUNK_SIZE': 500,        # tokens
    'CHUNK_OVERLAP': 50,      # tokens
    'SEARCH_TOP_K': 10,
}
Migration mein dimension dynamically read hogi settings se.

3. GenericForeignKey for Chunk → Source
Instead of raw source_type + source_id strings, use Django's contenttypes framework:

python

from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
class Chunk(models.Model):
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    source = GenericForeignKey('content_type', 'object_id')
Benefits: Database-level integrity, proper cascading deletes, Django admin support.

4. Failure Handling
Add error tracking fields for retry logic:

python

error_message = models.TextField(blank=True, default='')
retry_count = models.IntegerField(default=0)
failed_at = models.DateTimeField(null=True, blank=True)
5. AI Provider Split
Task	Provider	Model	Why
Embeddings	Cohere	embed-english-v3.0	Best free embed API, 1024 dims
Chat/Generation	Google Gemini	gemini-2.0-flash	Fast, generous free tier
Updated Model Schemas
New Mixin: ProcessingMixin
Added to Document and Note models:

python

class ProcessingStatus(models.TextChoices):
    PENDING = 'pending', 'Pending'
    EXTRACTING = 'extracting', 'Extracting Text'
    CHUNKING = 'chunking', 'Chunking'
    EMBEDDING = 'embedding', 'Generating Embeddings'
    COMPLETED = 'completed', 'Completed'
    FAILED = 'failed', 'Failed'
class ProcessingMixin(models.Model):
    processing_status = models.CharField(
        max_length=20,
        choices=ProcessingStatus.choices,
        default=ProcessingStatus.PENDING,
    )
    error_message = models.TextField(blank=True, default='')
    retry_count = models.IntegerField(default=0)
    failed_at = models.DateTimeField(null=True, blank=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    class Meta:
        abstract = True
Chunk Model (Updated)
python

class Chunk(models.Model):
    # GenericForeignKey → links to Note OR Document
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    source = GenericForeignKey('content_type', 'object_id')
    # Content
    content = models.TextField()                      # chunk ka actual text
    embedding = VectorField(dimensions=settings.RAG_CONFIG['EMBEDDING_DIMENSIONS'])
    # Metadata
    chunk_index = models.IntegerField()               # order within source
    source_title = models.CharField(max_length=255)   # denormalized for quick access
    metadata = models.JSONField(default=dict)         # {page_num, section, char_start, char_end}
    # Ownership
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        ordering = ['content_type', 'object_id', 'chunk_index']
        indexes = [
            models.Index(fields=['content_type', 'object_id']),
            models.Index(fields=['user']),
        ]
ChatConversation Model
python

class ChatConversation(models.Model):
    title = models.CharField(max_length=255, default='New Chat')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        ordering = ['-updated_at']
ChatMessage Model
python

class ChatMessage(models.Model):
    class Role(models.TextChoices):
        USER = 'user', 'User'
        ASSISTANT = 'assistant', 'Assistant'
    conversation = models.ForeignKey(
        ChatConversation, on_delete=models.CASCADE, related_name='messages'
    )
    role = models.CharField(max_length=10, choices=Role.choices)
    content = models.TextField()
    sources = models.JSONField(default=list, blank=True)
    # sources format: [{"chunk_id": 1, "source_title": "...", "snippet": "...", "source_type": "note", "source_id": 5}]
    created_at = models.DateTimeField(auto_now_add=True)
Updated Technology Stack
Package	Version	Purpose
django-pgvector	latest	VectorField for Django
celery[redis]	latest	Background task queue
redis	latest	Celery broker
pymupdf	latest	PDF text extraction
cohere	latest	Embeddings API
google-generativeai	latest	Gemini chat API
tiktoken	latest	Token counting for chunking
Execution Steps (Updated)
Step 1: Infrastructure Setup
 Install PGVector extension in PostgreSQL
 Install Redis (WSL/Docker/Memurai)
 pip install all new packages
 Add Celery config to Django (config/celery.py, update __init__.py)
 Add RAG_CONFIG to settings.py
 Add API keys to .env (COHERE_API_KEY, GEMINI_API_KEY)
 Verify Celery worker starts and connects to Redis
Step 2: rag App + Models
 python manage.py startapp rag
 Create ProcessingMixin
 Add processing fields to Document and Note models (migration)
 Create Chunk, ChatConversation, ChatMessage models
 Run migrations
 Register in INSTALLED_APPS
Step 3: Text Extraction
 Create rag/extraction.py
 extract_text_from_pdf(file_path) → returns {pages: [{page_num, text}]}
 extract_text_from_note(note) → returns plain text
 Unit tests for extraction
Step 4: Chunking Pipeline
 Create rag/chunking.py
 chunk_text(text, chunk_size=500, overlap=50) → returns list of chunks
 Each chunk: {content, chunk_index, metadata}
 Unit tests for chunking edge cases
Step 5: Embeddings Service
 Create rag/embeddings.py
 generate_embeddings(texts: list[str]) → returns list of vectors
 Batch processing (Cohere allows 96 per call)
 Error handling + retry logic
 Unit test with mock API
Step 6: Celery Tasks
 Create rag/tasks.py
 process_document(document_id) → extract → chunk → embed → save
 process_note(note_id) → chunk → embed → save
 reprocess_failed(source_type, source_id) → retry failed items
 Django signal: post_save on Document → queue task
 Status updates at each pipeline stage
 Error handling: set FAILED status + error_message
Step 7: Semantic Search API
 Create rag/search.py
 semantic_search(query, user, top_k=10) → returns ranked chunks
 API endpoint: GET /api/rag/search/?q=...
 Serializer for search results
 Combine with existing keyword search (hybrid search)
Step 8: RAG Chat API
 Create rag/chat.py
 System prompt template with context injection
 POST /api/rag/chat/ → create message + get AI response
 GET /api/rag/conversations/ → list conversations
 GET /api/rag/conversations/:id/ → get messages
 Source citation extraction + formatting
 Gemini API integration
Step 9: Frontend Chat UI
 New /chat route + page
 Conversation sidebar (list)
 Chat message bubbles (user + assistant)
 Source citations (clickable, expandable)
 Input box with send button
 Loading states + error handling
 Semantic search toggle on existing Search page
Open Questions (Resolved ✅)
Question	Decision
AI Provider for embeddings?	✅ Cohere (embed-english-v3.0)
AI Provider for chat?	✅ Google Gemini (gemini-2.0-flash)
Index Resources (URLs)?	❌ Not now, Phase 4
Processing status tracking?	✅ Yes, ProcessingMixin on Document + Note
Embedding dimensions?	✅ Configurable via settings.RAG_CONFIG
Chunk→Source relation?	✅ GenericForeignKey (contenttypes)
Failure handling?	✅ error_message, retry_count, failed_at
IMPORTANT

Still Need From You:
Redis — Kaise install karoge? (WSL / Docker / Memurai)
Cohere API Key — https://dashboard.cohere.com/api-keys se free mein mil jayega
Gemini API Key — https://aistudio.google.com/apikey se free mein mil jayega
Verification Plan
Automated Tests
bash

pytest rag/tests/ -v
Chunk model CRUD
Chunking function (edge cases: empty text, very long text, special chars)
Extraction function (PDF with multiple pages)
Search relevance (known query → expected chunks)
Manual Verification
Upload PDF → DB mein chunks + embeddings check karo
Processing status UI mein real-time update dikhe
Semantic search → meaningful, ranked results
Chat → accurate answer with correct source citations
Failed processing → retry karne pe recover ho