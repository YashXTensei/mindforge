# MindForge — Architecture

> Last Updated: 25 August 2026

## System Overview

```text
┌─────────────────────────────────────────────────┐
│                  React (Vite)                    │
│              Frontend — Port 5173                │
└──────────────────┬──────────────────────────────┘
                   │ REST API
┌──────────────────▼──────────────────────────────┐
│              Django REST Framework               │
│              Backend — Port 8000                 │
│                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ accounts │ │  notes   │ │  vault   │          │
│  └──────────┘ └──────────┘ └──────────┘          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │   rag    │ │ learning │ │ graph(P5)│          │
│  └──────────┘ └──────────┘ └──────────┘          │
└───┬──────────────┬──────────────┬───────────────┘
    │              │              │
┌───▼───┐    ┌─────▼─────┐  ┌────▼────┐
│ PostgreSQL │ │   Redis   │  │ Celery  │
│ + PGVector │ │   Cache   │  │ Workers │
└────────────┘ └───────────┘  └─────────┘
```

## Database Schema

```text
User
 ├── Note (title, content, created, updated)
 │    ├── Tag (many-to-many)
 │    └── Category (foreign key)
 │
 ├── Document (title, file, page_count, uploaded)     [Vault]
 │    └── Category (foreign key)
 │
 ├── Resource (title, url, type, saved)               [Vault]
 │    └── Category (foreign key)
 │
 ├── Chunk (content, source_type, source_id, vector)  [RAG]
 │
 ├── ChatConversation → ChatMessage (role, content)   [RAG]
 │
 ├── TopicMastery (topic_name, confidence, next_review) [Learning]
 │    ├── TopicSource (Generic FK to Document/Note)
 │    └── ReviewItem (FK to TopicMastery)
 │
 ├── ReviewSession (score, total_items, completed_at)   [Learning]
 │    └── ReviewItem (question, options, user_answer)
 │
 ├── Claim (claim_text, evidence, source)             [Graph - P5]
 │
 └── TopicRelationship (source, target, type)         [Graph - P5]
```

## Django Apps → Phase Mapping

| App | Phase | Models |
|---|---|---|
| `accounts` | Phase 1 | (Built-in User model extensions if any) |
| `notes` | Phase 1 | Note, Category, Tag |
| `vault` | Phase 2 | Document, Resource |
| `rag` | Phase 3 | Chunk, ChatConversation, ChatMessage |
| `learning` | Phase 4 | TopicMastery, TopicSource, ReviewSession, ReviewItem |
| `graph` | Phase 5 | Claim, TopicRelationship |

## API Structure

```text
/api/v1/
├── /auth/
│    ├── POST /register/
│    ├── POST /token/          (returns access + refresh token)
│    └── POST /token/refresh/
│
├── /notes/
│    ├── GET/POST    /
│    ├── GET/PUT/DELETE /{id}/
│    ├── GET /categories/
│    └── GET /tags/
│
├── /vault/
│    ├── POST /documents/
│    ├── GET  /documents/
│    ├── GET/POST /resources/
│    └── GET /search/?q=...
│
├── /rag/
│    ├── POST /chat/
│    ├── GET  /conversations/
│    └── GET  /search/?q=...   (semantic search)
│
├── /learning/
│    ├── GET  /topics/
│    ├── GET  /topics/{id}/
│    ├── GET  /daily-review/
│    └── POST /submit-answer/
│
└── /graph/                     [Phase 5 - Upcoming]
     ├── GET /network/
     └── GET /analyze-gap/
```

## AI Provider Strategy

| Provider | Use Case | Implementation |
|---|---|---|
| **Google Gemini Flash 3.6** | Chat, Quiz Generation, Topic Extraction | Active |
| **Google Gemini Flash 3.5 Vision** | Image OCR / Inline Vision | Active |
| **Cohere Embed v3** | Vector embeddings (RAG) | Active |
| **Ollama (local)** | Dev/Fallback | Planned |