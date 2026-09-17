# MindForge Roadmap (Revised)

> Last Updated: 17 September 2026

## Vision

MindForge is an AI learning companion that remembers what you're forgetting.

Unlike Notion or Obsidian, MindForge doesn't just store your knowledge — it tracks what you've learned, detects what you're forgetting, and proactively guides your revision.

**Tagline:**

> Don't just store knowledge — talk to it, learn from it, and let AI manage it.

## Target User

Self-directed learners — CS students, competitive programmers, and developers who accumulate knowledge across dozens of PDFs, articles, and notes, but have no system to track what they've retained vs. what they've forgotten.

---

# Phase 0 — Foundation Setup

**Time: 1 week**

## Goal

Set up project infrastructure before writing features.

## Tasks

- [x] Design database schema (ER diagram)
- [x] Set up PostgreSQL
- [x] Create Django project + DRF setup
- [x] Create React project with Vite
- [x] Pick UI design reference
- [x] Choose color palette and font

## What You'll Learn

- PostgreSQL setup
- Project scaffolding

## Project Value: 0/10

---

# Phase 1 — Core Workspace

**Time: 4-5 weeks**

## Goal

Build the CRUD backbone with auth.

## Features

- **Auth**: Register, Login, JWT (access + refresh tokens)
- **Notes**: Create, Edit, Delete with Markdown, Tags, Categories
- **Dashboard**: Recent notes, quick stats
- **Profile**: Basic user profile

## NOT in this phase

Goals, Tasks, Priorities, Deadlines — deferred to Phase 7 (Study Planner).

## What You'll Learn

- React component architecture and hooks
- DRF serializers, viewsets, permissions
- JWT authentication (access + refresh token rotation)
- REST API design (status codes, error handling, pagination)
- React Router, axios, CORS

## Project Value: 3/10

## Exit Criteria

- [x] User can register, login, stay logged in
- [x] Full CRUD on notes with markdown rendering
- [x] Tags and categories filter notes
- [x] Dashboard shows recent notes

---

✅ done Phase 1 {date : 8th July 2026}

# Phase 2 — Knowledge Vault

**Time: 3 weeks**

## Goal

Turn MindForge from a notes app into a knowledge repository.

## Features

- **PDF Upload**: Upload, store, view metadata
- **Resource Vault**: Save articles, videos, docs with metadata
- **Shared Categories**: Across Notes, PDFs, Resources (taxonomy app)
- **Full-Text Search**: PostgreSQL tsvector across all content

## What You'll Learn

- File upload handling (validation, size limits, Cloudinary storage)
- PostgreSQL full-text search (SearchVector, SearchQuery, SearchRank)
- Database indexing
- Unified search API across multiple models

## Project Value: 4.5/10

## Exit Criteria

- [x] PDFs upload and display correctly
- [x] Resources save with type classification
- [x] Search returns results across notes, PDFs, resources
- [x] Search feels fast (under 200ms)

---

✅ done {date : 14th July 2026}

💖 polishing of Phase 2 {15th July 2026 to 18th July 2026}

# Phase 3 — RAG Engine ⭐

**Time: 5-6 weeks**

> This is where MindForge becomes impressive.

## Goal

Make AI understand YOUR knowledge with Retrieval-Augmented Generation.

## Features

- **Chunking Pipeline**: Split notes/PDFs into meaningful chunks with source references
- **Embeddings**: Vector embeddings via Cohere Embed v3, stored in PGVector
- **Background Processing**: Celery + Redis for chunking/embedding on upload
- **Semantic Search**: Find content by meaning, not just keywords
- **Chat With Knowledge**: Ask questions, get answers from YOUR content
- **Source Citations**: Every AI response includes where the answer came from

## What You'll Learn

- RAG architecture (most in-demand AI skill)
- Text extraction from PDFs (PyMuPDF/pdfplumber)
- Chunking strategies (fixed-size vs. semantic)
- Vector embeddings and cosine similarity
- PGVector setup
- Celery + Redis for background tasks
- Prompt engineering and streaming responses

## Project Value: 7.5/10

## 🎯 MIP (Minimum Impressive Product) SHIPS HERE

Deploy at this point. You have: Auth + Notes + Knowledge Vault + RAG Chat + Source Citations.

