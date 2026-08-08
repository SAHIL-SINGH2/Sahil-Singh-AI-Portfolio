# FastAPI Backend (Groq Powered)

This directory contains the Python FastAPI backend for the AI Resume Chatbot application.

## Features
- **Powered by Groq API** using `openai/gpt-oss-120b` for sub-second, highly intelligent responses.
- **Automatic Resume Training**: Automatically checks for `my_resume.pdf` in the `backend/` folder when starting up, extracts text with `pypdf`, parses structured data with Groq JSON mode, and trains the candidate AI model on it automatically!
- **FastAPI Endpoints**:
  - `GET /`: Health check & resume detection status
  - `POST /chat`: Candidate interview chatbot API (`{"question": "What are your skills?"}`)

## Local Setup Instructions (VS Code)

### 1. Install Dependencies
```bash
cd backend
python -m venv venv

# On macOS/Linux:
source venv/bin/activate
# On Windows (Command Prompt):
venv\Scripts\activate
# On Windows (PowerShell):
venv\Scripts\Activate.ps1

pip install -r requirements.txt
```

### 2. Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Open `.env` and enter your Groq API Key:
```env
GROQ_API_KEY=gsk_...
GROQ_MODEL=openai/gpt-oss-120b
```

### 3. Add your Resume PDF
Place your own resume PDF file named `my_resume.pdf` directly inside the `backend/` directory:
```
backend/
├── main.py
├── my_resume.pdf   <-- Put your resume here!
├── requirements.txt
└── .env
```

### 4. Run FastAPI Server
```bash
uvicorn main:app --reload --port 8000
```
Your FastAPI backend will run on `http://localhost:8000` with interactive API docs at `http://localhost:8000/docs`.
