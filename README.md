# SAHIL SINGH AI PORTFOLIO — Windows 11 AI Resume & Portfolio Chatbot

A modern, Windows 11 Fluent UI inspired interactive **AI Resume & Portfolio Desktop OS** built with **React 19**, **TypeScript**, **Tailwind CSS**, and **Python FastAPI** powered by **Groq API / Gemini AI**.

---

## ✨ Features & Highlights

- 🖥️ **Windows 11 Desktop UI**: Authentic desktop interface featuring start menu, quick settings toggle, taskbar window controls, interactive floating window frames, and custom Windows 11 Dark Mode wallpaper.
- 🤖 **Interactive AI Assistant**: Personalized candidate chatbot trained automatically on resume and personal details.
- 📄 **Interactive Resume Viewer**: Embedded candidate resume document viewer with instant PDF download and interactive section Q&A.
- 🎯 **JD Matcher & Gap Analyzer**: Paste any Job Description to analyze match score, missing keywords, and custom fit highlights.
- 🛠️ **Technical Skills Matrix**: Comprehensive showcase of engineering stack, Python, FastAPI, RAG, and AI skills.

---

## 📁 Project Structure

```
├── .github/
│   └── workflows/ci.yml      # 🤖 GitHub Actions Automated Build & Lint CI
├── backend/                  # 🐍 Python FastAPI Backend
│   ├── main.py               # FastAPI App (Groq/Gemini LLM + Automatic Resume & PDF parsing)
│   ├── requirements.txt      # Python dependencies (fastapi, groq, pypdf, etc.)
│   ├── .env.example          # Backend Environment variable template
│   ├── my_resume.pdf         # 📄 Resume PDF (Auto-detected)
│   ├── personal_details.pdf  # 📄 Personal Details PDF (Auto-detected)
│   └── README.md             # Backend documentation
├── frontend/                 # ⚛️ Standalone React Frontend
│   ├── src/                  # React components, Windows 11 UI, assets
│   ├── package.json          # Frontend npm package dependencies
│   ├── vite.config.ts        # Vite configuration
│   ├── .env.example          # Frontend Environment variable template
│   └── README.md             # Frontend documentation
├── server.ts                 # Express Node server for production & dev proxy
├── package.json              # Applet npm configuration
└── README.md                 # Project Overview & Setup Guide
```

---

## 🚀 Quick Setup Guide for VS Code

### Prerequisites
- **Node.js**: v18+ or v20+
- **Python**: 3.10+
- **Groq API Key**: Get a free API key at [https://console.groq.com/keys](https://console.groq.com/keys)

---

### Step 1: Set Up Python Backend (`backend/`)

1. Open VS Code Terminal (`Ctrl + ~` or `Cmd + ~`) and navigate to the `backend` folder:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   ```bash
   # On macOS / Linux:
   python3 -m venv venv
   source venv/bin/activate

   # On Windows (Command Prompt):
   python -m venv venv
   venv\Scripts\activate

   # On Windows (PowerShell):
   python -m venv venv
   venv\Scripts\Activate.ps1
   ```

3. Install required packages:
   ```bash
   pip install -r requirements.txt
   ```

4. Create your `.env` configuration file:
   ```bash
   cp .env.example .env
   ```
   Open `.env` in VS Code and set your **Groq API Key**:
   ```env
   GROQ_API_KEY=gsk_your_actual_groq_api_key_here
   GROQ_MODEL=openai/gpt-oss-120b
   ```

5. **Train AI on Your Resume & Personal Details Automatically**:
   - Simply copy your resume PDF into `backend/` or root and name it `my_resume.pdf` or `resume.pdf`.
   - Copy any personal details PDF into `backend/` or root and name it `personal_details.pdf`.
   - When the backend starts up, `pypdf` extracts its contents and trains the AI assistant automatically!

6. Start the FastAPI server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   Your backend is now live at `http://localhost:8000`. You can test endpoints interactively at `http://localhost:8000/docs`.

---

### Step 2: Set Up React Frontend (`root`)

1. Open a **new terminal tab** in VS Code at the project root directory:
   ```bash
   # Make sure you are in the project root directory
   npm install
   ```

2. Create your frontend `.env` configuration file:
   ```bash
   cp .env.example .env
   ```
   In `.env`, set:
   ```env
   GROQ_API_KEY=gsk_your_actual_groq_api_key_here
   FASTAPI_URL=http://localhost:8000
   ```

3. Start the Vite dev server:
   ```bash
   npm run dev
   ```

4. Open `http://localhost:3000` in your browser to experience **Sahil Singh AI Portfolio**!

---

## 🛠️ Tech Stack
- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, Motion
- **Backend**: Python 3.10+, FastAPI, Pydantic, PyPDF, Uvicorn
- **AI Engine**: Groq API (`openai/gpt-oss-120b`), Node Express Proxy
- **CI/CD**: GitHub Actions (`.github/workflows/ci.yml`)
