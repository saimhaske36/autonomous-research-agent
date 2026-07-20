# ⚡ ResearchX.AI — Autonomous Multi-Agent Intelligence Platform

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![LangGraph](https://img.shields.io/badge/LangGraph-Agentic_AI-FF6F00?style=for-the-badge)](https://langchain-ai.github.io/langgraph/)
[![Groq](https://img.shields.io/badge/Groq-Llama_3.3_70B-f55036?style=for-the-badge)](https://groq.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

An enterprise-grade, autonomous multi-agent research platform. **ResearchX.AI** plans, searches, scrapes, synthesizes market trends, SWOT indicators, and generates production-ready intelligence reports in seconds using coordinated AI agent networks.

---

## 🌐 Live Application Link

- 🚀 **Live Production Application**: [https://researchx-ai-89i0.onrender.com/](https://researchx-ai-89i0.onrender.com/)

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
flowchart TD
    subgraph Client ["🖥️ User Client Layer"]
        A[User Input / Dashboard]
    end

    subgraph API ["⚡ API Gateway & Security"]
        B[FastAPI Router /api/v1]
        C[JWT Auth & Input Validation]
    end

    subgraph Agents ["🧠 LangGraph Multi-Agent Orchestration"]
        D[Planner Agent] --> E[Search Agent / Tavily API]
        E --> F[Reader Agent / Scraper]
        F --> G[Analyst Agent / Groq LLM]
        G --> H[Writer Agent / Report Generator]
    end

    subgraph Data ["🐘 Storage & Database Layer"]
        I[(PostgreSQL Database)]
    end

    A -->|1. Submit Research Topic| B
    B -->|2. Verify Token & Body| C
    C -->|3. Dispatch Job Thread| D
    H -->|4. Persist Jobs, Findings & Reports| I
    I -->|5. Render Completed Report| A
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
python -m venv .venv
.\.venv\Scripts\activate
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
DATABASE_URL=postgresql://user:password@localhost:5432/research_db

# LLM Keys
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile
LLM_PROVIDER=groq
TAVILY_API_KEY=your_tavily_api_key
JWT_SECRET_KEY=your_custom_jwt_secret_key
```

### 4. Run the Application
Start the FastAPI server:

```bash
uvicorn app.main:app --reload --cwd backend
```

---

## 👨‍💻 Author

**Sai Mhaske**
- GitHub: [@saimhaske36](https://github.com/saimhaske36)

---

⭐ **If you find ResearchX.AI helpful, give it a star on GitHub!**