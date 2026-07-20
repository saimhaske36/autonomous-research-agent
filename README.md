# ⚡ ResearchX.AI — Autonomous Multi-Agent Intelligence Platform

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![LangGraph](https://img.shields.io/badge/LangGraph-Agentic_AI-FF6F00?style=for-the-badge)](https://langchain-ai.github.io/langgraph/)
[![Groq](https://img.shields.io/badge/Groq-Llama_3.3_70B-f55036?style=for-the-badge)](https://groq.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

An enterprise-grade, autonomous multi-agent research platform. **ResearchX.AI** plans, searches, scrapes, synthesizes market trends, SWOT indicators, and generates production-ready intelligence reports in seconds using coordinated AI agent networks.

---

## 🌟 Key Features

### 🤖 Autonomous LangGraph Agent Network
- **Planner Agent**: Deconstructs complex user prompts into targeted search strategies.
- **Collector Agent**: Scrapes web sources and extracts live content.
- **Extractor Agent**: Distills core findings, market trends, opportunities, and risks using LLMs.
- **Writer Agent**: Compiles comprehensive markdown research reports with full source citations.

### 🛡️ System Administration & User Management
- **Split-Screen Admin Console**: Dedicated dashboard (`admin.html`) to audit research runs, monitor system health, and manage user accounts.
- **User Block & Suspension Guards**: Instant account suspension (`is_blocked = True`) that terminates active sessions across the network.
- **Cascading Database Purge**: Deleting a user automatically purges associated research jobs, findings, and reports to keep storage lean.

### 🔒 Modern Security & Password Recovery
- **Email-Based Authentication**: Strict regex format validations on user login, registration, and admin forms.
- **SMTP Password Reset Engine**: Direct password reset token emails with inline link routing and fallback simulator toast support.
- **JWT Cryptographic Sessions**: HMAC-SHA256 signed access tokens with custom claim validation.

### 🐘 Dual Database Engine (PostgreSQL & SQLite)
- Production support for **PostgreSQL** (`psycopg2-binary`) alongside local SQLite development setups.
- Automated SQL migration fallbacks.

### 🎨 Tactile & Responsive UI
- **Physics-Based Scale Popups**: Smooth card transitions using custom cubic-bezier curves (`cubic-bezier(0.34, 1.56, 0.64, 1)`).
- **Password Visibility Toggles**: Interactive eye-icon toggles on all login forms.

---

## 🏗️ Architecture & Data Flow

```mermaid
graph TD
    A[Frontend Dashboard: index.html] -->|HTTP Requests| B[FastAPI Backend: app.main]
    C[Admin Console: admin.html] -->|HTTP Requests| B
    B -->|SQLAlchemy ORM| D[(PostgreSQL / SQLite)]
    B -->|LangGraph Workflows| E[LLM Providers: Groq Llama 3.3]
    E -->|Scraped Web Content| B
```

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Backend Framework** | FastAPI (Python 3.11+) |
| **Agentic Workflows** | LangGraph, LangChain |
| **Database** | PostgreSQL (`psycopg2-binary`) / SQLite |
| **AI / LLM** | Groq API (`llama-3.3-70b-versatile`), Ollama, OpenAI |
| **Frontend** | HTML5, Vanilla CSS3 (Glassmorphism & Micro-animations), Modern JavaScript (ES6+) |
| **Security & Auth** | Custom HMAC-SHA256 JWT, Passlib (BCrypt) |

---

## ⚙️ Quick Start Guide

### 1. Clone the Repository
```bash
git clone https://github.com/saimhaske36/autonomous-research-agent.git
cd autonomous-research-agent
```

### 2. Set Up Virtual Environment & Dependencies
```bash
# Create virtual environment
python -m venv .venv

# Activate environment (Windows)
.\.venv\Scripts\activate

# Install dependencies
pip install -r backend/requirements.txt
```

### 3. Environment Configuration
Create a `.env` file in the root directory:

```env
APP_NAME=ResearchX.AI
APP_VERSION=1.0.0
DEBUG=True
API_PREFIX=/api/v1

# Database Configuration (PostgreSQL or SQLite)
DATABASE_URL=postgresql://postgres:password@localhost:5432/research_db
# Or for SQLite: DATABASE_URL=sqlite:///./research.db

# LLM Keys
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile
LLM_PROVIDER=groq
TAVILY_API_KEY=your_tavily_api_key

# Admin Credentials
ADMIN_USERNAME=saimhaske36@gmail.com
ADMIN_PASSWORD=Pass@12345
JWT_SECRET_KEY=your_custom_jwt_secret_key
```

### 4. Run the Application
Start the FastAPI server (it automatically serves both the backend API and frontend interfaces):

```bash
uvicorn app.main:app --reload --cwd backend
```

---

## 🌐 Application Access Points

- **User Portal**: [http://127.0.0.1:8000/](http://127.0.0.1:8000/)
- **Admin Console**: [http://127.0.0.1:8000/admin.html](http://127.0.0.1:8000/admin.html)
- **FastAPI Interactive Docs**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

## 🚀 Live Cloud Deployment (Render.com)

1. Push your repository to GitHub.
2. Create a Managed PostgreSQL Database on [Render.com](https://render.com).
3. Create a **Web Service** on Render connected to your repo:
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Set Environment Variables in Render dashboard (`DATABASE_URL`, `GROQ_API_KEY`, etc.).

---

## 👨‍💻 Author

**Sai Mhaske**
- GitHub: [@saimhaske36](https://github.com/saimhaske36)

---

⭐ **If you find ResearchX.AI helpful, give it a star on GitHub!**