# MindForge — Architectural Decisions

> Last Updated: 7 September 2026

---

## 2026-06-21 — Project Conceived

### Vision

MindForge is an AI learning companion that remembers what you're forgetting.

### Development Philosophy

- Complete features fully before adding new features
- Avoid feature creep
- Production practices (tests, Docker, CI) from Day 1
- Learn each technology deeply, don't just copy-paste

---

## 2026-06-23 — Architecture Finalized

### Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React + Vite | Known basics, Vite is faster than CRA |
| Styling | CSS (then gradually Tailwind) | Start with what's known |
| Backend | Django REST Framework | Known Django, DRF is the natural next step |
| Database | PostgreSQL | Needed for PGVector and full-text search |
| Vector Search | PGVector | Lives inside PostgreSQL, no extra service |
| File Storage | Local filesystem → MinIO later | Start simple |
| Cache/Queue | Redis + Celery | Phase 3 onwards for background processing |
| AI (Chat) | Google Gemini Flash (free) | Best free quality |
| AI (Embeddings) | Cohere Embed v3 (free) | Free, high quality embeddings |
| AI (Local Dev) | Ollama | Zero cost, no API limits while testing |
| Deployment | Railway / Render | Free tiers available |

### Key Decisions

#### Monolith vs. Microservices

**Decision:** Django monolith

**Reason:** Solo developer, shared database, simpler deployment. Microservices add operational overhead with zero benefit at this scale.

#### REST vs. GraphQL

**Decision:** REST for CRUD, WebSocket/SSE for AI chat streaming

**Reason:** REST is simpler for standard operations. Streaming AI responses need WebSocket or SSE.

#### SQLite vs. PostgreSQL

**Decision:** PostgreSQL from Day 1

**Reason:** PGVector (Phase 3) only works with PostgreSQL. Full-text search is built-in. Migrating later causes data migration pain.

#### State Management (Frontend)

**Decision:** React Query (TanStack Query)

**Reason:** Server state is the primary concern. React Query handles caching, refetching, and optimistic updates out of the box.

#### RAG Chunk Design

**Decision:** Generic Chunk model with `source_type` + `source_id`

**Reason:** Single semantic search across Notes, PDFs, and Resources without 3 nullable foreign keys. Uses Django's ContentType framework.

#### Category System

**Decision:** Shared Category table across Notes, PDFs, Resources

**Reason:** User creates "Backend" once, it appears everywhere. No duplication.

#### Goals/Tasks Placement

**Decision:** Deferred to Phase 6 (AI Actions)

**Reason:** Goals and Tasks become significantly more impressive when AI can create and manage them via natural language. Building CRUD first, then adding AI management is wasted effort.

#### AI Provider Strategy

**Decision:** Free APIs only (Gemini + Cohere + Ollama)

**Reason:** Zero cost during development and early usage. Cloud for quality, local for testing.

#### Authentication

**Decision:** JWT with access (15min) + refresh tokens (7 days), rotation enabled

**Reason:** Stateless auth for API, refresh rotation for security.

### API Design Principles

- Versioned: `/api/v1/`
- Consistent error format: `{ "error": { "code": "...", "message": "..." } }`
- Pagination: cursor-based for scalability
- Rate limiting: standard endpoints 100/min, AI endpoints 20/min

---

## 2026-08-01 — Phase 3.5 Image Intelligence

### Extractor Factory Pattern
**Decision:** Refactored text extraction into a polymorphic `BaseExtractor` pattern (`PDFExtractor`, `ImageExtractor`).
**Reason:** Allows the Celery pipeline to handle both PDFs and standalone images cleanly without `if/else` spaghetti. 

### Vision AI Provider
**Decision:** Google Gemini 1.5 Flash Vision
**Reason:** High accuracy for OCR and diagram understanding, and fits within the free tier rate limits. Used inline rather than storing intermediate image texts.

---

## 2026-08-25 — Phase 4 Active Learning Engine

### Topic Extraction Strategy
**Decision:** Auto-extract topics via LLM asynchronously *during* document ingestion (Celery) rather than relying on manual user tagging.
**Reason:** Reduces friction. Users upload PDFs and instantly get tracked topics.

### Deduplication
**Decision:** Case-insensitive exact match + fuzzy word-overlap matching (80%+ overlap of non-stop-words).
**Reason:** LLMs generate slightly different topic names (e.g., "React Props Vs State" vs "React Props And State") for the same concept across different documents.

### Spaced Repetition Algorithm
**Decision:** Modified SM-2 Algorithm.
**Reason:** Industry standard for flashcards (Anki). Modified the confidence formula (`min(1.0, accuracy * (reviews / 6))`) to ensure confidence ramps up gradually rather than hitting 100% after one correct answer.

### Question Generation
**Decision:** Just-in-Time LLM generation during the Daily Review session rather than pre-generating thousands of questions.
**Reason:** Saves database storage and ensures questions are adapted to the user's *current* weak areas and confidence level.

---

## 2026-09-07 — Phase 4 Hardening Pass

### Source-First Context Retrieval
**Decision:** Use `rag.search.semantic_search` to fetch relevant chunks for question generation instead of accessing `text_content`/`content` attributes on source objects.
**Reason:** `Document` model has no text fields — extracted text lives in `rag.Chunk`. Semantic search finds the most relevant chunks for each topic, providing better context than arbitrary text slices.

