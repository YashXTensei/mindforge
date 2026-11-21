# MindForge Progress Tracker & Changelog

This document tracks everything built in MindForge, what remains to be built, and a chronological log of updates. This serves as the master context file to share progress quickly.

---

## 🟢 What Has Been Built So Far (Current State)

### 1. Core Platform & User Accounts
- **User Authentication:** Registration, Login, Logout (JWT-based with SimpleJWT token rotation).
- **Taxonomy System:** Categories and Tags for organizing knowledge.
- **Search System:** Global full-text search across Notes, Documents, and Resources using PostgreSQL `tsvector`.

### 2. Notes & Resources (Phase 1 & 2)
- **Notes Module:** Markdown-based notes editor with CRUD operations, pinning, categorization, and tagging.
- **Resources Vault:** Bookmark manager to store and organize URLs/links.
- **PDF Vault:** File upload system for PDF storage with Cloudinary backing.

### 3. RAG Engine (Phase 3)
- **Document Ingestion (Celery):** Background processing pipeline for documents using Celery and Redis. Auto-triggers on upload.
- **Text Extraction:** Uses PyMuPDF (`fitz`) to extract text layer from PDFs.
- **Token-Aware Chunking:** Uses `tiktoken` (cl100k_base) to chunk text with specific limits (500 tokens) and overlap (50 tokens).
- **Vector Embeddings:** Provider pattern implemented. Uses Cohere (`embed-english-v3.0`, 1024 dimensions).
- **Vector Database:** PostgreSQL with `pgvector` extension and HNSW indexing.
- **Semantic Search:** Uses `CosineDistance` to find the most relevant chunks.
- **AI Chat (Gemini):** Context-aware chatbot in the UI. Prioritizes Vault context with source citations, but falls back to general knowledge seamlessly.
- **Database Hygiene:** `GenericRelation` implemented to cascade-delete Chunks/Embeddings automatically when a Document/Note is deleted.

### 4. Image Intelligence (Phase 3.5)
- **Standalone Image Extraction:** Uploaded images (.png, .jpg) are processed inline using Google Gemini Vision (`gemini-3.1-flash-lite`).
- **Polymorphic Extractor Pattern:** Extractor logic refactored into `BaseExtractor`, `PDFExtractor`, and `ImageExtractor`.
- **Scanned PDF Math OCR:** Fallback to batch page rendering with Gemini Vision for math-heavy scanned documents.

### 5. Active Learning Engine (Phase 4)
- **Topic Extraction:** Automatically extracts learning topics from uploaded PDFs and Notes using Gemini.
- **Mastery Tracking (SM-2):** Tracks user confidence on each topic using the SM-2 Spaced Repetition algorithm.
- **Re-upload & Duplicate Protection:** Uses case-insensitive fuzzy matching to deduplicate topics across uploads.
- **Daily Review Session:** Interactive MCQ quiz UI that tests users on due topics. AI generates questions and "Why am I reviewing this?" context on the fly with RAG context chunks.
- **Mobile Responsiveness:** Added hamburger menu, mobile-friendly navigation, and auto-hiding chat sidebar.
- **Phase 4 Hardening:** 15 major fixes implemented, including RAG-based context retrieval for questions, fully functional SM-2 scoring, robust Gemini output validation, preserved review history on document deletion, and performance optimizations.

### 6. Knowledge Compiler & Graph (Phase 5)
- **Knowledge Compiler:** Celery task extracts factual Claims with evidence quotes from documents and notes.
- **Semantic Relationship Detection:** AI maps Prerequisite (`PREREQ`) and Related (`RELATED`) connections between topics with confidence scores and reasoning.
- **Interactive Knowledge Graph (2D):** Force-directed graph (`react-force-graph-2d`) where nodes = topics, node color = mastery level (red → yellow → green), and edges = prerequisite links.
- **Knowledge Gap Analysis:** BFS graph traversal that analyzes prerequisite chains to answer "What am I missing to learn X?", highlighting unlearned prerequisites.
- **Blind Spot Detection:** Visual identification of isolated topics that lack prerequisite or related connections.

### 7. Contradiction Radar (Phase 6.1) — NEW!
- **`intelligence` Django App:** Model `Contradiction` tracking opposing claims (`claim_a`, `claim_b`), severity level (low, medium, high), AI explanation, and reconciliation status.
- **Claim Vector Embeddings:** Added 1024-dimension `VectorField` on `Claim` model via pgvector, embedded with Cohere Embed v3.
- **Two-Stage Conflict Pipeline:** Fast CosineDistance filtering (<0.35) identifies claim candidates from different sources, followed by structured LLM verification using Gemini 3.1 Flash-Lite.
- **Celery Integration:** Step 7 in document and note processing pipelines triggers automated contradiction detection non-fatally.
- **Contradiction Radar UI (`/contradictions`):** Side-by-side claim comparison with source attribution, topic tags, evidence quotes, AI conflict reasoning, and interactive "Mark as Reconciled" workflow.
- **Dashboard Alert:** Real-time Knowledge Conflicts banner alerting users to contradictions across their vault with one-click navigation to resolve them.

