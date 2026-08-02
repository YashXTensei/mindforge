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

### 4. Image Intelligence (Phase 3.5 - Partial)
- **Standalone Image Extraction:** Uploaded images (.png, .jpg) are now processed inline using Google Gemini Vision (model: `models/gemini-3.6-flash`).
- **Polymorphic Extractor Pattern:** Extractor logic refactored into `BaseExtractor`, `PDFExtractor`, and `ImageExtractor`.

---

## 🔴 What is Pending (To-Do)

### Phase 3.5 (Deployment Prep: UI/UX, Security, Tests)
- [ ] **Rate Limiting:** Implement rate limits for the AI chat endpoint to prevent abuse, and Celery task-level limits.
- [ ] **UI/UX Polishing:** Loading skeletons, empty states, chat code-block syntax highlighting, mobile responsiveness, and manual RAG-trigger UI for Notes.
- [ ] **Security:** Separate `settings.py` for prod/dev, hide `SECRET_KEY`, set `DEBUG = False`, lock down CORS.
- [ ] **Routing:** Protected route guards for React frontend.
- [ ] **Testing:** Write `pytest` test suite for the RAG engine (`rag/tests.py`).

### Phase 4+ (Future Enhancements)
- [ ] **PDF Embedded Images:** Update `PDFExtractor` to extract images embedded inside PDFs, process them via `ImageExtractor`, and append the text.
- [ ] **Duplicate OCR Detection:** Integrate the `difflib` threshold check to prevent duplicating text that already exists in the PDF text layer.

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
