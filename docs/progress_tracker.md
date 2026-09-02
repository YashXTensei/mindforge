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

### 5. Active Learning Engine (Phase 4) - NEW!
- **Topic Extraction:** Automatically extracts learning topics from uploaded PDFs and Notes using Gemini.
- **Mastery Tracking (SM-2):** Tracks user confidence on each topic using the SM-2 Spaced Repetition algorithm.
- **Re-upload & Duplicate Protection:** Uses case-insensitive fuzzy matching to deduplicate topics when similar files are uploaded.
- **Daily Review Session:** Interactive MCQ quiz UI that tests users on due topics. AI generates questions and "Why am I reviewing this?" context on the fly.
- **Mobile Responsiveness:** Added hamburger menu, mobile-friendly navigation, and auto-hiding chat sidebar.
- **Error Handling:** Graceful API and UI handling for rate limits, registration/login failures, and quiz generation errors.

---

## 🔴 What is Pending (To-Do)

### Phase 5 (The Network Effect - Interactive Graph)
- [ ] Backend graph extraction: Knowledge Compiler analyzes connections between chunks/topics and builds semantic nodes (Claims) and edges (Relationships like PREREQ, RELATED).
- [ ] Build 2D Force-Directed Graph UI (using `react-force-graph-2d`).
- [ ] Implement graph filtering, zooming, and node click actions.
- [ ] Knowledge Gap Analysis & Blind Spot Detection.

### Phase 6 (Intelligent Agents - "Your Second Brain at Work")
- [ ] **Curiosity Engine:** Background agent that finds connections between old and new notes and sends "Did you know?" notifications.
- [ ] **The "Devil's Advocate" Agent:** Agent that challenges your ideas when you write notes.
- [ ] **Content Synthesizer:** Weekly summary agent that emails/notifies you about what you learned.

### Phase 7 (Polish, Security & Deployment)
- [ ] Comprehensive Testing (`pytest`).
- [ ] UI/UX final touch-ups (skeletons, dark mode consistency).

---

## 📅 Chronological Changelog

### August 31 - September 1, 2026 (Deployment, Math OCR, Multi-Model Routing & Polish)
- **Deployment & Cloudinary:** Configured production environment with Heroku, PostgreSQL, Redis (Celery), and Cloudinary `RawMediaCloudinaryStorage`.
- **Advanced OCR (Math PDFs):** PyMuPDF `get_text` falls back to generating JPEGs for empty/scanned pages. Built `describe_pdf_pages_batch` in `rag/vision.py` to send batches of 10 pages to Gemini Vision, drastically improving math symbol and scanned document transcription.
- **Frontend Math Rendering:** Integrated `remark-math` and `rehype-katex` in `ReactMarkdown`. Configured `{strict: false}` to gracefully handle malformed AI block boundaries without red crash screens.
- **Multi-Model Routing:** Split AI responsibilities across specific models to optimize speed and cost:
  - `CHAT_MODEL` (gemini-3.7-flash) for AI Chat
  - `QUESTION_MODEL` (gemini-3.6-flash) for Quiz Generation
  - `VISION_MODEL` & `EXTRACTION_MODEL` (gemini-3.5-flash-lite) for OCR and Topic Extraction
- **API Stability:** Added explicit 45s timeouts to `google.generativeai` calls to prevent Gunicorn workers from locking up on Heroku. Added context (previous 4 questions and user mastery stats) to batch question generation to prevent repetitive questions.


### July 30 - August 8, 2026 (Foundation & RAG Engine Complete)
- Setup Django, Celery, Redis, and PostgreSQL (`pgvector`).
- Built RAG Pipeline (Extract -> Chunk -> Embed -> Save).
- Built Vault UI, Notes UI, and integrated AI Chat Sidebar.
- Implemented `GenericRelation`, standalone Image OCR, rate limiting, and custom DRF exception handlers.

### August 25, 2026 (Phase 4: Active Learning Engine Complete)
- **Backend:** Created `learning` app, `TopicMastery`, `TopicSource`, `ReviewSession`, `ReviewItem` models.
- **Algorithm:** Implemented SM-2 Spaced Repetition (`learning/sm2.py`) with progressive confidence building.
- **Celery:** Hooked Gemini topic extraction into existing RAG pipeline (`process_document` and `process_note`). Added fuzzy matching to prevent duplicates.
- **Frontend:** Built `/topics` Knowledge Map and `/review` Daily Quiz pages with API integration and smart error handling.
- **UI Fixes:** Added mobile responsiveness (hamburger menu, sliding chat sidebar). Fixed Toaster messages for auth errors.

<!-- phase 4 -->

### August 18, 2026 :- Added "Learning" app
### August 19, 2026 :- Added "generation.py"
### August 20, 2026 :- Added "service.py"

proxy commits count : 5