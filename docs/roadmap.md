# MindForge Roadmap (Revised)

> Last Updated: 17 August 2026

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
- [ ] Create React project with Vite
- [ ] Set up Docker Compose
- [ ] Pick UI design reference
- [ ] Choose color palette and font

## What You'll Learn

- PostgreSQL setup
- Docker Compose basics
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

Goals, Tasks, Priorities, Deadlines — deferred to Phase 6 (AI Actions).

## What You'll Learn

- React component architecture and hooks
- DRF serializers, viewsets, permissions
- JWT authentication (access + refresh token rotation)
- REST API design (status codes, error handling, pagination)
- React Router, axios, CORS

## Project Value: 3/10

## Exit Criteria

- [ ] User can register, login, stay logged in
- [ ] Full CRUD on notes with markdown rendering
- [ ] Tags and categories filter notes
- [ ] Dashboard shows recent notes
- [ ] API has basic test coverage

---

✅done phase 1 {date : 8th july 2026}

# Phase 2 — Knowledge Vault

**Time: 3 weeks**

## Goal

Turn MindForge from a notes app into a knowledge repository.

## Features

- **PDF Upload**: Upload, store, view metadata
- **Resource Vault**: Save articles, videos, docs with metadata
- **Shared Categories**: Across Notes, PDFs, Resources
- **Full-Text Search**: PostgreSQL tsvector across all content

## What You'll Learn

- File upload handling (validation, size limits, storage)
- PostgreSQL full-text search (SearchVector, SearchQuery, SearchRank)
- Database indexing
- Unified search API across multiple models

## Project Value: 4.5/10

## Exit Criteria

- [ ] PDFs upload and display correctly
- [ ] Resources save with type classification
- [ ] Search returns results across notes, PDFs, resources
- [ ] Search feels fast (under 200ms)

---

✅done {date : 14th july 2026}

💖polishing of phase 2 {15th july 2026 to 18th july 2026} 

# Phase 3 — RAG Engine ⭐

**Time: 5-6 weeks**

> This is where MindForge becomes impressive.

## Goal

Make AI understand YOUR knowledge with Retrieval-Augmented Generation.

## Features

- **Chunking Pipeline**: Split notes/PDFs into meaningful chunks with source references
- **Embeddings**: Vector embeddings via Cohere Embed v3 (free), stored in PGVector
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

- [ ] PDF upload triggers background chunking + embedding
- [ ] Semantic search returns relevant results
- [ ] Chat answers questions using YOUR content
- [ ] Every response includes source citations
- [ ] Celery processes without blocking API

---

✅done {date : 25th july 2026}

💖polishing phase {date : 26th july 2026 to 1st august 2026}

# Phase 3.5 - Some minor Improvements before Phase 4

✅done {date : 8th august 2026}

{deployment process : 9th august 2026 to 10th august 2026}

