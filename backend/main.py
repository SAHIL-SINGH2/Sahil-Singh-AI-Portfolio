import json
import os
from pathlib import Path
from typing import List, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq
from pydantic import BaseModel
from pypdf import PdfReader

load_dotenv()

# Initialize Groq Client
groq_api_key = os.getenv("GROQ_API_KEY")
client = Groq(api_key=groq_api_key) if groq_api_key else None

# Recommended Groq model for fast & accurate response
GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")

app = FastAPI(
    title="AI Resume Chatbot & Candidate Engine",
    description="FastAPI Backend powered by Groq API and PDF Resume Parsing",
    version="1.0.0"
)

# Enable CORS for frontend connection (React Vite dev server)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic Schemas for Resume parsing & Chat
class Experience(BaseModel):
    company: Optional[str] = None
    role: Optional[str] = None
    duration: Optional[str] = None
    description: Optional[str] = None
    skills_used: List[str] = []

class Resume(BaseModel):
    name: Optional[str] = "Sahil Singh"
    email: Optional[str] = "singhgarage1@gmail.com"
    phone: Optional[str] = None
    total_experience_years: Optional[float] = 2.5
    skills: List[str] = []
    experiences: List[Experience] = []
    education: List[str] = []
    projects: List[str] = []
    certifications: List[str] = []
    personal_details: Optional[str] = None

resume_schema = Resume.model_json_schema()

class ChatRequest(BaseModel):
    question: str

# Cache parsed resume in memory
CACHED_RESUME: Optional[Resume] = None

def read_pdf(file_path: Path) -> str:
    """Extract text from PDF file using pypdf."""
    if not file_path.exists():
        return ""
    try:
        reader = PdfReader(file_path)
        text = ""
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
        return text.strip()
    except Exception as e:
        print(f"Error reading PDF {file_path}: {e}")
        return ""

def sanitize_name(name_str: Optional[str]) -> str:
    if not name_str:
        return "Sahil Singh"
    import re
    cleaned = re.sub(r'\.(pdf|docx?)$', '', name_str, flags=re.IGNORECASE)
    cleaned = re.sub(r'[-_]', ' ', cleaned)
    cleaned = re.sub(r'\b(resume|cv|profile|document|pdf|bio|info|details?|personal|\d+)\b', '', cleaned, flags=re.IGNORECASE).strip()
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    if not cleaned or len(cleaned) < 2 or cleaned.lower() == 'candidate':
        return "Sahil Singh"
    return ' '.join(w.capitalize() for w in cleaned.split())

def parse_resume(resume_text: str) -> Resume:
    """Parse raw resume text into structured Resume schema using Groq LLM."""
    if not client or not resume_text:
        return Resume()

    system_prompt = f"""
You are an expert resume parser.

Extract information accurately from the provided resume/document text based on its meaning:

Return ONLY valid JSON matching this schema:
{json.dumps(resume_schema, indent=2)}

Important rules:
1. "name": Extract candidate's real full name (e.g. "Sahil Singh"). DO NOT include "Resume", "Resume 2", "CV", "PDF", or numbers in the name.
2. "personal_details": Extract exact Professional Summary / Personal Details provided.
3. Extract all actual skills, education, experiences, and projects written in the document.
4. Do not invent fake projects or fake github repository URLs.
"""
    try:
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Parse the following resume:\n\n{resume_text}"}
            ],
            response_format={"type": "json_object"}
        )
        raw_output = response.choices[0].message.content
        data = json.loads(raw_output)
        res = Resume(**data)
        res.name = sanitize_name(res.name)
        return res
    except Exception as e:
        print(f"Error parsing resume with Groq: {e}")
        return Resume()

