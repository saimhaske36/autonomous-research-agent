# 🤖 Autonomous Research Agent

An AI-powered Multi-Agent Research Platform that autonomously researches any topic, analyzes information from multiple sources, generates insights, and creates professional PDF reports.🤖 Autonomous Research Agent

---

## 🚀 Features

### 🔍 Autonomous Research
- Enter any research topic
- AI automatically creates a research plan
- Collects information from multiple web sources
- Extracts key findings

### 🧠 Multi-Agent Architecture
The platform uses specialized AI agents:

Planner Agent
↓
Search Agent
↓
Reader Agent
↓
Analyst Agent
↓
Writer Agent

### 📊 Advanced Analysis
- Executive Summary
- Market Trends
- Opportunities
- Risks
- Key Insights

### 📄 Professional Reports
- Auto-generated research reports
- PDF export support
- Research history tracking

### 📈 Dashboard
- Total Research Jobs
- Sources Collected
- Findings Extracted
- Progress Tracking

---

# 🏗️ Tech Stack

## Backend
- FastAPI
- LangGraph
- LangChain
- SQLAlchemy
- SQLite
- BeautifulSoup4

## Frontend
- Streamlit
- Pandas

## AI/LLM
- Groq API
- Llama Models

## Other Tools
- ReportLab
- Requests
- Pydantic

---

# 🧠 Workflow

1. User enters a research topic
2. Planner Agent creates research plan
3. Search Agent gathers sources
4. Reader Agent extracts findings
5. Analyst Agent performs analysis
6. Writer Agent generates final report
7. PDF report is created
8. Results are stored in database

---

# 📂 Project Structure

AUTONOMOUS-RESEARCH-AGENT
│
├── backend/
│   ├── app/
│   │   ├── agents/
│   │   ├── api/
│   │   ├── core/
│   │   ├── models/
│   │   ├── providers/
│   │   ├── repositories/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── state/
│   │   ├── utils/
│   │   ├── workflows/
│   │   └── main.py
│   │
│   ├── tests/
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── 🏠_Dashboard.py
│   └── requirements.txt
│
├── docs/
├── docker/
├── screenshots/
│
├── .gitignore
├── docker-compose.yml
├── README.md
└── LICENSE
---

# ⚙️ Quick Setup

## 1. Clone Repository

```bash
git clone https://github.com/yourusername/autonomous-research-agent.git
cd autonomous-research-agent
```

## 2. Backend Setup

```bash
cd backend

python -m venv .venv

.venv\Scripts\activate

pip install -r requirements.txt

uvicorn app.main:app --reload
```

## 3. Frontend Setup

Open a new terminal:

```bash
cd frontend

python -m venv .venv

.venv\Scripts\activate

pip install -r requirements.txt

streamlit run 🏠_Dashboard.py
```

## 4. Environment Variables

Create a `.env` file inside the `backend` folder:

```env
GROQ_API_KEY=your_api_key

DATABASE_URL=sqlite:///research.db
```

## Access

**Frontend:** http://localhost:8501

**Backend:** http://127.0.0.1:8000

**API Docs:** http://127.0.0.1:8000/docs

# 📊 Sample Research Output

✅ Executive Summary

✅ Market Trends

✅ Opportunities

✅ Risks

✅ Findings

✅ Source References

✅ PDF Report

---

# 🎯 Future Enhancements

- Real-Time Agent Progress Tracking
- RAG-based Knowledge Memory
- Multi-LLM Support
- Research Report Comparison
- Team Collaboration
- Cloud Deployment
- Citation Management
- Interactive Charts

---

# 👨‍💻 Author

Sai Mhaske

---

# ⭐ If you found this project useful, give it a star.