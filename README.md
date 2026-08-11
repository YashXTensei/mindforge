<div align="center">
  <img src="frontend/public/favicon.jpg" alt="MindForge Logo" width="120" height="120" style="border-radius: 20px;" />
  
  # MindForge 🧠
  **Your Intelligent Second Brain**
  
  [![Live Demo](https://img.shields.io/badge/Live_Demo-MindForge-8A2BE2?style=for-the-badge&logo=vercel)](https://mindforge-gamma.vercel.app/)
  [![Django](https://img.shields.io/badge/Django-092E20?style=for-the-badge&logo=django&logoColor=green)](https://www.djangoproject.com/)
  [![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
</div>

<br/>

MindForge is an AI-powered personal knowledge base and operating system. It goes beyond simple note-taking by allowing you to **interact** with your knowledge. Upload documents, write notes, and use the integrated AI to semantically search, synthesize, and chat directly with your own data.

## 🌟 Live Demo

**Experience MindForge:** [mindforge-gamma.vercel.app](https://mindforge-gamma.vercel.app/)

*(Note: The backend is hosted on Heroku Eco Dynos. If it's asleep, the first request might take 5-10 seconds to wake up!)*

---

## 📸 Screenshots


1. **Dashboard**
   <img width="1917" height="1077" alt="Screenshot 2026-08-11 162539" src="https://github.com/user-attachments/assets/323a6fa8-9ec7-42b7-b665-5713698bf823" />


2. **AI Chat with RAG**
   <img width="1917" height="970" alt="Screenshot 2026-08-11 191016" src="https://github.com/user-attachments/assets/d8bcb165-9803-4a5c-b010-0c776f972f72" />


3. **About Page**
   <img width="1917" height="1077" alt="Screenshot 2026-08-11 162436" src="https://github.com/user-attachments/assets/b408efb3-093b-4a6e-9880-313d3c9bf826" />


---

## ✨ Key Features

- **Document Vault (RAG Pipeline):** Upload PDFs and images. MindForge automatically extracts text, chunks it intelligently, and generates high-dimensional vector embeddings using Cohere.
- **Semantic Search:** Don't just search for exact keywords. Find notes and documents by their *meaning* using PostgreSQL's `pgvector` HNSW index.
- **Smart Notes:** Write, format, and organize your thoughts with Markdown support.
- **AI Chat (Gemini 3.6 Flash):** Chat directly with your vault. The AI retrieves relevant context from your documents and cites its sources when answering.
- **Background Processing:** Heavy tasks (like embedding generation and text extraction) are offloaded to Celery & Redis workers to keep the UI buttery smooth.
- **🔐 JWT Authentication & User Isolation:** Secure, token-based authentication ensuring your knowledge base is completely private.
- **🔎 Global Search:** Instantly search across all your notes, documents, and resources in one place.
- **🏷️ Categories & Tags:** Organize your notes effectively with customizable categories and tagging system.

---

## 🏗️ Architecture

```text
                    MindForge
                       │
              ┌────────┴────────┐
              │                 │
          Vercel             Heroku
        React + Vite      Django + DRF
                              │
             ┌────────────────┼───────────────┐
             │                │               │
         PostgreSQL         Redis          Cloudinary
          + pgvector         │                 (Media)
             │             Celery
             │                │
             └────── RAG ─────┘
                    │
               Cohere + Gemini
```

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 19 + Vite
- **Styling:** Tailwind CSS + Lucide Icons
- **State/Fetching:** TanStack React Query + Axios
- **Deployment:** Vercel

### Backend
- **Framework:** Django + Django REST Framework
- **Database:** PostgreSQL (with `pgvector` extension for semantic search)
- **Task Queue:** Celery + Redis
- **AI/LLMs:** Cohere (Embeddings) + Google Gemini (Chat Generation)
- **Storage:** Cloudinary (for PDFs and Images)
- **Deployment:** Heroku (Web + Worker Eco Dynos)

---

## 📂 Project Structure

```text
mindforge/
├── accounts/      # User authentication and management
├── notes/         # Note creation, tagging, and categories
├── vault/         # Document upload, storage, and resource links
├── rag/           # RAG pipeline, chunking, embeddings, and chat
├── search/        # Global search and semantic search APIs
├── config/        # Main Django configuration and routing
├── frontend/      # React Vite application
│   └── src/
├── manage.py      # Django CLI
├── requirements.txt # Python dependencies
└── Procfile       # Heroku deployment configuration
```

---

## 🚀 Local Development Setup

Want to run MindForge locally? Follow these steps:

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL (with `pgvector` installed locally)
- Redis server running locally

### 1. Backend Setup
```bash
# Clone the repo
git clone https://github.com/YashXTensei/mindforge.git
cd mindforge

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows PowerShell:
.\venv\Scripts\Activate.ps1
# On Windows CMD:
venv\Scripts\activate
# On macOS / Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations and start server
python manage.py migrate
python manage.py runserver
```

### 2. Background Workers (Celery)
In a new terminal window (with the venv activated):
```bash
celery -A config worker -l info --pool=solo
```

### 3. Frontend Setup
In a third terminal window:
```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173`.

---

## 🔐 Environment Variables

You'll need a `.env` file in the root backend directory to run the project. Use `.env.example` as a template and provide your own credentials for:
- PostgreSQL database
- Redis cache
- Cloudinary (Media storage)
- Cohere API (Embeddings)
- Google Gemini API (LLM)

---

## 👨‍💻 About the Creator

Built with curiosity, caffeine, and an unreasonable number of commits by **Yash Mittal**. 

- **Codeforces:** [YashXCoder](https://codeforces.com/profile/YashXCoder)
- **GitHub:** [@YashXTensei](https://github.com/YashXTensei)
- **LinkedIn:** [Yash Mittal](https://www.linkedin.com/in/yash-mittal-5a0b77382/)

---

<div align="center">
  <i><b>MindForge 1.0.0 — The first public release</b></i>
</div>