### ReviewItem Cascade Strategy
**Decision:** Changed `ReviewItem.mastery` from `CASCADE` to `SET_NULL`.
**Reason:** When users delete a document, the orphaned `TopicMastery` gets cleaned up (via signal). With CASCADE, all historical `ReviewItem` records were destroyed, corrupting `ReviewSession` data. SET_NULL preserves quiz history.

### SM-2 Quality Mapping
**Decision:** Map correct=5, incorrect=1, skip=0 (previously correct=4).
**Reason:** With quality=4, the SM-2 EF formula yields delta=0.0 (no change). Quality=5 gives +0.1 (EF increases for strong topics), quality=1 gives -0.54 (EF decreases for weak topics). This makes spaced repetition actually adapt.

### Extract Topics Toggle
**Decision:** Added `extract_topics` boolean field to `Document` and `Note` models (default=True).
**Reason:** Users upload personal/reference material (e.g., anime lists, personal docs) that shouldn't generate quiz topics. This gives users control without affecting RAG/search/chunking.

### Question Generation Guardrails
**Decision:** Added `validate_question()` helper and strict schema enforcement in batch generation.
**Reason:** Gemini occasionally returns malformed output (e.g., `correct_answer: "Option A"` instead of `"A"`). Without validation, `CharField(max_length=1)` throws `DataError` and crashes the entire daily review API.

---

## 2026-09-24 — Phase 5 Knowledge Graph & Compiler

### Explicit Topic ID Mapping for Relationships
**Decision:** When calling the LLM to identify prerequisite or related connections between topics, pass the list of known `TopicMastery` IDs and names rather than allowing free-form string matching.
**Reason:** Free-form generation led to phantom nodes and edge mismatches. Grounding relations to verified topic IDs ensured exact graph topology in `TopicRelationship`.

### 2D Force-Directed Graph vs 3D
**Decision:** Selected `react-force-graph-2d` canvas rendering over Three.js/3D.
**Reason:** 2D canvas is lightweight, has near-zero frame drops on lower-spec laptops, supports intuitive pan/zoom gestures, and cleanly displays node mastery colors (Red/Yellow/Green).

---

## 2026-11-09 — Gemini SDK 2.x Upgrade & Model Migration

### Official `google-genai` SDK Migration
**Decision:** Fully migrate from legacy `google-generativeai` (0.8.x) to official `google-genai` (2.x) with the unified `genai.Client()`.
**Reason:** Google deprecated 1.5-flash and early 2.0 models for new API calls. The new SDK provides native Pydantic schema validation, resilient connection handling, and direct alignment with current Gemini 3.x series models.

### Multi-Tier Model Allocation
**Decision:** Split system roles across two stable models:
- `gemini-3.5-flash`: Chat synthesis and Daily Review question generation (demands high reasoning and adherence to source context).
- `gemini-3.1-flash-lite`: Extraction, Vision OCR, and Contradiction Verification (sub-second latency, zero bloat, high throughput).

---

## 2026-11-09 — Phase 6.1 Contradiction Detection Strategy

### Two-Stage Detection Pipeline (pgvector + LLM Verification)
**Decision:** Instead of passing every document to an LLM to compare against all other documents (which would blow up context windows and API costs exponentially), use a two-stage filter:
1. Candidate Search: Compute claim vector embeddings (Cohere 1024d) and use `pgvector` CosineDistance (< 0.35 threshold) across opposing sources.
2. Conflict Verification: Pass candidate claim pairs to `gemini-3.1-flash-lite` with structured output schemas to confirm whether claims genuinely contradict each other and assess severity (low/medium/high).
**Reason:** $O(N)$ vector query vs $O(N^2)$ LLM calls. Ensures high precision and prevents false positives.

### Non-Blocking Celery Pipeline (Step 7)
**Decision:** Contradiction detection runs as an isolated, try-except wrapped Step 7 in the Celery document and note ingestion pipeline.
**Reason:** If an LLM spike or temporary rate limit occurs during conflict check, the core document upload, chunking, and topic extraction are never rolled back.

---

## 2026-11-17 — Dedicated Frontend Port Standardization

### Vite Port 5180 with `strictPort: true`
**Decision:** Set MindForge frontend server port explicitly to `5180` with `strictPort: true` instead of default Vite `5173`.
**Reason:** Eliminates collisions with other local projects (such as `YatraSetu` running on 5173). `strictPort: true` guarantees Vite will not silently increment to an arbitrary port if 5180 is busy.

---

## Timeline

| Date | Event |
|---|---|
| 21 June 2026 | Project conceived |
| 23 June 2026 | Architecture finalized, PostgreSQL setup, Phase 0 started |
| 30 June 2026 | Official Phase 1 development begins |
| 14 Aug 2026 | MIP Deployed to production (mindtensei.me) |
| 25 Aug 2026 | Phase 4 Complete (Learning Engine deployed) |
| 7 Sep 2026 | Phase 4 Hardening Complete (15 fixes) |
| 24 Sep 2026 | Phase 5 Complete (Knowledge Compiler & Interactive Graph) |
| 9 Nov 2026 | Phase 6.1 Complete (Contradiction Radar & Model Migration) |
| 17 Nov 2026 | Frontend Dedicated Port (5180) Standardized |