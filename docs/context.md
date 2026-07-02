MindForge — Project Context (For New Chat Sessions)
Last Updated: 2 July 2026 Use this file to resume work in a new chat session.

About The Developer
Name: Yash
College: 3rd semester starting (2nd year)
Current Skills: Django, SQLite (now PostgreSQL), HTML/CSS/JS, React basics
CP Profile: Codeforces rating 1472, 390+ problems solved
Previous Project: Smart CP Coach (deployed on Railway, uses Llama 3.1, dark theme)
Learning Style: Wants to learn by doing — guide step by step, don't just write code. Explain concepts with simple analogies.
Language: Communicates in Hindi-English mix (Hinglish)
Project Overview
Project: MindForge — AI Learning Companion
Tagline: "Don't just store knowledge — talk to it, learn from it, and let AI manage it."
Vision: AI-powered workspace where users store knowledge (notes, PDFs, resources), chat with it (RAG), get learning suggestions (spaced repetition), and manage everything via natural language (AI Actions).
Core Differentiators: Learning Memory (knowledge decay detection) + AI Actions (not just chat, but CRUD via commands)
Theme: Dark mode, purple accent (Linear App style)
Tech Stack
Layer	Technology
Frontend	React + Vite (JavaScript, NOT TypeScript)
Styling	CSS (plain, no Tailwind yet)
Backend	Django REST Framework
Database	PostgreSQL 18.4 (local install, not Docker)
Vector Search	PGVector (Phase 3)
Auth	JWT (SimpleJWT — access 15min + refresh 7 days)
AI (Chat)	Google Gemini Flash (free)
AI (Embeddings)	Cohere Embed v3 (free)
AI (Local Dev)	Ollama
Task Queue	Celery + Redis (Phase 3)
Docker	Not installed yet — planned for Phase 3
Project Location
Path: C:\Users\Yash\OneDrive\Desktop\MindForge
Backend: Root folder (Django project named config)
Frontend: frontend/ subfolder (Vite + React)
Docs: docs/ folder (roadmap.md, decisions.md, architecture.md)
Virtual Env: venv/ in root
Database Credentials
PostgreSQL Superuser: postgres / MindForge_Yash
App Database: mindforge
App User: mindforge_user / mindforge123
Django Apps Structure
App	Status	Purpose
accounts	✅ Active	Auth (register, login)
notes	Created, empty models	Notes, Categories, Tags
goals	Created, empty models	Goals, Tasks (Phase 6)
Phase 0 — COMPLETED ✅
 PostgreSQL installed and configured
 Django project with DRF, JWT, CORS, django-environ
 React project with Vite (JavaScript)
 Frontend ↔ Backend connected (CORS working)
 Database schema designed (19 tables across 7 phases)
 UI theme chosen: Dark purple (Linear style)
 Docs updated (roadmap, decisions, architecture)
 Docker — deferred to Phase 3
Phase 1 — IN PROGRESS 🔨
Completed So Far:
 JWT Token endpoints (/api/auth/token/, /api/auth/token/refresh/)
 Register API (/api/auth/register/)
 Register Page (React — pages/Register.jsx)
 Login Page (React — pages/Login.jsx)
 Token storage in localStorage
 Dashboard redirect after login
 Axios interceptor (auto-attach token to requests)
 Basic routing (/, /register, /login, /dashboard)
Still TODO in Phase 1:
 Notes models (Category, Tag, Note) in Django
 Notes serializers and ViewSets (CRUD API)
 Notes API endpoints
 Notes UI in React (create, edit, delete, list)
 Markdown support in notes
 Dashboard with recent notes and stats
 User profile page
 Basic API tests
Current API Endpoints
Method	URL	Auth	Purpose
POST	/api/auth/register/	No	Register new user
POST	/api/auth/token/	No	Login → get tokens
POST	/api/auth/token/refresh/	No	Refresh access token
GET	/api/hello/	No	Test endpoint
Frontend Structure

frontend/src/
├── api/
│   └── axios.js          (Axios instance with interceptor)
├── components/            (empty — reusable UI pieces)
├── context/               (empty — auth state)
├── hooks/                 (empty — custom hooks)
├── pages/
│   ├── Login.jsx          (login form + token save)
│   └── Register.jsx       (registration form)
├── App.jsx                (routes: /, /register, /login, /dashboard)
├── index.css              (empty — needs styling)
└── main.jsx               (React entry point)
Roadmap Summary (Revised)
Phase	Name	Time	Status
Phase 0	Foundation Setup	1 week	✅ Complete
Phase 1	Core Workspace (Auth + Notes)	4-5 weeks	🔨 In Progress
Phase 2	Knowledge Vault (PDFs + Resources)	3 weeks	Upcoming
Phase 3	RAG Engine ⭐ (MIP ships here)	5-6 weeks	Upcoming
Phase 4	AI Learning Layer	3-4 weeks	Upcoming
Phase 5	Learning Memory ⭐⭐ (Differentiator)	4 weeks	Upcoming
Phase 6	AI Actions + Goals/Tasks	3-4 weeks	Upcoming
Phase 7	Daily Brief + Timeline	2 weeks	Upcoming
Key Documents in Project
docs/roadmap.md — Full revised roadmap with exit criteria per phase
docs/decisions.md — All architectural decisions with reasoning
docs/architecture.md — System diagram, DB schema, API structure, app mapping
Key Artifacts (Review Artifacts)
Database Schema Design: Detailed ER diagrams, 19 tables, design decisions explained
Roadmap Review: Rated 6.8/10 initially, improved to 8.2/10 with revisions
Important Notes
User wants to LEARN, not just copy-paste. Explain concepts with analogies.
Keep explanations in Hinglish (Hindi-English mix).
Don't write code directly to files — guide the user on what to write and why.
User's OS: Windows, Shell: PowerShell
The goals app exists but models are empty — Goals/Tasks are deferred to Phase 6.