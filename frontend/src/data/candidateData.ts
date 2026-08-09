import { CandidateProfile } from '../types';

export const sahilProfile: CandidateProfile = {
  name: "Sahil Singh",
  title: "AI & Full-Stack Software Engineer",
  location: "Aligarh, Uttar Pradesh, India",
  email: "sahilsinghjadaun4@gmail.com",
  phone: "+91-8218534932",
  github: "https://github.com/SAHIL-SINGH2",
  linkedin: "https://www.linkedin.com/in/sahil-singh2/",
  portfolio: "https://sahilsingh.dev",
  avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400",
  totalExperienceYears: 0,
  bio: "AI/ML and Computer Engineering undergraduate with hands-on experience building full-stack AI applications using React, TypeScript, FastAPI, LangChain, LangGraph, and PostgreSQL. Skilled in developing LLM-powered workflows, intelligent automation, and RESTful APIs with a strong foundation in data structures, algorithms, and software development. Built AI solutions for document processing, complaint management, and productivity automation using Groq Llama, Google Gemini, and SQLAlchemy. Passionate about solving real-world problems through scalable AI systems, modern web technologies, and clean, maintainable code.\n\nI am a curious and passionate Computer Science student who enjoys learning new technologies and challenging myself through practical projects. I have a strong interest in web development and Artificial Intelligence, and I like exploring how technology can solve real-world problems. I believe in learning by doing, whether it's building applications, earning certifications, or participating in technical activities. I am always eager to improve my skills, adapt to new tools, and grow both personally and technically. My goal is to keep learning, collaborate with others, and create meaningful solutions that make a positive impact.",
  personalDetails: "Aligarh, Uttar Pradesh, India | sahilsinghjadaun4@gmail.com | +91-8218534932",
  skills: {
    languages: ["TypeScript", "JavaScript", "Python", "SQL", "C++", "HTML5/CSS3"],
    frameworks: ["React 19", "FastAPI", "Node.js", "Express", "Vite", "Next.js", "Tailwind CSS"],
    aiMl: ["PyTorch", "Groq API", "Google Gemini API", "LangChain", "OpenAI API", "RAG Systems", "Vector DBs (Chroma/Qdrant)"],
    databases: ["PostgreSQL", "MongoDB", "Redis", "SQLite"],
    tools: ["Docker", "Git / GitHub", "Linux / Bash", "Postman", "Vercel", "Cloud Run", "AWS S3"]
  },
  experiences: [],
  projects: [
    {
      id: "proj-1",
      title: "AI Resume & Portfolio Chatbot (Windows 11 UI)",
      description: "A Fluent Windows 11 desktop experience allowing recruiters to interview an AI twin of Sahil. Features real-time streaming, Job Description matcher, interactive PDF resume generation, and profile analytics.",
      techStack: ["React 19", "TypeScript", "FastAPI", "Groq API", "Gemini API", "Express", "CSS Glassmorphism"],
      githubUrl: "https://github.com/SAHIL-SINGH2",
      liveUrl: "",
      category: "AI & Full-Stack",
      highlights: [
        "Built Windows 11 Fluent UI theme with mica glassmorphism and custom desktop window management.",
        "Implemented real-time streaming responses with FastAPI backend and SSE.",
        "Integrated Job Description matching engine with strength radar and skill gap analysis."
      ]
    },
    {
      id: "proj-2",
      title: "RAG Document Intelligence Engine",
      description: "Enterprise Retrieval-Augmented Generation platform that indexes complex PDFs, extracts tables/diagrams, and answers natural language queries with verified citations.",
      techStack: ["Python", "FastAPI", "LangChain", "Qdrant", "PyPDF", "React", "Docker"],
      githubUrl: "https://github.com/SAHIL-SINGH2",
      liveUrl: "",
      category: "AI / ML",
      highlights: [
        "Ingests multi-page PDF documents and chunks text for high contextual search accuracy.",
        "Sub-200ms vector search querying with Groq / Gemini LLMs.",
        "Created an interactive React document viewer with inline citations."
      ]
    },
    {
      id: "proj-3",
      title: "AI Document Processing & Complaint Management System",
      description: "Automated document workflow and complaint triage engine using Python, FastAPI, Groq Llama, Google Gemini, and SQLAlchemy to process user tickets and extract structured insights.",
      techStack: ["Python", "FastAPI", "SQLAlchemy", "PostgreSQL", "Groq Llama", "Google Gemini", "React"],
      githubUrl: "https://github.com/SAHIL-SINGH2",
      liveUrl: "",
      category: "AI & Full-Stack",
      highlights: [
        "Built LLM-powered workflows for automated document parsing and complaint categorization.",
        "Designed RESTful APIs with FastAPI and SQLAlchemy for persistent database operations.",
        "Streamlined ticket resolution with automated AI summary generation."
      ]
    }
  ],
  education: [
    {
      id: "edu-1",
      institution: "Aligarh Muslim University",
      degree: "Bachelor of Technology (B.Tech)",
      field: "Computer Engineering",
      duration: "2021 – 2025",
      cgpa: "8.9 / 10.0",
      scoreLabel: "CGPA",
      highlights: [
        "Pursuing B.Tech with focus on Software Engineering, Artificial Intelligence, and Web Development.",
        "Built full-stack AI software projects, RESTful APIs, and responsive web applications."
      ]
    }
  ],
  achievements: [
    "Built full-stack AI applications integrating LLM workflows (Groq Llama, Google Gemini) and vector search.",
    "Developed automated document processing and RAG document intelligence microservices.",
    "Maintained an active open-source contribution record on GitHub across web and AI technologies."
  ]
};

export const sampleSuggestedQuestions = [
  "Tell me about Sahil's background and top skills",
  "Show me Sahil's recent projects and tech stack",
  "Why should I hire Sahil for an AI / Full-Stack role?",
  "What is Sahil's experience with FastAPI and Python?",
  "Has Sahil worked with React and TypeScript?",
  "Tell me about Sahil's education and certifications"
];
