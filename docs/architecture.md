# MindForge — Architecture

> Last Updated: 23 June 2026

## System Overview

```
┌─────────────────────────────────────────────────┐
│                  React (Vite)                    │
│              Frontend — Port 5173                │
└──────────────────┬──────────────────────────────┘
                   │ REST API + WebSocket
┌──────────────────▼──────────────────────────────┐
│              Django REST Framework               │
│              Backend — Port 8000                 │
│                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │ accounts │ │  notes   │ │  vault (Phase 2)  │ │
│  └──────────┘ └──────────┘ └──────────────────┘ │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │ rag (P3) │ │learn (P5)│ │ actions (Phase 6) │ │
│  └──────────┘ └──────────┘ └──────────────────┘ │
└───┬──────────────┬──────────────┬───────────────┘
    │              │              │
┌───▼───┐    ┌─────▼─────┐  ┌────▼────┐
│ PostgreSQL │ │   Redis   │  │ Celery  │
│ + PGVector │ │   Cache   │  │ Workers │
└────────────┘ └───────────┘  └─────────┘
```

## Database Schema

```
User
 ├── Note (title, content_md, created, updated)
 │    ├── Tag (many-to-many)
 │    └── Category (foreign key)
 │
 ├── PDF (title, file_path, page_count, uploaded)     [Phase 2]
 │    └── Category (foreign key)
 │
 ├── Resource (title, url, type, saved)                [Phase 2]
 │    └── Category (foreign key)
 │
 ├── Chunk (content, source_type, source_id, vector)   [Phase 3]
 │
 ├── ChatConversation → ChatMessage (role, content)    [Phase 3]
 │
 ├── Flashcard (front, back, difficulty)               [Phase 4]
 │
 ├── QuizQuestion → QuizAttempt                        [Phase 4]
 │
 ├── LearningTopic (confidence, revisions, decay)      [Phase 5]
 │    └── RevisionLog
 │
 ├── Goal → GoalMilestone                              [Phase 6]
 │
 ├── Task (deadline, priority, status)                 [Phase 6]
 │
 ├── Event (datetime, reminder)                        [Phase 6]
 │
 ├── AIActionLog (command, action, status)              [Phase 6]
 │
 └── DailyBrief (content, date)                        [Phase 7]
```

## Django Apps → Phase Mapping

| App | Phase | Models |
|---|---|---|
| `accounts` | Phase 1 | User profile extension |
| `notes` | Phase 1 | Note, Category, Tag |
| `vault` | Phase 2 | PDF, Resource |
| `rag` | Phase 3 | Chunk, ChatConversation, ChatMessage |
| `learning` | Phase 4-5 | Flashcard, QuizQuestion, QuizAttempt, LearningTopic, RevisionLog |
| `goals` | Phase 6 | Goal, GoalMilestone, Task, Event |
| `actions` | Phase 6 | AIActionLog |
| `brief` | Phase 7 | DailyBrief |

## API Structure

```
/api/v1/
├── /auth/
│    ├── POST /register/
│    ├── POST /login/          (returns access + refresh token)
│    ├── POST /token/refresh/
│    └── GET  /profile/
│
├── /notes/
│    ├── GET/POST    /
│    ├── GET/PUT/DELETE /{id}/
│    ├── GET /categories/
│    └── GET /tags/
│
├── /vault/                     [Phase 2]
│    ├── POST /pdfs/upload/
│    ├── GET  /pdfs/
│    ├── GET/POST /resources/
│    └── GET /search/?q=...
│
├── /rag/                       [Phase 3]
│    ├── POST /chat/
│    ├── GET  /conversations/
│    └── GET  /search/?q=...   (semantic)
│
├── /learning/                  [Phase 4-5]
│    ├── GET  /flashcards/
│    ├── POST /quiz/generate/
│    ├── POST /quiz/attempt/
│    ├── GET  /profile/        (learning topics)
│    └── GET  /suggestions/
│
├── /goals/                     [Phase 6]
│    ├── GET/POST /
│    └── GET/POST /tasks/
│
└── /actions/                   [Phase 6]
     └── POST /execute/        (natural language → action)
```

## Free AI API Strategy

| Provider | Use Case | Free Limit |
|---|---|---|
| Google Gemini Flash | Chat, summaries, quizzes | 15 RPM |
| Cohere Embed v3 | Vector embeddings | 100 RPM |
| Ollama (local) | Development and testing | Unlimited |