---

## 🔴 What is Pending (To-Do)

### Phase 6 (Remaining Sub-phases)
- [ ] **Phase 6.3 — Learning Analytics Dashboard (NEXT):**
  - Learning velocity chart (topics mastered per week)
  - Retention & forgetting curves per topic
  - Weakest and strongest topic rankings
  - Knowledge coverage map (mastered vs stored)
  - Frontend `/analytics` page with Recharts visualizations
- [ ] **Phase 6.2 — Cross-Document Synthesis (Optional):**
  - "Insight Cards" surfacing non-obvious conceptual connections across different sources
- [ ] **Phase 6.4 — Intelligence Report (Optional/Deferred):**
  - On-demand intelligence summary report synthesizing newly acquired topics, contradictions, and decayed memories

### Phase 7 (Study Planner & Daily Brief)
- [ ] Goal creation with target completion dates and auto-linked vault content
- [ ] AI-generated week-by-week study schedule prioritized by mastery and prerequisite chains
- [ ] Dynamic progress tracking based on actual SM-2 confidence levels
- [ ] Daily Brief on login summarizing weekly focus and due reviews

---

## 📅 Chronological Changelog

### November 9-18, 2026 (Phase 6.1 Contradiction Detection, Model Migration & Port Separation)
- **Google GenAI SDK 2.x & Model Migration:** Upgraded from deprecated `google-generativeai` SDK to official `google-genai` (2.14.0+). Migrated retired models (gemini-1.5/2.0/2.5) to active production models:
  - Chat & Quiz Generation: `gemini-3.5-flash`
  - Extraction, Vision & Conflict Verification: `gemini-3.1-flash-lite`
- **Error Handling & Resilience:** Added 503 high-demand retry handling in chat, Markdown fence stripping in JSON parsers, and NoneType guardrails across `generation.py` and `graph/services.py`.
- **Phase 6.1 Contradiction Detection:** Built full-stack `intelligence` app:
  - Database schema: `Contradiction` model with foreign keys to `Claim`, severity choices, and resolution fields.
  - Vector embeddings added to `Claim` model (`VectorField(1024)`).
  - Detection service using Cohere claim embedding + pgvector cosine similarity + Gemini 3.1 Flash-Lite JSON confirmation.
  - Celery pipeline Step 7 added to both `process_document` and `process_note`.
  - Frontend Contradictions page (`/contradictions`) with filter tabs, side-by-side comparison cards, and reconciliation modal.
  - Dashboard alert banner highlighting unresolved knowledge conflicts.
- **Frontend Port Standardization (Port 5180):** Configured Vite dev server to use port `5180` with `strictPort: true` to prevent collisions with parallel local projects (e.g., YatraSetu on 5173). Updated backend `CORS_ALLOWED_ORIGINS` in `config/settings.py` and `.env`.

### September 10-24, 2026 (Phase 5: Knowledge Compiler & Interactive Graph)
- **Knowledge Compiler:** Implemented Celery tasks extracting atomic claims and prerequisite/related relationships between topics.
- **Graph Visualization:** Built interactive 2D Force-Directed Graph UI using `react-force-graph-2d` with topic mastery coloring and edge tooltips.
- **Gap Analysis Algorithm:** Implemented BFS graph traversal to calculate missing prerequisites and visualize blind spots.
- **CI Pipeline:** Added GitHub Actions for automated backend tests and frontend Vite builds.

### September 6-7, 2026 (Phase 4 Hardening — 15 Bug Fixes & Improvements)
- **Fixed Document Context Retrieval:** `DailyReviewView` now uses `rag.search.semantic_search` to fetch relevant chunks for question generation.
- **SM-2 Algorithm Fixed:** Changed quality scoring from 4→5 (correct) so Easiness Factor actually changes (+0.1 per correct). Applied EF formula on incorrect answers.
- **Gemini Output Validation:** Added `validate_question()` helper to gracefully skip malformed AI output.
- **Review History Preserved:** Changed `ReviewItem.mastery` from `CASCADE` to `SET_NULL`. Deleting documents no longer wipes historical quiz data.
- **Session Score Calculated:** `ReviewSession.score` is now computed on completion.
- **New Field:** `extract_topics` boolean on Document and Note.

### July 30 - August 25, 2026 (Foundations, RAG Engine & Phase 4 Learning Engine)
- Setup Django, Celery, Redis, and PostgreSQL (`pgvector`).
- Built RAG Pipeline (Extract -> Chunk -> Embed -> Save).
- Built Vault UI, Notes UI, and integrated AI Chat Sidebar.
- Phase 4 Active Learning Engine with SM-2 Spaced Repetition, `/topics` Knowledge Map, and `/review` Daily Quiz pages.
