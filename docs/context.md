# MindForge — Project Context (For New Chat Sessions)

> Last Updated: 18 November 2026. Use this file to resume work in a new chat session.

## About The Developer
- **Name:** Yash
- **College:** 3rd semester (2nd year)
- **Current Skills:** Django, PostgreSQL, HTML/CSS/JS, React, Tailwind CSS, Celery, Redis
- **CP Profile:** Codeforces rating 1472, 390+ problems solved
- **Learning Style:** Wants to learn by doing — guide step by step, don't just write code. Explain concepts with simple analogies.
- **Language:** Communicates in Hindi-English mix (Hinglish)
- **Deployment Status:** Deployed on Heroku/Vercel with custom domain `mindtensei.me`.

## Project Overview
- **Project:** MindForge — AI Learning Companion
- **Tagline:** "Don't just store knowledge — talk to it, learn from it, and let AI manage it."
- **Vision:** AI-powered workspace where users store knowledge (notes, PDFs, resources), chat with it (RAG), get proactive learning reviews (Spaced Repetition/SM-2), explore a connected knowledge graph of their brain, and automatically detect contradictions across documents.
- **Core Differentiators:** Active Learning Engine (topic tracking + SM-2) + Knowledge Graph & Compiler (Phase 5) + Contradiction Radar (Phase 6.1).
- **Theme:** Dark mode, purple accent (Linear App style). Uses Tailwind CSS.

## Tech Stack
| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite (Port 5180) + Tailwind CSS + Lucide React + react-force-graph-2d |
| Backend | Django REST Framework (Port 8000) |
| Database | PostgreSQL with `pgvector` (Port 5433 local, Neon/Heroku in prod) |
| Vector Search | PGVector (HNSW indexing for chunks, CosineDistance for claims) |
| Auth | JWT (SimpleJWT with token rotation) |
| AI (Chat/Gen) | Google Gemini (`google-genai` SDK 2.x) |
| AI (Embeddings) | Cohere Embed v3 (`embed-english-v3.0`, 1024 dims) |
| Task Queue | Celery + Redis |

## Model Configuration (Current)
- `GEMINI_CHAT_MODEL=gemini-3.5-flash`
- `GEMINI_VISION_MODEL=gemini-3.1-flash-lite`
- `GEMINI_QUESTION_MODEL=gemini-3.5-flash`
- `GEMINI_EXTRACTION_MODEL=gemini-3.1-flash-lite`

## Django Apps Structure
| App | Status | Purpose |
|---|---|---|
| `accounts` | ✅ Complete | Auth (register, login, JWT) |
| `notes` | ✅ Complete | Notes, Categories, Tags |
| `vault` | ✅ Complete | PDFs, Resources, generic file storage |
| `rag` | ✅ Complete | Embeddings, Chunking, Chat, Vision OCR |
| `learning` | ✅ Complete (Hardened) | SM-2, Topics, Daily Review (Phase 4) |
| `graph` | ✅ Complete | Knowledge Compiler, Claims, Force-Directed Graph, Gap Analysis (Phase 5) |
| `intelligence` | ✅ Complete (P6.1) | Contradiction Detection, Contradiction Radar, Claim Embeddings (Phase 6.1) |

## Roadmap Summary
| Phase | Name | Status |
|---|---|---|
| Phase 0 | Foundation Setup | ✅ Complete |
| Phase 1 | Core Workspace (Auth + Notes) | ✅ Complete |
| Phase 2 | Knowledge Vault (PDFs + Resources) | ✅ Complete |
| Phase 3 | RAG Engine ⭐ (MIP ships here) | ✅ Complete |
| Phase 3.5| Image Intelligence (Vision API) | ✅ Complete |
| Phase 4 | Active Learning Engine (SM-2) | ✅ Complete (with hardening pass) |
| Phase 5 | Knowledge Graph & Compiler | ✅ Complete |
| Phase 6.1| Contradiction Detection (Radar) | ✅ Complete |
| Phase 6.3| Learning Analytics Dashboard | 🔨 Next |
| Phase 7 | Study Planner & Daily Brief | Upcoming |

## Current State (Post Phase 6.1 & Port Migration)
- **Contradiction Detection (Phase 6.1):** Background Step 7 in Celery pipeline (`rag/tasks.py`) embeds new claims using Cohere and compares against existing claims in pgvector using CosineDistance. Gemini 3.1 Flash-Lite confirms contradictions. Frontend `/contradictions` page allows side-by-side claim comparison, AI conflict reasoning, and one-click reconciliation. Dashboard displays a real-time conflict alert banner.
- **Knowledge Graph (Phase 5):** Knowledge Compiler extracts structured claims and prerequisite/related relationships between topics. Visualized in interactive 2D force-directed graph (`react-force-graph-2d`) with BFS-based Knowledge Gap Analysis and blind spot highlighting.
- **Gemini SDK Migration:** Switched from deprecated `google.generativeai` to the modern `google-genai` SDK (2.x) with updated models: `gemini-3.5-flash` and `gemini-3.1-flash-lite`.
- **Port Standardization:** MindForge frontend now runs on port **5180** (`strictPort: true`) to avoid collisions with other local projects (e.g., YatraSetu on 5173). Backend CORS is updated accordingly.

## Important Notes
- User wants to LEARN, not just copy-paste. Explain concepts with analogies.
- Keep explanations in Hinglish (Hindi-English mix).
- User's OS: Windows, Shell: PowerShell.
- Database runs locally on port 5433.
