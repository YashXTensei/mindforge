# 🧠 MindForge AI

> A Personal AI Operating System and Knowledge Vault.

MindForge is an advanced Retrieval-Augmented Generation (RAG) platform that acts as your second brain. It allows you to upload documents, write notes, and save resources into a unified vault. Using vector search and generative AI, you can chat with your entire knowledge base instantly.

---

## ✨ Key Features

- **Document Processing (OCR & NLP):** Upload PDFs and images. MindForge automatically extracts text (using Gemini Vision), chunks it, and generates vector embeddings.
- **Smart RAG Pipeline:** Combines Cosine Distance vector search (HNSW index via `pgvector`) with a recency-decay ranking algorithm to retrieve the most relevant and up-to-date context.
- **AI Chat:** Converse naturally with your knowledge base. The AI cites exact sources when using your data, and falls back to general knowledge when needed.
- **Unified Knowledge Vault:** Organize text notes, uploaded files, and external web resources with tags and categories.
- **Background Processing:** Heavy tasks (extraction, embedding generation) run asynchronously via Celery and Redis to keep the UI lightning fast.
- **Data Privacy & Isolation:** Strict tenant isolation at the vector database level ensures that users only ever search over their own data chunks.

## 🏗️ Architecture Stack

### Backend
- **Framework:** Django (Python) + Django REST Framework
- **Database:** PostgreSQL + `pgvector` extension
- **Background Workers:** Celery + Redis
- **File Storage:** Cloudinary (Production) / Local Filesystem (Dev)
- **AI Models:** Cohere (`embed-english-v3.0`), Google Gemini (`3.6-flash`, Vision)

### Frontend
- **Framework:** React + Vite
- **Data Fetching:** TanStack React Query + Axios
- **Styling:** Vanilla CSS & Tailwind CSS styling concepts
- **Icons:** Lucide React

## 🚀 Local Setup

### 1. Prerequisites
- Python 3.12+
- Node.js 18+
- Docker Desktop (for Postgres and Redis)

### 2. Backend Setup
```bash
# Clone repository
git clone https://github.com/YashXTensei/mindforge.git
cd MindForge

# Create virtual environment and install dependencies
python -m venv venv
.\venv\Scripts\activate  # On Windows
pip install -r requirements.txt

# Setup Environment Variables
cp .env.example .env
# Fill in your GEMINI_API_KEY and COHERE_API_KEY in the .env file

# Start Database and Redis via Docker
docker-compose up -d

# Run Migrations
python manage.py migrate
python manage.py createsuperuser

# Start the Django server and Celery worker
python manage.py runserver
# In a new terminal:
celery -A config worker -l info
```

### 3. Frontend Setup
```bash
cd frontend
npm install

# Start the Vite development server
npm run dev
```

## 🌍 Production Deployment

MindForge is built to be deployed on Heroku (Backend) and Vercel (Frontend). 

### Backend (Heroku)
1. Provision a Heroku App with **Essential-0 Postgres** and **Mini Redis** addons.
2. Ensure you subscribe to **Eco Dynos** to scale your web and worker processes.
3. Configure `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` for persistent media storage.
4. Deploy using `git push heroku main`.

### Frontend (Vercel)
1. Import the `/frontend` directory to Vercel.
2. Set the `VITE_API_URL` environment variable to your Heroku app domain (e.g., `https://your-app.herokuapp.com/api`).
3. Deploy!

## 🛡️ Security

- **Rate Limiting:** Global rate limiting is applied via DRF ScopedRateThrottle to prevent AI API abuse.
- **Token Rotation:** Stateless authentication utilizing JWT (JSON Web Tokens) with automatic transparent token refresh via Axios interceptors.
- **Production Headers:** HSTS, Secure Cookies, X-Frame-Options Deny, and SSL proxy forwarding enabled automatically when `DEBUG=False`.

---
*Built with ❤️ for knowledge management and AI exploration.*