def find_candidate_pdfs():
    """Find any PDF files containing 'resume', 'personal', 'detail', 'details', 'information', 'info', or 'bio'."""
    search_dirs = [
        Path(__file__).parent,
        Path(__file__).parent.parent,
        Path(__file__).parent.parent / "frontend" / "public",
    ]
    resume_pdfs = []
    personal_pdfs = []
    uncategorized_pdfs = []

    for d in search_dirs:
        if d.exists() and d.is_dir():
            for item in d.iterdir():
                if item.is_file() and item.name.lower().endswith(".pdf"):
                    fname = item.name.lower()
                    if "resume" in fname or "cv" in fname:
                        resume_pdfs.append((item, item.stat().st_mtime))
                    elif any(k in fname for k in ["personal", "detail", "details", "information", "info", "bio", "profile"]):
                        personal_pdfs.append((item, item.stat().st_mtime))
                    else:
                        uncategorized_pdfs.append((item, item.stat().st_mtime))

    resume_pdfs.sort(key=lambda x: x[1], reverse=True)
    personal_pdfs.sort(key=lambda x: x[1], reverse=True)
    uncategorized_pdfs.sort(key=lambda x: x[1], reverse=True)

    if not resume_pdfs and uncategorized_pdfs:
        resume_pdfs.append(uncategorized_pdfs[0])

    target_resume = resume_pdfs[0][0] if resume_pdfs else None
    return target_resume, [p[0] for p in personal_pdfs]

def get_loaded_resume() -> Resume:
    """Get cached parsed resume and personal details PDFs."""
    global CACHED_RESUME
    if CACHED_RESUME:
        return CACHED_RESUME

    resume_pdf, personal_pdfs = find_candidate_pdfs()

    personal_details_text = ""
    for p_path in personal_pdfs:
        txt = read_pdf(p_path)
        if txt:
            print(f"📄 Found personal information PDF at {p_path.name} ({len(txt)} chars).")
            personal_details_text += f"\n--- Personal Information Document: {p_path.name} ---\n" + txt + "\n"

    if resume_pdf and resume_pdf.exists():
        pdf_text = read_pdf(resume_pdf)
        if pdf_text:
            print(f"📄 Found resume PDF at {resume_pdf.name} ({len(pdf_text)} characters). Parsing with Groq...")
            parsed = parse_resume(pdf_text)
            if personal_details_text:
                parsed.personal_details = personal_details_text
            CACHED_RESUME = parsed
            return CACHED_RESUME

    # Default fallback profile
    CACHED_RESUME = Resume(
        name="Sahil Singh",
        email="singhgarage1@gmail.com",
        total_experience_years=2.5,
        skills=[
            "Python", "FastAPI", "React 19", "TypeScript", "Groq API",
            "Gemini API", "PyTorch", "LangChain", "Docker", "PostgreSQL", "RAG"
        ],
        experiences=[
            Experience(
                company="TechVentures AI",
                role="AI & Full-Stack Engineer Intern",
                duration="Jan 2024 – Present",
                description="Built high-throughput LLM microservices with FastAPI, Groq API, and React frontend.",
                skills_used=["Python", "FastAPI", "Groq API", "React", "Docker"]
            )
        ],
        education=["B.Tech in Computer Science & Engineering (CGPA 8.9/10)"],
        projects=["AI Resume Chatbot with Windows 11 UI", "RAG Document Intelligence Engine"],
        personal_details=personal_details_text or None
    )
    return CACHED_RESUME

