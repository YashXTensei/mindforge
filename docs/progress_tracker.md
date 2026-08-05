# MindForge Progress Tracker & Changelog

This document tracks everything built in MindForge, what remains to be built, and a chronological log of updates. This serves as the master context file to share progress quickly.

---

## 🟢 What Has Been Built So Far (Current State)

### 1. Core Platform & User Accounts
- **User Authentication:** Registration, Login, Logout (JWT-based).
- **Taxonomy System:** Categories and Tags for organizing knowledge.
- **Search System:** Global full-text search across Notes, Documents, and Resources using PostgreSQL.

### 2. Notes & Resources (Phase 1 & 2)
- **Notes Module:** Markdown-based notes editor with CRUD operations, pinning, categorization, and tagging.
- **Resources Vault:** Bookmark manager to store and organize URLs/links.
- **PDF Vault:** File upload system for PDF storage.

### 3. RAG Engine (Phase 3)
- **Document Ingestion (Celery):** Background processing pipeline for documents using Celery and Redis. Auto-triggers on upload.
- **Text Extraction:** Uses PyMuPDF (`fitz`) to extract text layer from PDFs.
- **Token-Aware Chunking:** Uses `tiktoken` (cl100k_base) to chunk text with specific limits (500 tokens) and overlap (50 tokens).
- **Vector Embeddings:** Provider pattern implemented. Currently uses Cohere (`embed-english-v3.0`).
- **Vector Database:** PostgreSQL with `pgvector` extension.
- **Semantic Search:** Uses `CosineDistance` to find the most relevant chunks.
- **AI Chat (Gemini):** Context-aware chatbot in the UI. Prioritizes Vault context but falls back to general knowledge seamlessly. Formats errors elegantly.
- **Database Hygiene:** `GenericRelation` implemented to cascade-delete Chunks/Embeddings automatically when a Document/Note is deleted.

### 4. Image Intelligence (Phase 3.5)
- **Standalone Image Extraction:** Uploaded images (.png, .jpg) are now processed inline using Google Gemini Vision (model: `models/gemini-3.6-flash`).
- **Polymorphic Extractor Pattern:** Extractor logic refactored into `BaseExtractor`, `PDFExtractor`, and `ImageExtractor`.

### 5. Rate Limiting (Phase 4)
- **API Throttling (DRF):** Chat API (10/min), Semantic Search (10/min), General API (120/min) using `ScopedRateThrottle`.
- **Celery Task Throttling:** Document/Note processing limited to 5/min per worker.
- **Friendly Error Responses:** Custom DRF exception handler returns clean JSON instead of raw error text.
- **Centralized Config:** All rate limits defined in `RATE_LIMITS` dict in `settings.py`.

---

## 🔴 What is Pending (To-Do)

### Phase 4 (Deployment Prep: UI/UX, Security, Tests)
- [x] **Rate Limiting:** DRF throttling + Celery task rate limits + friendly error responses.
- [ ] **UI/UX Polishing:** Loading skeletons, empty states, chat code-block syntax highlighting, mobile responsiveness, and manual RAG-trigger UI for Notes.
- [ ] **Security:** Separate `settings.py` for prod/dev, hide `SECRET_KEY`, set `DEBUG = False`, lock down CORS.
- [ ] **Routing:** Protected route guards for React frontend.
- [ ] **Testing:** Write `pytest` test suite for the RAG engine (`rag/tests.py`).

### Phase 5+ (Future Enhancements)
- [ ] **PDF Embedded Images:** Update `PDFExtractor` to extract images embedded inside PDFs, process them via `ImageExtractor`, and append the text.
- [ ] **Duplicate OCR Detection:** Integrate the `difflib` threshold check to prevent duplicating text that already exists in the PDF text layer.
- [ ] **Fallback Model Router:** Build a smart AI router (`ModelRouter`) that holds multiple API keys (Gemini, OpenRouter, OpenAI, etc.). If one model's rate limit is exhausted or fails, it automatically falls back to the next available model.

---

## 📅 Chronological Changelog

### July 30 - August 8, 2026 (Foundation & RAG Engine Complete)
- **Backend:** Setup Django, Celery, Redis, and PostgreSQL (`pgvector`).
- **RAG Pipeline:** Built the entire pipeline (Extract -> Chunk -> Embed -> Save).
- **Frontend:** Built Vault UI, Notes UI, and integrated AI Chat Sidebar.
- **Bug Fixes:** 
  - Fixed tracebacks leaking into Chat UI. Added elegant rate-limit error messages.
  - Implemented `GenericRelation` to fix orphan chunks when deleting documents.
  - Fixed file caching issue when re-uploading documents.
- **Phase 3.5 Init:** Designed ADR for Image Intelligence. Created `rag/vision.py` and converted extraction logic to a factory pattern (`BaseExtractor`). Successfully tested standalone image OCR with `CodeForces_Rating` image.

*(Going forward, updates will be logged here daily with dates and specific actions taken.)*

### August 3, 2026
- **Rate Limiting:** Implemented DRF `ScopedRateThrottle` on Chat (10/min) and Search (10/min) endpoints.
- **Celery Limits:** Added `rate_limit='5/m'` to `process_document` and `process_note` tasks.
- **Custom Exception Handler:** Created `config/exceptions.py` for user-friendly throttle error messages.
- **Centralized Config:** All rate limits stored in `RATE_LIMITS` dict in `settings.py`.

proxy commits count : 3