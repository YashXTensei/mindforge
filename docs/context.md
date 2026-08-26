# MindForge — Project Context (For New Chat Sessions)

> Last Updated: 25 August 2026 Use this file to resume work in a new chat session.

## About The Developer
- **Name:** Yash
- **College:** 3rd semester starting (2nd year)
- **Current Skills:** Django, PostgreSQL, HTML/CSS/JS, React, Tailwind CSS, Celery, Redis
- **CP Profile:** Codeforces rating 1472, 390+ problems solved
- **Learning Style:** Wants to learn by doing — guide step by step, don't just write code. Explain concepts with simple analogies.
- **Language:** Communicates in Hindi-English mix (Hinglish)
- **Deployment Status:** Deployed on Heroku/Vercel with custom domain `mindtensei.me`. StartUpX Pitch deadline was 23 Aug 2026.

## Project Overview
- **Project:** MindForge — AI Learning Companion
- **Tagline:** "Don't just store knowledge — talk to it, learn from it, and let AI manage it."
- **Vision:** AI-powered workspace where users store knowledge (notes, PDFs, resources), chat with it (RAG), get proactive learning reviews (Spaced Repetition/SM-2), and see a connected graph of their brain.
- **Core Differentiators:** Active Learning Engine (topic tracking + SM-2) + Knowledge Graph (Phase 5).
- **Theme:** Dark mode, purple accent (Linear App style). Uses Tailwind CSS.

## Tech Stack
| Layer | Technology |
|---|---|
| Frontend | React + Vite (JavaScript) + Tailwind CSS + Lucide React |
| Backend | Django REST Framework |
| Database | PostgreSQL 18.4 (Neon for prod) |
| Vector Search | PGVector (Phase 3) |
| Auth | JWT (SimpleJWT) |
| AI (Chat/Gen) | Google Gemini Flash / Gemini Vision |
| AI (Embeddings) | Cohere Embed v3 |
| Task Queue | Celery + Redis |

## Django Apps Structure
| App | Status | Purpose |
|---|---|---|
| `accounts` | ✅ Complete | Auth (register, login) |
| `notes` | ✅ Complete | Notes, Categories, Tags |
| `vault` | ✅ Complete | PDFs, Resources, generic file storage |
| `rag` | ✅ Complete | Embeddings, Chunking, Chat, Vision |
| `learning` | ✅ Complete | SM-2, Topics, Daily Review (Phase 4) |
| `graph` | 🔨 Next (P5) | Knowledge Compiler, Network Graph |

## Roadmap Summary (Revised 25 Aug)
| Phase | Name | Status |
|---|---|---|
| Phase 0 | Foundation Setup | ✅ Complete |
| Phase 1 | Core Workspace (Auth + Notes) | ✅ Complete |
| Phase 2 | Knowledge Vault (PDFs + Resources) | ✅ Complete |
| Phase 3 | RAG Engine ⭐ (MIP ships here) | ✅ Complete |
| Phase 3.5| Image Intelligence (Vision API) | ✅ Complete |
| Phase 4 | Active Learning Engine (SM-2) | ✅ Complete |
| Phase 5 | Knowledge Graph & Compiler | Upcoming |
| Phase 6 | Knowledge Intelligence (Insights) | Upcoming |
| Phase 7 | Polish, Security & Deployment | Upcoming |

## Current State (End of Phase 4)
- **Notes/Vault:** Users can create notes, upload PDFs, and images.
- **RAG:** Uploaded documents are automatically chunked and embedded via Celery background tasks. Users can chat with their vault.
- **Learning Engine:** When documents are processed, Gemini auto-extracts topics. These are tracked using the SM-2 algorithm. The user has a Daily Review UI where they are quizzed on due topics. AI generates MCQ questions + explanations on the fly.
- **Mobile UI:** The site has been made responsive (hamburger menu, hidden chat sidebar) to address user feedback from the StartupX pitch.

## Key Documents in Project
- `docs/roadmap.md` — Full revised roadmap with exit criteria per phase
- `docs/implementation_plan.md` — Technical implementation details for the *current/next* phase
- `docs/progress_tracker.md` — Chronological log of all work done

## Important Notes
- User wants to LEARN, not just copy-paste. Explain concepts with analogies.
- Keep explanations in Hinglish (Hindi-English mix).
- Don't write code directly to files if the user is learning a new concept — guide them. (Though for bug fixes, direct edits are fine).
- User's OS: Windows, Shell: PowerShell. Uses `celery -A config worker -l INFO -P eventlet` on Windows.
- Always check `docs/implementation_plan.md` before starting a new phase.