# MindForge Roadmap (Revised)

> Last Updated: 23 June 2026

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

# Phase 4 — AI Learning Layer

**Time: 3-4 weeks**

## Goal

Build context-aware learning tools on top of RAG.

## Features

- **AI Summaries**: Generate summary + key takeaways from any note/PDF
- **Flashcard Generator**: Auto-generate flashcards from content
- **Quiz Generator**: MCQs + short-answer questions
- **Topic Extraction**: Auto-detect topics from uploaded content

## What You'll Learn

- Advanced prompt engineering (structured JSON output)
- AI pipelines (content → chunks → LLM → structured output)
- Output parsing and validation
- Interactive UI (flip cards, quiz interface)
- Cost optimization (caching AI outputs)

## Project Value: 8.5/10

## Exit Criteria

- [ ] Summary generation works for notes and PDFs
- [ ] Flashcards generate and render with flip animation
- [ ] Quiz generates with correct/incorrect feedback
- [ ] AI outputs are cached

---

# Phase 5 — Learning Memory ⭐⭐

**Time: 4 weeks**

> Core Differentiator — this is what makes MindForge unique.

## Goal

Track what the user knows, what they're forgetting, and what they should revise.

## Features

- **Learning Profile**: Topic confidence scores, revision counts, last revised dates
- **Knowledge Decay Detection**: Spaced repetition (SM-2 algorithm) to flag forgotten topics
- **Weak Topic Detection**: Low quiz scores, rarely revised topics
- **Personalized Suggestions**: "Revise DP this week", "You're strong in React but weak in System Design"
- **Learning Dashboard**: Confidence heatmap, revision timeline, weak areas

## What You'll Learn

- Spaced repetition algorithms (SM-2 — how Anki works)
- User modeling and personalization
- Data analytics and aggregation
- Data visualization (Recharts/Chart.js)
- Recommendation system basics

## Project Value: 9.0/10

## Exit Criteria

- [ ] Learning profile tracks all studied topics with confidence
- [ ] Decay detection flags stale knowledge
- [ ] Suggestions feel relevant and personalized
- [ ] Dashboard visualizes learning progress

---

# Phase 6 — AI Actions + Goals/Tasks

**Time: 3-4 weeks**

> Core Differentiator — AI doesn't just chat, it acts.

## Goal

Natural language commands that manage the workspace. Goals and Tasks enter here, managed by AI.

## Features

- **Goals & Tasks**: Create goals with milestones, tasks with deadlines/priorities
- **AI Actions via natural language**:
  - "Create a React learning roadmap" → creates goal + tasks
  - "Mark React Basics completed" → updates goal progress
  - "Move all Django resources to Backend" → performs action
  - "Create a reminder for CF Round on Saturday" → creates event
- **Confirmation Flow**: AI shows preview → user confirms → action executes
- **Undo Support**: Actions are reversible

## What You'll Learn

- LLM function calling / tool calling
- Intent classification (question vs. command)
- Confirmation flows (preview → confirm → execute → undo)
- AI agent architecture

## Project Value: 9.5/10

## Exit Criteria

- [ ] At least 5 AI actions work end-to-end
- [ ] Goal/task CRUD works via UI and AI commands
- [ ] AI distinguishes questions from commands
- [ ] Actions are reversible

---

# Phase 7 — Daily Brief + Timeline

**Time: 2 weeks**

## Goal

Make MindForge feel alive and build personal growth history.

## Features

- **Daily Brief**: "Good Morning Yash — 4 pending tasks, React 72% complete, DP needs revision"
- **Weekly Report**: Tasks completed, PDFs studied, revision sessions, progress trends
- **AI Timeline**: Auto-generated milestones from goals and achievements

## What You'll Learn

- Aggregation queries and analytics
- AI-generated reports from structured data
- Scheduled tasks (Celery Beat)
- Timeline UI components

## Project Value: 9.5/10 (Final)

## Exit Criteria

- [ ] Daily brief generates automatically
- [ ] Weekly report summarizes real data
- [ ] Timeline shows meaningful milestones
- [ ] Everything deployed and working

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
Week 16-19    → Phase 4 (AI Learning Layer)
Week 20-23    → Phase 5 (Learning Memory)
Week 24-27    → Phase 6 (AI Actions)
Week 28-29    → Phase 7 (Brief + Timeline)
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
| Deploy to Railway/Render | Phase 3 (MIP) |

---

# Success Criteria

A successful MindForge should allow users to:

- Store knowledge
- Search knowledge semantically
- Learn from knowledge (summaries, flashcards, quizzes)
- Chat with knowledge (RAG with source citations)
- Act on knowledge (AI actions)
- Build long-term learning memory (decay detection, revision tracking)

without leaving a single workspace.
