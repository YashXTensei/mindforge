# MindForge — Architectural Decisions

> Last Updated: 23 June 2026

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

## Timeline

| Date | Event |
|---|---|
| 21 June 2026 | Project conceived |
| 23 June 2026 | Architecture finalized, PostgreSQL setup, Phase 0 started |
| 30 June 2026 | Official Phase 1 development begins |
| 14 Aug 2026 | MIP Deployed to production (mindtensei.me) |
| 25 Aug 2026 | Phase 4 Complete (Learning Engine deployed) |