## Exit Criteria

- [x] PDF upload triggers background chunking + embedding
- [x] Semantic search returns relevant results
- [x] Chat answers questions using YOUR content
- [x] Every response includes source citations
- [x] Celery processes without blocking API

---

✅ done {date : 25th July 2026}

💖 polishing phase {date : 26th July 2026 to 1st August 2026}

# Phase 3.5 - Improvements & Deployment

✅ done {date : 8th August 2026}

{deployment process : 9th August 2026 to 10th August 2026}

{deployed with custom domain on 14th August 2026 https://www.mindtensei.me}

# Phase 4 — Proactive Learning Engine ⭐

**Time: 3-4 weeks**

> MindForge starts *managing* your learning, not just storing it.

## Goal

Build a spaced repetition engine with adaptive, context-aware review sessions. The system auto-extracts topics from uploaded content and proactively schedules reviews.

## Features

- **Auto Topic Extraction**: Integrated into existing Celery pipeline — when a document is chunked and embedded, Gemini also extracts 3-5 key topics and creates `TopicMastery` records automatically. Zero new buttons, topics appear on their own.
- **Spaced Repetition (SM-2)**: Algorithmically calculate the exact day a user is likely to forget a topic. Intervals grow on correct answers (1→3→7→21→60 days), reset on incorrect.
- **Daily Review**: Dashboard shows due topics. One click → focused adaptive review session.
- **Adaptive Question Generation**: AI adjusts difficulty based on `confidence_level` and targets `weak_sub_concepts` specifically.
- **"Why Am I Reviewing This?" Context**: Every question explains why it's being asked — generated from TopicMastery metadata, not the LLM.
- **Difficulty Adaptation**: Low confidence → easier fundamental questions. High confidence → harder edge-case questions.
- **Weak Sub-Concept Targeting**: If user aces "useState" but fails "useEffect dependencies", questions zoom into the weak area.
- **Review History & Performance**: Every session persisted with score, per-item results, timestamps.

## NOT in this phase

- ❌ Standalone Flashcard Generator (wrapper)
- ❌ Generic AI Quiz Generator (wrapper)
- ❌ AI Summaries on demand (wrapper)

## What You'll Learn

- Spaced repetition algorithms (SM-2 — how Anki works)
- Structured JSON output from LLMs (Gemini `response_schema`)
- Extending existing Celery pipelines
- User modeling and state management
- Interactive quiz-style UI with adaptive difficulty

## Project Value: 8.5/10

## Exit Criteria

- [x] Document upload auto-extracts topics and creates TopicMastery records
- [x] SM-2 algorithm correctly schedules next_review_date
- [x] Daily Review generates adaptive questions with difficulty scaling
- [x] "Why am I reviewing this?" context is accurate and human-readable
- [x] Weak sub-concepts are tracked and specifically targeted
- [x] Review history is persisted and queryable

---

✅ done {date : 31st August 2026}
✅ Phase 4 Hardening completed on 7 Sep 2026 with 15 bug fixes.

{Phase 5 started : 7 Sep 2026}

# Phase 5 — Knowledge Compiler & Graph ⭐⭐

**Time: 3-4 weeks**

> MindForge doesn't just store knowledge — it *compiles* it into a structured, queryable intelligence.

## Goal

Transform raw text (chunks, embeddings) into a structured knowledge representation: Topics → Claims → Relationships → Prerequisites → Evidence. Then visualize it as an interactive knowledge graph with gap analysis.

## Features

- **Knowledge Compiler**: When content is processed, extract structured **claims** with evidence, and relationships (`PREREQ`, `RELATED`) between topics. Safe, idempotent updates to avoid duplicates.
- **ID-Based Relationship Detection**: AI maps relationships using existing `TopicMastery` IDs and names rather than relying solely on fuzzy matching to ensure accurate graph edges.
- **Interactive Knowledge Graph (2D)**: Force-directed 2D graph (`react-force-graph-2d`) where nodes = topics, color = mastery level (red→yellow→green), and directed edges = prerequisite/relationship links with recorded reasoning.
- **Knowledge Gap Analysis**: User asks "What am I missing to understand distributed systems?" → MindForge traverses the prerequisite graph, checks mastery levels, finds missing nodes.
- **Blind Spot Detection**: Highlights isolated nodes with no connections, and prerequisite gaps blocking deeper understanding.

## What You'll Learn

- Structured knowledge extraction via LLM (beyond simple topic tagging)
- D3.js force-directed graphs (react-force-graph-2d)
- Graph data structures, traversal, and prerequisite chain algorithms
- Gap analysis on directed graphs (BFS, reachability)
- Interactive data visualization with complex state

## Project Value: 9.0/10

## Exit Criteria

- [x] Knowledge Compiler extracts claims + evidence from documents
- [x] Prerequisite relationships are auto-detected between topics
- [x] Interactive graph renders with mastery-colored nodes and directed edges
- [x] Gap Analysis answers "What am I missing to understand X?" with real graph computation
- [ ] Blind spots are highlighted visually
- [ ] Gemini SDK migrated (google.generativeai → google.genai)
- [ ] CI pipeline setup (GitHub Actions)

---

## Phase 5 Closure Checklist (remaining items before marking done)

- [ ] Daily Review intermittent bug — investigate & fix
- [ ] Gemini SDK migration (google.generativeai → google.genai) across 3 files
- [ ] Blind spot visualization in Knowledge Graph (isolated nodes)
- [ ] CI pipeline (GitHub Actions: backend tests + frontend build)

---

# Phase 6 — Knowledge Intelligence ⭐⭐⭐

**Time: ~4 weeks**

> MindForge doesn't just retrieve — it **thinks** across your entire knowledge base.

## Goal

Build cross-document intelligence: contradiction detection, knowledge synthesis, and a learning analytics layer. MindForge proactively surfaces insights the user never asked for.

## Sub-Phases

### Phase 6.1 — Contradiction Detection (~1 week)

When new content is processed, compare its claims against existing claims in the knowledge base. If Document A says "X is always true" and Document B says "X is not necessarily true" → surface a Knowledge Conflict alert with both sources and context comparison.

**Architecture:** New `intelligence` app. `Contradiction` model → cosine similarity on claim embeddings → Gemini confirmation → alert UI.

### Phase 6.2 — Cross-Document Synthesis (~1 week)

On-demand analysis of relationships across documents. Generate "Insight Cards" — "The Observer Pattern from your Design Patterns PDF is the same principle behind React's useEffect. Both are about subscribing to state changes."

**Architecture:** `InsightCard` model → topic-pair analysis across different sources → Gemini synthesis → card carousel UI.

### Phase 6.3 — Learning Analytics Dashboard (~1 week)

Learning velocity chart (topics mastered per week), personalized forgetting curves per topic, strength/weakness rankings, knowledge coverage map (mastered vs. just stored), study pattern insights (time-of-day performance analysis).

**Architecture:** Django ORM aggregation queries → Recharts visualizations → `/analytics` page.

### Phase 6.4 — Intelligence Report (~3-4 days)

**Phase 1:** On-demand "Generate Intelligence Report" button — new contradictions, new connections, decaying topics, suggested focus areas, learning velocity trend.

**Phase 2 (later):** Celery Beat → automatic weekly generation (only after on-demand generation is reliable).

**Architecture:** `IntelligenceReport` model → gather data from all intelligence features → Gemini summary → report display UI.

## What You'll Learn

- Semantic similarity for contradiction/overlap detection (cosine similarity between claim embeddings)
- Cross-document reasoning via LLM with structured context
- Data visualization (Recharts)
- Aggregation queries (Django ORM annotate, aggregate, window functions)
- Celery Beat for scheduled intelligence tasks (Phase 6.4 Phase 2)
- Designing proactive notification systems

## Project Value: 9.5/10

## Exit Criteria

- [ ] Contradiction Detection surfaces real conflicts between documents with source citations
- [ ] Cross-Document Synthesis generates meaningful insight cards connecting different uploads
- [ ] Learning velocity chart and forgetting curves render with real data
- [ ] Intelligence Report generates on-demand and contains actionable insights
- [ ] System proactively surfaces insights without the user asking

---

# Phase 7 — Study Planner & Daily Brief

**Time: 2-3 weeks**

> MindForge plans your learning and holds you accountable.

## Goal

Allow users to set learning goals with deadlines. MindForge analyzes the vault, creates a study plan grounded in actual content, and tracks progress using spaced repetition data from Phase 4.

## Features

- **Goal Creation**: Title, target date — MindForge auto-links relevant vault documents and topics via semantic similarity
- **AI Study Plan Generation**: Week-by-week schedule distributing topics across remaining time, prioritized by lowest confidence first, prerequisites before advanced
- **Progress Tracking**: Progress bar based on actual TopicMastery confidence levels, not manual checkboxes
- **Adaptive Rescheduling**: Falls behind → redistributes topics. Gets ahead → suggests deeper review
- **Daily Brief**: On login — "Good morning! This week's focus: 'Load Balancing' and 'Caching Strategies'. You have 3 topics due for review."

## What You'll Learn

- Goal/milestone data modeling
- AI planning with constraints (content + time + mastery data)
- Progress tracking and adaptive algorithms
- Celery Beat for daily briefs
- Integrating multiple data sources into unified UX

## Project Value: 9.5/10 (Final)

## Exit Criteria

- [ ] User can create a goal and auto-link relevant vault content
- [ ] AI generates week-by-week study plan from real content
- [ ] Progress is tracked via actual mastery data
- [ ] Plan adapts when user falls behind or gets ahead
- [ ] Daily brief combines goals + reviews into one actionable message

---

# Actual Timeline

```
Jun 2026      → Phase 0 (Foundation)
Jun-Jul 2026  → Phase 1 (Core Workspace)        ✅ 8 Jul
Jul 2026      → Phase 2 (Knowledge Vault)        ✅ 14 Jul (polished 15-18 Jul)
Jul-Aug 2026  → Phase 3 (RAG Engine)             ✅ 25 Jul (polished 26 Jul - 1 Aug)
Aug 2026      → Phase 3.5 (Improvements)         ✅ 8 Aug
                ════════════════════════════
                  MIP DEPLOYED — 14 Aug 2026
                  https://www.mindtensei.me
                ════════════════════════════
Aug-Sep 2026  → Phase 4 (Learning Engine)        ✅ 31 Aug (hardened 7 Sep)
Sep 2026      → Phase 5 (Knowledge Graph)        🔧 ~95% done
Sep-Oct 2026  → Phase 6 (Knowledge Intelligence) ⏳ next
Oct 2026      → Phase 7 (Study Planner & Brief)  ⏳ planned
                ════════════════════════════
                  FULL PRODUCT (~5 months)
                ════════════════════════════
```

---

# Production Practices

| Practice | Status |
|---|---|
| Git + GitHub | ✅ Every phase |
| Environment variables (.env) | ✅ Phase 0 |
| Cloudinary file storage | ✅ Phase 2 |
| API tests (pytest) | 🟡 Partial — critical-path tests needed |
| CI (GitHub Actions) | ⏳ Phase 5 closure |
| Deploy to Heroku + Vercel | ✅ Phase 3 (MIP) |

---

# Success Criteria

A successful MindForge should allow users to:

- Store knowledge (notes, PDFs, resources)
- Search knowledge semantically (RAG + pgvector)
- Talk to knowledge (AI chat with source citations)
- Be proactively quizzed on decaying knowledge (spaced repetition)
- See the shape of their knowledge (interactive knowledge graph with prerequisite chains)
- Ask "What am I missing?" and get real gap analysis (knowledge compiler)
- Be alerted to contradictions across documents (knowledge intelligence)
- Discover connections they never saw (cross-document synthesis)
- Understand their learning patterns (analytics + weekly intelligence reports)
- Plan and track learning goals (study planner + daily brief)

without leaving a single workspace.

> The system gets smarter the longer you use it. That's what separates MindForge from "upload a PDF to ChatGPT."

---

# Tech Debt & Deferred Items

| Item | Priority | When |
|---|---|---|
| Gemini SDK migration (`google.generativeai` → `google.genai`) | 🔴 High | Phase 5 closure |
| Cloudinary Direct Upload (bypass Heroku timeout) | 🟠 Medium | Post-Phase 6 |
| Celery night worker (reduce API rate limits) | 🟢 Low | Post-Phase 7 |
| API Key/Model fallback system | 🟢 Low | Production hardening |
| Gemini model version updates | 🟢 Low | Ongoing |
| Full test coverage sprint | 🟢 Low | Post-Phase 7 |