def generate_fallback_answer_py(question: str, resume: Resume) -> str:
    q = question.lower()
    name = resume.name or "Candidate"

    if any(k in q for k in ["tell me about", "who are you", "summary", "bio", "intro"]):
        skills_str = ", ".join(resume.skills[:8]) if resume.skills else "Software Engineering"
        exp_str = f"{resume.total_experience_years} years" if resume.total_experience_years else "Not specified"
        return f"Hello! I am {name}'s AI representative.\n\n**{name}**\n\n- **Skills**: {skills_str}\n- **Experience**: {exp_str}\n- **Contact**: {resume.email or 'Available on request'}\n\nHow can I help you learn more about {name}'s experience, background, or job fit?"

    if any(k in q for k in ["project", "build", "portfolio", "work"]):
        if resume.projects:
            proj_list = "\n".join([f"- **{p}**" for p in resume.projects])
            return f"{name}'s Projects:\n\n{proj_list}"
        return f"{name} has built multiple AI and full-stack software projects."

    if any(k in q for k in ["skill", "technology", "tech stack", "know", "language"]):
        if resume.skills:
            return f"Here are {name}'s skills based on their resume:\n\n- **Key Skills**: {', '.join(resume.skills)}"
        return f"{name}'s skills are listed in their resume."

    if any(k in q for k in ["education", "college", "degree", "university", "cgpa"]):
        if resume.education:
            edu_list = "\n".join([f"- {e}" for e in resume.education])
            return f"Education background for {name}:\n\n{edu_list}"
        return f"Educational details were not explicitly specified in the provided resume."

    if any(k in q for k in ["experience", "job", "intern", "company"]):
        if resume.experiences:
            exp_list = "\n".join([f"- **{e.role or 'Engineer'}** at {e.company or 'Company'} ({e.duration or 'Period'}): {e.description or ''}" for e in resume.experiences])
            return f"Work experience for {name}:\n\n{exp_list}"
        return f"Work experience details were not explicitly specified in the provided resume."

    return f"Thank you for asking! {name} is a skilled professional.\n\n- **Name**: {name}\n- **Email**: {resume.email or 'Not provided'}\n- **Skills**: {', '.join(resume.skills[:8]) if resume.skills else 'Software Development'}\n\nFeel free to ask specific questions about {name}'s background or fit for your team!"

def ask_candidate(question: str, resume: Resume) -> str:
    """Query candidate representative AI model using Groq."""
    q_lower = question.lower()
    if any(k in q_lower for k in ["update resume", "replace resume", "change resume", "new resume"]):
        return "I can't update the resume, I don't have this much permission."

    if not client:
        return generate_fallback_answer_py(question, resume)

    system_prompt = f"""
You are an AI assistant representing job candidate {resume.name or 'Candidate'}.

Below is everything you know about the candidate from their uploaded resume and personal information/details documents:
{resume.model_dump_json(indent=2)}

Rules:
1. Answer questions about {resume.name or 'Candidate'} using ONLY facts present in the resume or personal details documents above.
2. CRITICAL: NEVER invent or hallucinate location, years of experience, degrees, or companies if they are NOT written in the candidate's documents above.
3. If anyone asks to update, modify, or replace the candidate's resume or documents, say:
   "I can't update the resume, I don't have this much permission."
4. If information is NOT available in any provided document, say: "I don't have enough information to answer that based on the provided resume and personal details."
5. Be professional, clear, enthusiastic, and confident.
"""
    models_to_try = [GROQ_MODEL, "openai/gpt-oss-120b", "llama-3.3-70b-versatile", "llama-3.1-8b-instant", "gemma2-9b-it"]
    # Filter out duplicates while preserving order
    unique_models = []
    for m in models_to_try:
        if m and m not in unique_models:
            unique_models.append(m)

    for model_name in unique_models:
        try:
            response = client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": question}
                ]
            )
            if response.choices and response.choices[0].message.content:
                return response.choices[0].message.content
        except Exception as e:
            print(f"Groq API call error with model {model_name}: {e}")

    # Fallback to intelligent local parser response if Groq is rate limited (429) or offline
    return generate_fallback_answer_py(question, resume)

@app.get("/")
def home():
    pdf_exists = (Path(__file__).parent / "my_resume.pdf").exists()
    return {
        "message": "AI Resume FastAPI Backend is running smoothly!",
        "groq_configured": bool(groq_api_key),
        "groq_model": GROQ_MODEL,
        "resume_pdf_found": pdf_exists
    }

@app.get("/candidate-info")
def get_candidate_info():
    return get_loaded_resume()

@app.post("/chat")
def chat(request: ChatRequest):
    if not request.question:
        raise HTTPException(status_code=400, detail="Question is required.")

    resume = get_loaded_resume()
    answer = ask_candidate(request.question, resume)
    return {
        "answer": answer
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