{deployed with custom domain on 14th august 2026 https://www.mindtensei.me}

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

- [ ] Document upload auto-extracts topics and creates TopicMastery records
- [ ] SM-2 algorithm correctly schedules next_review_date
- [ ] Daily Review generates adaptive questions with difficulty scaling
- [ ] "Why am I reviewing this?" context is accurate and human-readable
- [ ] Weak sub-concepts are tracked and specifically targeted
- [ ] Review history is persisted and queryable

---

# Phase 5 — Knowledge Graph & Connections ⭐⭐

**Time: 3 weeks**

> MindForge shows you the *shape* of your knowledge.

## Goal

Build an interactive visual knowledge graph that maps how topics and documents relate to each other, overlaid with mastery data from Phase 4.

## Features

- **Automatic Relationship Detection**: During topic extraction, also extract relationships between topics (e.g., "Django" ↔ "Celery" via "Task Queues")
- **Interactive Knowledge Graph (D3.js)**: Force-directed graph where nodes = topics, color = mastery level (red→yellow→green), size = source document count, edges = detected relationships
- **Knowledge Clusters**: Topics auto-group into clusters ("Frontend", "Backend", "DevOps")
- **Blind Spot Detection**: Highlights isolated nodes and unexplored clusters — "You have 3 documents about System Design but haven't reviewed any of them."

## What You'll Learn

- D3.js force-directed graphs (or react-force-graph)
- Graph data structures and traversal
- Relationship extraction via LLM
- Interactive data visualization
- Frontend performance with large datasets

## Project Value: 9.0/10

## Exit Criteria

- [ ] Topic relationships are auto-detected during document processing
- [ ] Interactive graph renders with mastery-colored nodes
- [ ] Clicking a node shows detailed mastery info and source documents
- [ ] Blind spots are highlighted visually
- [ ] Graph performs well with 50+ nodes

---

# Phase 6 — Learning Analytics & Intelligence Dashboard ⭐⭐

**Time: 3 weeks**

> MindForge tells you *how* you learn, not just *what* you learned.

## Goal

Build a data-driven analytics dashboard that surfaces insights from accumulated review data.

## Features

- **Learning Velocity Chart**: Topics mastered per week/month over time
- **Personalized Forgetting Curve**: Actual Ebbinghaus curve per topic based on real review data
- **Knowledge Coverage Map**: Treemap/sunburst showing mastered vs. stored knowledge by category
- **Strength & Weakness Report**: Ranked topics by accuracy, with specific weak sub-concepts
- **Weekly Learning Report**: Auto-generated via Celery Beat — topics reviewed, scores, trends, suggested focus areas
- **Study Pattern Insights**: Time-of-day/day-of-week performance analysis ("Your accuracy is 23% higher on weekday mornings")

## What You'll Learn

- Data visualization (Recharts / Chart.js / D3.js)
- Aggregation queries (Django ORM annotate, aggregate, window functions)
- Celery Beat for scheduled tasks
- Statistical analysis (rolling averages, trend detection)
- Dashboard UI design

## Project Value: 9.0/10

## Exit Criteria

- [ ] Learning velocity chart renders with real data
- [ ] Forgetting curve is personalized per topic
- [ ] Coverage map shows mastered vs. stored knowledge
- [ ] Weekly report generates automatically via Celery Beat
- [ ] Study pattern analysis produces actionable insights

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

# Timeline Summary

```
Week 1        → Phase 0 (Foundation)
Week 2-6      → Phase 1 (Core Workspace)
Week 7-9      → Phase 2 (Knowledge Vault)
Week 10-15    → Phase 3 (RAG Engine)
                ═══════════════════════
                  MIP DEPLOYED (~3.5 months)
                ═══════════════════════
Week 16-19    → Phase 4 (Proactive Learning Engine)
Week 20-22    → Phase 5 (Knowledge Graph)
Week 23-25    → Phase 6 (Learning Analytics)
Week 26-28    → Phase 7 (Study Planner & Brief)
                ═══════════════════════
                  FULL PRODUCT (~7 months)
                ═══════════════════════
```

---

# Production Practices (Built Into Every Phase)

| Practice | When |
|---|---|
| Docker Compose | Phase 0 |
| API tests (pytest) | Every phase |
| Git + GitHub | Every phase |
| Environment variables | Phase 0 |
| Basic CI (GitHub Actions) | Phase 1 |
| Deploy to Heroku/Vercel | Phase 3 (MIP) |

---

# Success Criteria

A successful MindForge should allow users to:

- Store knowledge (notes, PDFs, resources)
- Search knowledge semantically (RAG + pgvector)
- Talk to knowledge (AI chat with source citations)
- Be proactively quizzed on decaying knowledge (spaced repetition)
- See the shape of their knowledge (interactive knowledge graph)
- Understand their learning patterns (analytics dashboard)
- Plan and track learning goals (study planner + daily brief)

without leaving a single workspace.
