import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { sahilProfile } from './frontend/src/data/candidateData.js';
import { CandidateProfile } from './frontend/src/types.js';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Active candidate profile (defaults to sahilProfile, updated if candidate PDFs are detected)
let activeCandidateProfile: CandidateProfile = { ...sahilProfile };
let lastParsedPdfSignature = '';

// Helper to initialize Gemini lazily
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Universal PDF text extractor compatible with pdf-parse v1, v2 (PDFParse class), and raw fallback
async function extractTextFromPdfBuffer(pdfBuffer: Buffer): Promise<string> {
  // Polyfill DOMMatrix / ImageData / Path2D globals for node serverless env if pdfjs-dist requires them
  if (typeof globalThis.DOMMatrix === 'undefined') {
    (globalThis as any).DOMMatrix = class DOMMatrix {
      a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
      constructor(init?: any) {
        if (Array.isArray(init) && init.length >= 6) {
          this.a = init[0]; this.b = init[1]; this.c = init[2]; this.d = init[3]; this.e = init[4]; this.f = init[5];
        }
      }
    };
  }
  if (typeof globalThis.ImageData === 'undefined') {
    (globalThis as any).ImageData = class ImageData {};
  }
  if (typeof globalThis.Path2D === 'undefined') {
    (globalThis as any).Path2D = class Path2D {};
  }

  // Intercept warnings during pdf-parse execution to suppress @napi-rs/canvas warning logs in Vercel
  const originalWarn = console.warn;
  const originalError = console.error;
  const quietFilter = (...args: any[]) => {
    const str = args.map((a) => String(a || '')).join(' ');
    return (
      str.includes('@napi-rs/canvas') ||
      str.includes('pdfjs-dist') ||
      str.includes('DOMMatrix') ||
      str.includes('ImageData') ||
      str.includes('Path2D')
    );
  };

  const silenceLogs = () => {
    console.warn = (...args: any[]) => {
      if (quietFilter(...args)) return;
      originalWarn(...args);
    };
    console.error = (...args: any[]) => {
      if (quietFilter(...args)) return;
      originalError(...args);
    };
  };

  const restoreLogs = () => {
    console.warn = originalWarn;
    console.error = originalError;
  };

  silenceLogs();

  // 1. Try dynamic import of pdf-parse
  try {
    const pdfParseModule = await import('pdf-parse');
    const mod = pdfParseModule as any;
    const PDFParseClass = mod.PDFParse || mod.default?.PDFParse;
    if (typeof PDFParseClass === 'function') {
      const parser = new PDFParseClass({ data: pdfBuffer });
      if (typeof parser.getText === 'function') {
        const res = await parser.getText();
        if (res?.text && res.text.trim()) {
          restoreLogs();
          return res.text.trim();
        }
      }
    }
    const fn = typeof mod === 'function' ? mod : mod.default;
    if (typeof fn === 'function') {
      const res = await fn(pdfBuffer);
      if (res?.text && res.text.trim()) {
        restoreLogs();
        return res.text.trim();
      }
    }
  } catch (e) {
    // try next strategy
  } finally {
    restoreLogs();
  }

  // 2. Try dynamic require if available
  silenceLogs();
  try {
    const req = typeof require !== 'undefined' ? require : null;
    if (req) {
      const dynamicMod = req('pdf-parse');
      if (typeof dynamicMod === 'function') {
        const res = await dynamicMod(pdfBuffer);
        if (res?.text && res.text.trim()) {
          restoreLogs();
          return res.text.trim();
        }
      } else if (dynamicMod?.PDFParse) {
        const parser = new dynamicMod.PDFParse({ data: pdfBuffer });
        const res = await parser.getText();
        if (res?.text && res.text.trim()) {
          restoreLogs();
          return res.text.trim();
        }
      }
    }
  } catch (e) {
    // try fallback
  } finally {
    restoreLogs();
  }

  // 3. Raw text extraction from PDF streams as last resort
  try {
    const str = pdfBuffer.toString('latin1');
    const textMatches: string[] = [];
    const streamRegex = /BT[\s\S]*?ET/g;
    let match;
    while ((match = streamRegex.exec(str)) !== null) {
      const rawBlock = match[0];
      const tjMatches = rawBlock.match(/\(([^)]+)\)\s*T[jJ]/g);
      if (tjMatches) {
        for (const tj of tjMatches) {
          const content = tj.replace(/^\(/, '').replace(/\)\s*T[jJ]$/, '').replace(/\\/g, '');
          textMatches.push(content);
        }
      }
    }
    if (textMatches.length > 0) {
      return textMatches.join(' ');
    }
  } catch (e) {
    // ignore
  }

  return '';
}

// Extract projects directly from raw resume text if LLM JSON parser missed them or is offline
function extractProjectsFromRawText(rawText: string): any[] {
  const projects: any[] = [];
  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);

  let inProjectsSection = false;
  let currentProject: any = null;

  const projectSectionHeaders = [
    'project', 'projects', 'key projects', 'technical projects', 'academic projects',
    'selected projects', 'featured projects', 'portfolio', 'systems built', 'software projects',
    'key accomplishments', 'notable work'
  ];

  const stopHeaders = [
    'experience', 'work experience', 'education', 'skills', 'certifications', 'achievements',
    'employment', 'summary', 'contact', 'declaration', 'languages'
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineLower = line.toLowerCase().replace(/[:\-_]/g, '').trim();

    if (stopHeaders.some((h) => lineLower === h || lineLower === `${h}s`)) {
      if (inProjectsSection) {
        if (currentProject) projects.push(currentProject);
        currentProject = null;
      }
      inProjectsSection = false;
      continue;
    }

    if (projectSectionHeaders.some((h) => lineLower === h || lineLower.startsWith(h))) {
      inProjectsSection = true;
      continue;
    }

    if (inProjectsSection) {
      const isBullet = line.startsWith('•') || line.startsWith('-') || line.startsWith('*') || /^\d+\./.test(line);
      const cleanLine = line.replace(/^[•\-\*\d+\.]\s*/, '').trim();

      if (!isBullet && cleanLine.length > 2 && cleanLine.length < 75 && !cleanLine.endsWith('.')) {
        if (currentProject) {
          projects.push(currentProject);
        }
        currentProject = {
          id: `proj-${projects.length + 1}`,
          title: cleanLine,
          description: '',
          techStack: [],
          githubUrl: '',
          liveUrl: '',
          category: 'AI & Web',
          highlights: [],
        };
      } else if (currentProject) {
        if (!currentProject.description) {
          currentProject.description = cleanLine;
        }
        currentProject.highlights.push(cleanLine);

        const keywords = ['react', 'python', 'fastapi', 'typescript', 'javascript', 'node', 'express', 'sql', 'postgresql', 'mongodb', 'docker', 'aws', 'gemini', 'openai', 'groq', 'rag', 'llm', 'tailwind', 'c++', 'java', 'html', 'css', 'git'];
        keywords.forEach((kw) => {
          if (cleanLine.toLowerCase().includes(kw)) {
            const formatted = kw === 'fastapi' ? 'FastAPI' : kw === 'react' ? 'React' : kw === 'typescript' ? 'TypeScript' : kw === 'python' ? 'Python' : kw.toUpperCase();
            if (!currentProject.techStack.includes(formatted)) {
              currentProject.techStack.push(formatted);
            }
          }
        });
      }
    }
  }

  if (currentProject) {
    projects.push(currentProject);
  }

  return projects;
}

// Extract skills directly from raw resume text if LLM JSON parser missed them or is offline
function extractSkillsFromRawText(rawText: string) {
  const textLower = rawText.toLowerCase();
  
  const commonLanguages = ['typescript', 'javascript', 'python', 'sql', 'c++', 'c#', 'java', 'go', 'rust', 'html', 'css', 'html5', 'css3'];
  const commonFrameworks = ['react', 'fastapi', 'node.js', 'express', 'next.js', 'tailwind', 'django', 'flask', 'vue', 'angular'];
  const commonAiMl = ['pytorch', 'groq', 'gemini', 'langchain', 'langgraph', 'openai', 'rag', 'llm', 'vector db', 'transformers', 'huggingface'];
  const commonDatabases = ['postgresql', 'mongodb', 'redis', 'sqlite', 'mysql', 'supabase', 'firestore', 'sqlalchemy'];
  const commonTools = ['docker', 'git', 'github', 'linux', 'bash', 'aws', 'gcp', 'vercel', 'postman', 'kubernetes', 'jupyter', 'colab'];

  const foundLanguages = commonLanguages.filter(l => textLower.includes(l)).map(l => l === 'typescript' ? 'TypeScript' : l === 'javascript' ? 'JavaScript' : l === 'python' ? 'Python' : l === 'sql' ? 'SQL' : l === 'c++' ? 'C++' : l.toUpperCase());
  const foundFrameworks = commonFrameworks.filter(f => textLower.includes(f)).map(f => f === 'react' ? 'React' : f === 'fastapi' ? 'FastAPI' : f === 'node.js' ? 'Node.js' : f === 'next.js' ? 'Next.js' : f === 'tailwind' ? 'Tailwind CSS' : f.charAt(0).toUpperCase() + f.slice(1));
  const foundAiMl = commonAiMl.filter(a => textLower.includes(a)).map(a => a === 'groq' ? 'Groq API' : a === 'gemini' ? 'Google Gemini API' : a === 'langgraph' ? 'LangGraph' : a === 'langchain' ? 'LangChain' : a === 'openai' ? 'OpenAI API' : a === 'rag' ? 'RAG Systems' : a.toUpperCase());
  const foundDatabases = commonDatabases.filter(d => textLower.includes(d)).map(d => d === 'postgresql' ? 'PostgreSQL' : d === 'mongodb' ? 'MongoDB' : d === 'redis' ? 'Redis' : d === 'sqlite' ? 'SQLite' : d === 'sqlalchemy' ? 'SQLAlchemy' : d.toUpperCase());
  const foundTools = commonTools.filter(t => textLower.includes(t)).map(t => t === 'git' ? 'Git / GitHub' : t === 'linux' ? 'Linux / Bash' : t === 'aws' ? 'AWS S3' : t.toUpperCase());

  return {
    languages: Array.from(new Set(foundLanguages)),
    frameworks: Array.from(new Set(foundFrameworks)),
    aiMl: Array.from(new Set(foundAiMl)),
    databases: Array.from(new Set(foundDatabases)),
    tools: Array.from(new Set(foundTools)),
  };
}

function cleanBioText(bio: string): string {
  if (!bio) return '';

  let cleaned = bio;

  // 1. Cut off at metadata / social / location / contact / pagination labels
  const cutoffRegex = /(?:github\s*url\s*of|linkedin\s*url\s*of|location\s*of|email\s*of|phone\s*of|contact\s*of|--\s*\d+\s*of\s*\d+\s*--|\bpage\s*\d+\s*of\s*\d+|\b\d+\s*of\s*\d+\b|\bhttps?:\/\/github|\bhttps?:\/\/www\.linkedin)/i;
  const match = cleaned.match(cutoffRegex);
  if (match && match.index !== undefined) {
    cleaned = cleaned.slice(0, match.index);
  }

  // 2. Remove any remaining URLs, emails, or metadata labels
  cleaned = cleaned.replace(/https?:\/\/[^\s]+/gi, '');
  cleaned = cleaned.replace(/(?:github|linkedin|location|email|phone)\s*(?:url)?\s*(?:of\s*[A-Za-z0-9_ ]+)?\s*[:-].*/gi, '');

  // 3. Remove header prefix if present
  cleaned = cleaned.replace(/^(?:professional\s+summary|profile\s+summary|summary|career\s+objective|about\s+me)[:\s\-_]*/i, '');

  // 4. Trim trailing dashes, pipes, colons, or whitespace
  cleaned = cleaned.replace(/[\s\-_:|]+$/g, '').trim();

  // Re-append sentence ending period if appropriate
  if (cleaned && !/[.!?]$/.test(cleaned)) {
    cleaned += '.';
  }

  return cleaned;
}

// Extract summary text under 'Professional Summary' or 'Summary' section headers
function extractSummaryFromRawText(rawText: string): string {
  if (!rawText) return '';
  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);

  const summaryHeaders = [
    'professional summary', 'summary', 'profile summary', 'career summary',
    'career objective', 'about me', 'profile', 'executive summary', 'personal summary'
  ];

  const stopHeaders = [
    'experience', 'work experience', 'projects', 'key projects', 'technical skills',
    'skills', 'education', 'certifications', 'achievements', 'employment', 'academics',
    'github url', 'linkedin url', 'location of'
  ];

  let inSummary = false;
  const summaryLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineLower = line.toLowerCase().replace(/[:\-_]/g, '').trim();

    if (stopHeaders.some((h) => lineLower === h || lineLower === `${h}s` || lineLower.startsWith(h))) {
      if (inSummary) break;
      continue;
    }

    if (summaryHeaders.some((h) => lineLower === h || lineLower.startsWith(h))) {
      inSummary = true;
      continue;
    }

    if (inSummary) {
      if (/(?:github\s*url|linkedin\s*url|location\s*of|--\s*\d+\s*of\s*\d+\s*--)/i.test(line)) {
        break;
      }
      summaryLines.push(line);
      if (summaryLines.join(' ').length > 1500) break;
    }
  }

  return cleanBioText(summaryLines.join(' ').trim());
}

// Extract education items directly from raw document text if LLM JSON parser missed them
function extractEducationFromRawText(rawText: string): any[] {
  if (!rawText) return [];
  const education: any[] = [];
  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);

  let inEducationSection = false;
  let currentEduLines: string[] = [];

  const eduHeaders = [
    'education', 'academic background', 'academics', 'qualification', 'qualifications',
    'academic qualification', 'academic qualifications', 'educational background',
    'education & credentials', 'scholastic achievements', 'academic details'
  ];

  const stopHeaders = [
    'experience', 'work experience', 'projects', 'key projects', 'technical skills', 'skills',
    'certifications', 'achievements', 'employment', 'summary', 'contact', 'declaration', 'languages'
  ];

  const parseEduChunk = (chunkLines: string[], index: number) => {
    if (chunkLines.length === 0) return null;
    const fullChunk = chunkLines.join(' ');
    
    let degree = chunkLines[0];
    let field = 'Computer Science & Engineering';
    
    if (/b\.?tech|bachelor/i.test(fullChunk)) {
      degree = 'Bachelor of Technology (B.Tech)';
    } else if (/m\.?tech|master/i.test(fullChunk)) {
      degree = 'Master of Technology (M.Tech)';
    } else if (/12th|class xii|senior secondary/i.test(fullChunk)) {
      degree = 'Class XII (Senior Secondary)';
      field = 'Science / Stream';
    } else if (/10th|class x|secondary/i.test(fullChunk)) {
      degree = 'Class X (Secondary School)';
      field = 'General Studies';
    }

    if (/computer science|cse|information technology|artificial intelligence|ai\/ml|data science|electrical|mechanical|civil/i.test(fullChunk)) {
      const match = fullChunk.match(/(computer science[\w\s,&]*|information technology|artificial intelligence[\w\s,&]*|data science|software engineering)/i);
      if (match) field = match[0].trim();
    }

    let institution = 'University / Institution';
    const instMatch = fullChunk.match(/(?:at|from|--|-|\|)?\s*([A-Za-z0-9\s,&'.]+(?:University|College|Institute|School|Academy|Board|IIT|NIT|IIIT)[\w\s,&'.]*)/i);
    if (instMatch && instMatch[1]) {
      institution = instMatch[1].trim();
    } else if (chunkLines.length > 1) {
      institution = chunkLines[1];
    }

    let duration = '2021 – 2025';
    const yearMatch = fullChunk.match(/(?:20\d{2}|19\d{2})\s*[-–—\s\to]+\s*(?:20\d{2}|19\d{2}|Present|Current)/i) || fullChunk.match(/20\d{2}/);
    if (yearMatch) {
      duration = yearMatch[0];
    }

    let cgpa = 'N/A';
    const scoreMatch = fullChunk.match(/(?:cgpa|gpa|percentage|score|marks|grade)[:\s]*([0-9.]+(?:\s*\/\s*[0-9.]+|%|\b))/i) || fullChunk.match(/\b([0-9]\.[0-9]{1,2}\s*\/\s*10(?:\.0)?|\b[0-9]{2}\.[0-9]%|\b[0-9]{2}%)/i);
    if (scoreMatch) {
      cgpa = scoreMatch[1] || scoreMatch[0];
    }

    return {
      id: `edu-${index}`,
      degree,
      institution,
      field,
      duration,
      cgpa,
      scoreLabel: 'CGPA / Score',
      highlights: chunkLines.slice(1).filter((l) => !l.toLowerCase().includes('education')),
    };
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineLower = line.toLowerCase().replace(/[:\-_]/g, '').trim();

    if (stopHeaders.some((h) => lineLower === h || lineLower === `${h}s`)) {
      if (inEducationSection && currentEduLines.length > 0) {
        const item = parseEduChunk(currentEduLines, education.length + 1);
        if (item) education.push(item);
        currentEduLines = [];
      }
      inEducationSection = false;
      continue;
    }

    if (eduHeaders.some((h) => lineLower === h || lineLower.startsWith(h))) {
      inEducationSection = true;
      continue;
    }

    if (inEducationSection) {
      const isNewEntry = /b\.?tech|bachelor|m\.?tech|master|b\.?sc|b\.?e|12th|10th|class xii|class x|high school|diploma|phd|degree/i.test(line);
      if (isNewEntry && currentEduLines.length > 0) {
        const item = parseEduChunk(currentEduLines, education.length + 1);
        if (item) education.push(item);
        currentEduLines = [line];
      } else {
        currentEduLines.push(line);
      }
    }
  }

  if (inEducationSection && currentEduLines.length > 0) {
    const item = parseEduChunk(currentEduLines, education.length + 1);
    if (item) education.push(item);
  }

  return education;
}

function ensureAbsoluteUrl(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return `https://${trimmed.replace(/^\/+/, '')}`;
}

function extractSocialUrls(text: string) {
  let github = '';
  let linkedin = '';

  if (!text) return { github, linkedin };

  // 1. Direct regex matching for github.com
  const ghMatch = text.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_\-\.]+/i);
  if (ghMatch) {
    github = ensureAbsoluteUrl(ghMatch[0].trim().replace(/[\.,;:]$/, ''));
  }

  // Fallback for GitHub handle/username
  if (!github) {
    const ghUserMatch = text.match(/github(?:\s*repo|\s*profile|\s*handle)?\s*[:\-–—]?\s*@?([a-zA-Z0-9_\-]+)/i);
    if (ghUserMatch && ghUserMatch[1] && !ghUserMatch[1].toLowerCase().includes('http')) {
      github = `https://github.com/${ghUserMatch[1]}`;
    }
  }

  // 2. Direct regex matching for linkedin.com
  const liMatch = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_\-\.]+/i);
  if (liMatch) {
    linkedin = ensureAbsoluteUrl(liMatch[0].trim().replace(/[\.,;:]$/, ''));
  }

  // Fallback for LinkedIn handle/username
  if (!linkedin) {
    const liUserMatch = text.match(/linkedin(?:\s*profile|\s*handle)?\s*[:\-–—]?\s*@?(?:in\/)?([a-zA-Z0-9_\-]+)/i);
    if (liUserMatch && liUserMatch[1] && !liUserMatch[1].toLowerCase().includes('http')) {
      linkedin = `https://www.linkedin.com/in/${liUserMatch[1]}`;
    }
  }

  return { github, linkedin };
}

// Fallback basic resume text parser if AI is not configured
function fallbackParseResumeText(rawText: string, fileName: string) {
  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
  
  let name = fileName.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ').trim();
  if (lines.length > 0 && lines[0].length < 40 && !lines[0].includes('@') && !lines[0].toLowerCase().includes('resume')) {
    name = lines[0];
  }

  const emailMatch = rawText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = rawText.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  const { github: extractedGithub, linkedin: extractedLinkedin } = extractSocialUrls(rawText);

  const parsedProjects = extractProjectsFromRawText(rawText);
  const parsedSkills = extractSkillsFromRawText(rawText);
  const parsedEducation = extractEducationFromRawText(rawText);
  const parsedSummary = extractSummaryFromRawText(rawText);

  return {
    name: name || 'Candidate',
    title: lines[1] || 'Professional Profile',
    email: emailMatch ? emailMatch[0] : '',
    phone: phoneMatch ? phoneMatch[0] : '',
    github: extractedGithub || 'https://github.com/SAHIL-SINGH2',
    linkedin: extractedLinkedin || 'https://www.linkedin.com/in/sahil-singh2/',
    bio: parsedSummary || rawText.slice(0, 800),
    skills: parsedSkills,
    experiences: [],
    projects: parsedProjects.length > 0 ? parsedProjects : sahilProfile.projects,
    education: parsedEducation,
    achievements: [],
  };
}

// Scan directories for any candidate PDF files (Resumes and Personal Details/Information)
function findCandidatePdfFiles() {
  const directoriesToSearch = [
    process.cwd(),
    path.join(process.cwd(), 'backend'),
    path.join(process.cwd(), 'frontend', 'public'),
  ];

  const resumePdfs: { path: string; name: string; mtimeMs: number }[] = [];
  const personalDetailPdfs: { path: string; name: string; mtimeMs: number }[] = [];
  const uncategorizedPdfs: { path: string; name: string; mtimeMs: number }[] = [];

  for (const dir of directoriesToSearch) {
    if (!fs.existsSync(dir)) continue;
    try {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        if (!file.toLowerCase().endsWith('.pdf')) continue;
        const fullPath = path.join(dir, file);
        try {
          const stat = fs.statSync(fullPath);
          const fLower = file.toLowerCase();

          if (fLower.includes('resume') || fLower.includes('cv')) {
            resumePdfs.push({ path: fullPath, name: file, mtimeMs: stat.mtimeMs });
          } else if (
            fLower.includes('personal') ||
            fLower.includes('detail') ||
            fLower.includes('details') ||
            fLower.includes('information') ||
            fLower.includes('info') ||
            fLower.includes('bio') ||
            fLower.includes('profile')
          ) {
            personalDetailPdfs.push({ path: fullPath, name: file, mtimeMs: stat.mtimeMs });
          } else {
            uncategorizedPdfs.push({ path: fullPath, name: file, mtimeMs: stat.mtimeMs });
          }
        } catch (e) {
          // ignore stat errors
        }
      }
    } catch (e) {
      // ignore readdir errors
    }
  }

  resumePdfs.sort((a, b) => b.mtimeMs - a.mtimeMs);
  personalDetailPdfs.sort((a, b) => b.mtimeMs - a.mtimeMs);
  uncategorizedPdfs.sort((a, b) => b.mtimeMs - a.mtimeMs);

  // If no explicit "resume" PDF was matched, but there are uncategorized PDFs, use the latest as resume
  if (resumePdfs.length === 0 && uncategorizedPdfs.length > 0) {
    resumePdfs.push(uncategorizedPdfs[0]);
  }

  return { resumePdfs, personalDetailPdfs };
}

// Check and parse resume and personal details PDFs if present
async function callGroqForResumeParse(parsePrompt: string, combinedText: string): Promise<any | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === 'your_groq_api_key_here') {
    return null;
  }

  const configuredModel = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
  const modelsToTry = [configuredModel, 'llama-3.3-70b-versatile', 'openai/gpt-oss-120b', 'llama-3.1-8b-instant', 'gemma2-9b-it', 'mixtral-8x7b-32768'];
  const uniqueModels = Array.from(new Set(modelsToTry));

  const truncatedText = combinedText.slice(0, 15000);

  for (const model of uniqueModels) {
    try {
      console.log(`🤖 Parsing candidate resume using Groq API model (${model})...`);
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content: 'You are an expert resume parser. Output ONLY valid JSON matching the exact requested JSON structure based on facts in the candidate resume text. Do not invent or hallucinate facts.',
            },
            {
              role: 'user',
              content: `${parsePrompt}\n\nCandidate Document Text:\n${truncatedText}`,
            },
          ],
          temperature: 0.1,
        }),
      });

      if (res.ok) {
        const data: any = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          try {
            const cleaned = content.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '').trim();
            const json = JSON.parse(cleaned);
            if (json && (json.name || json.skills || json.projects || json.education || json.experiences)) {
              console.log(`✅ Groq API successfully parsed candidate resume with model ${model}! Candidate Name: ${json.name || 'Parsed'}`);
              return json;
            }
          } catch (jsonErr) {
            console.warn(`Groq JSON parse exception with model ${model}:`, jsonErr);
          }
        }
      } else {
        const errText = await res.text();
        console.warn(`Groq API resume parse model ${model} error response:`, errText);
      }
    } catch (err) {
      console.warn(`Groq API resume parse error with model ${model}:`, err);
    }
  }

  return null;
}

// Check and parse resume and personal details PDFs if present
async function updateProfileFromResumePdfIfNeeded(): Promise<any> {
  const { resumePdfs, personalDetailPdfs } = findCandidatePdfFiles();

  if (resumePdfs.length === 0 && personalDetailPdfs.length === 0) {
    return activeCandidateProfile;
  }

  const currentSignature = [...resumePdfs, ...personalDetailPdfs]
    .map((p) => `${p.path}:${p.mtimeMs}`)
    .join('|');

  if (currentSignature === lastParsedPdfSignature) {
    return activeCandidateProfile;
  }

  lastParsedPdfSignature = currentSignature;

  let resumePdfBuffer: Buffer | null = null;
  let personalDetailsBuffer: Buffer | null = null;
  let extractedPersonalDetailsText = '';
  let resumeRawText = '';

  // Extract text from Personal Details / Information PDFs
  for (const pFile of personalDetailPdfs) {
    try {
      console.log(`📄 Found personal details PDF at ${pFile.path}. Reading...`);
      const buffer = fs.readFileSync(pFile.path);
      personalDetailsBuffer = buffer;
      const parsedText = await extractTextFromPdfBuffer(buffer);
      if (parsedText.trim()) {
        extractedPersonalDetailsText += `\n--- Document: ${pFile.name} ---\n${parsedText.trim()}\n`;
      }
    } catch (e) {
      console.warn(`Could not read personal detail PDF ${pFile.path}:`, e);
    }
  }

  // Extract text from Resume PDF if present
  if (resumePdfs.length > 0) {
    const targetPdfPath = resumePdfs[0].path;
    try {
      console.log(`📄 Found local resume PDF at ${targetPdfPath}. Reading...`);
      resumePdfBuffer = fs.readFileSync(targetPdfPath);
      resumeRawText = await extractTextFromPdfBuffer(resumePdfBuffer);
    } catch (e) {
      console.warn(`Could not read resume PDF ${resumePdfs[0].path}:`, e);
    }
  }

  // Combine text from all available PDF documents
  const combinedRawText = [resumeRawText, extractedPersonalDetailsText].filter(Boolean).join('\n\n--- Extra Information / Personal Details ---\n\n');

  try {
    const socialExtracted = extractSocialUrls(combinedRawText);
    let parsedProfile: any = null;

    const parsePrompt = `You are an expert resume parser. Parse the provided candidate document(s) into a structured JSON profile:

CRITICAL ACCURACY INSTRUCTIONS:
1. Parse ONLY facts explicitly written in the provided candidate document(s). Do NOT hallucinate or inject outside/unrelated projects, skills, degrees, or experience.
2. "bio": Extract ONLY the Professional Summary / Profile Summary paragraph. Do NOT include URLs, location, phone, email, or page numbers in "bio".
3. "education": MUST extract ALL Education entries (Degree, Institution, Field, Duration, CGPA/Score).
4. "skills": Extract ONLY technical skills, programming languages, frameworks, databases, and tools written in the document.
5. "projects": Extract ALL projects written in the candidate's resume/document with their exact titles, tech stack, and descriptions.
6. "experiences": Extract ALL work experience / internships written in the document.

Return strictly JSON matching this structure:
{
  "name": "Candidate Full Name",
  "title": "Candidate Professional Title",
  "location": "City, Country (or 'Not specified')",
  "email": "email",
  "phone": "phone",
  "github": "https://github.com/...",
  "linkedin": "https://linkedin.com/in/...",
  "portfolio": "https://...",
  "totalExperienceYears": "Years or 'Not specified'",
  "bio": "Clean Professional Summary paragraph without URLs or contact details",
  "skills": {
    "languages": ["..."],
    "frameworks": ["..."],
    "aiMl": ["..."],
    "databases": ["..."],
    "tools": ["..."]
  },
  "experiences": [
    {
      "id": "exp-1",
      "company": "Company Name",
      "role": "Role Title",
      "duration": "Dates",
      "location": "Location",
      "type": "Full-Time / Internship",
      "description": "Responsibilities and accomplishments",
      "skillsUsed": ["..."]
    }
  ],
  "projects": [
    {
      "id": "proj-1",
      "title": "Project Name",
      "description": "Project summary",
      "techStack": ["..."],
      "githubUrl": "https://github.com/...",
      "liveUrl": "https://...",
      "category": "AI / Full-Stack / Web",
      "highlights": ["..."]
    }
  ],
  "education": [
    {
      "id": "edu-1",
      "institution": "University/College/School",
      "degree": "Degree/Qualification",
      "field": "Field of Study",
      "duration": "Years",
      "cgpa": "GPA, Marks, or Score",
      "scoreLabel": "CGPA",
      "highlights": ["..."]
    }
  ],
  "achievements": ["..."]
}`;

    // 1. Primary Method: Try Groq API directly for resume parsing
    if (combinedRawText && process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'your_groq_api_key_here') {
      parsedProfile = await callGroqForResumeParse(parsePrompt, combinedRawText);
    }

    // 2. Secondary Method: Fallback to Gemini AI if Groq was not configured or returned invalid output
    if (!parsedProfile || !parsedProfile.name) {
      const ai = getGeminiClient();
      if (ai) {
        const contentsParts: any[] = [];

        // Pass PDF binary directly to Gemini as multimodal inlineData parts
        if (resumePdfBuffer) {
          contentsParts.push({
            inlineData: {
              mimeType: 'application/pdf',
              data: resumePdfBuffer.toString('base64'),
            },
          });
        }

        if (personalDetailsBuffer) {
          contentsParts.push({
            inlineData: {
              mimeType: 'application/pdf',
              data: personalDetailsBuffer.toString('base64'),
            },
          });
        }

        if (combinedRawText && combinedRawText.trim()) {
          contentsParts.push({
            text: `Raw Extracted Document Text:\n${combinedRawText.slice(0, 12000)}`,
          });
        }

        contentsParts.push({ text: parsePrompt });

        try {
          const geminiRes = await ai.models.generateContent({
            model: 'gemini-3.6-flash',
            contents: [{ role: 'user', parts: contentsParts }],
            config: { responseMimeType: 'application/json' },
          });

          if (geminiRes.text) {
            parsedProfile = JSON.parse(geminiRes.text);
          }
        } catch (aiErr) {
          console.warn('Gemini AI multimodal resume parsing failed:', aiErr);
        }
      }
    }

    if (!parsedProfile || !parsedProfile.name) {
      parsedProfile = fallbackParseResumeText(combinedRawText, resumePdfs[0]?.name || personalDetailPdfs[0]?.name || 'candidate');
    }

    // Extract professional summary
    const extractedSummaryText = extractSummaryFromRawText(combinedRawText);
    const rawBioCandidate = (parsedProfile.bio && parsedProfile.bio.length > 25 && !parsedProfile.bio.toLowerCase().includes('detailed summary paragraph'))
      ? parsedProfile.bio
      : (extractedSummaryText || '');
    const resolvedBio = cleanBioText(rawBioCandidate);

    // Normalize and sanitize projects list from LLM output
    let rawProjects = parsedProfile.projects || [];
    if (typeof rawProjects === 'string') {
      rawProjects = [{ id: 'proj-1', title: 'Resume Project', description: rawProjects, category: 'Full-Stack', techStack: [], highlights: [rawProjects] }];
    }

    let sanitizedProjects = (Array.isArray(rawProjects) ? rawProjects : []).map((proj: any, idx: number) => {
      if (typeof proj === 'string') {
        return {
          id: `proj-${idx + 1}`,
          title: `Project ${idx + 1}`,
          description: proj,
          techStack: ['Software Engineering'],
          githubUrl: '',
          liveUrl: '',
          category: 'AI & Full-Stack',
          highlights: [proj],
        };
      }
      return {
        id: proj.id || `proj-${idx + 1}`,
        title: proj.title || proj.name || `Project ${idx + 1}`,
        description: proj.description || proj.summary || 'Project built by candidate.',
        techStack: Array.isArray(proj.techStack) && proj.techStack.length > 0 ? proj.techStack : (Array.isArray(proj.tech_stack) ? proj.tech_stack : ['Full-Stack', 'Software Development']),
        githubUrl: ensureAbsoluteUrl(proj.githubUrl || proj.github_url || proj.github || ''),
        liveUrl: ensureAbsoluteUrl(proj.liveUrl || proj.live_url || ''),
        category: proj.category || 'AI & Full-Stack',
        highlights: Array.isArray(proj.highlights) && proj.highlights.length > 0 ? proj.highlights : [proj.description || 'Key technical accomplishment.'],
      };
    });

    // Fallback 1: Extract projects directly from combinedRawText if LLM returned 0 projects
    if (sanitizedProjects.length === 0 && combinedRawText) {
      const rawExtracted = extractProjectsFromRawText(combinedRawText);
      if (rawExtracted.length > 0) {
        sanitizedProjects = rawExtracted;
      }
    }

    // Resolve education
    let resolvedEducation: any[] = Array.isArray(parsedProfile.education) ? parsedProfile.education : [];
    if (resolvedEducation.length === 0 && combinedRawText) {
      resolvedEducation = extractEducationFromRawText(combinedRawText);
    }

    // Sanitize education list
    resolvedEducation = resolvedEducation.map((edu: any, idx: number) => {
      if (typeof edu === 'string') {
        return {
          id: `edu-${idx + 1}`,
          degree: edu,
          institution: 'University / Institution',
          field: 'Computer Science',
          duration: '',
          cgpa: 'N/A',
          scoreLabel: 'CGPA',
          highlights: [edu],
        };
      }
      return {
        id: edu.id || `edu-${idx + 1}`,
        degree: edu.degree || edu.name || edu.qualification || 'Degree',
        institution: edu.institution || edu.university || edu.college || edu.school || 'University',
        field: edu.field || edu.major || edu.stream || '',
        duration: edu.duration || edu.years || edu.year || '',
        cgpa: edu.cgpa || edu.gpa || edu.score || edu.percentage || 'N/A',
        scoreLabel: edu.scoreLabel || 'CGPA',
        highlights: Array.isArray(edu.highlights) && edu.highlights.length > 0 ? edu.highlights : [edu.degree || 'Academic Qualification'],
      };
    });

    // Use parsed values
    const rawLoc = parsedProfile.location || '';
    const resolvedLocation = rawLoc && !rawLoc.includes('City, Country') && !rawLoc.toLowerCase().includes('not specified') ? rawLoc : (sahilProfile.location || 'Location Not Specified');
    
    const parsedGh = parsedProfile.github || '';
    let resolvedGithub = '';
    if (parsedGh && parsedGh.includes('github.com') && !parsedGh.includes('github.com/...')) {
      resolvedGithub = ensureAbsoluteUrl(parsedGh);
    } else if (socialExtracted.github) {
      resolvedGithub = socialExtracted.github;
    } else {
      resolvedGithub = sahilProfile.github;
    }

    const parsedLi = parsedProfile.linkedin || '';
    let resolvedLinkedin = '';
    if (parsedLi && parsedLi.includes('linkedin.com') && !parsedLi.includes('linkedin.com/in/...')) {
      resolvedLinkedin = ensureAbsoluteUrl(parsedLi);
    } else if (socialExtracted.linkedin) {
      resolvedLinkedin = socialExtracted.linkedin;
    } else {
      resolvedLinkedin = sahilProfile.linkedin;
    }

    const resolvedEmail = parsedProfile.email && parsedProfile.email.includes('@') ? parsedProfile.email : sahilProfile.email;
    const resolvedPhone = parsedProfile.phone && parsedProfile.phone.length > 6 ? parsedProfile.phone : sahilProfile.phone;

    activeCandidateProfile = {
      name: parsedProfile.name && parsedProfile.name !== 'Candidate' ? parsedProfile.name : sahilProfile.name,
      title: parsedProfile.title || sahilProfile.title,
      location: resolvedLocation,
      email: resolvedEmail,
      phone: resolvedPhone,
      github: resolvedGithub,
      linkedin: resolvedLinkedin,
      portfolio: ensureAbsoluteUrl(parsedProfile.portfolio || sahilProfile.portfolio),
      avatarUrl: sahilProfile.avatarUrl,
      totalExperienceYears: parsedProfile.totalExperienceYears !== undefined ? parsedProfile.totalExperienceYears : sahilProfile.totalExperienceYears,
      bio: resolvedBio || sahilProfile.bio,
      resumeRawText: combinedRawText || 'Resume PDF parsed by multimodal Gemini AI.',
      skills: (() => {
        const rawSk = parsedProfile.skills || {};
        const lang = Array.isArray(rawSk.languages) ? rawSk.languages : [];
        const fram = Array.isArray(rawSk.frameworks) ? rawSk.frameworks : [];
        const aiml = Array.isArray(rawSk.aiMl) ? rawSk.aiMl : (Array.isArray(rawSk.ai_ml) ? rawSk.ai_ml : []);
        const db = Array.isArray(rawSk.databases) ? rawSk.databases : [];
        const tools = Array.isArray(rawSk.tools) ? rawSk.tools : [];
        
        const totalCount = lang.length + fram.length + aiml.length + db.length + tools.length;
        if (totalCount === 0 && combinedRawText) {
          return extractSkillsFromRawText(combinedRawText);
        }
        return {
          languages: lang,
          frameworks: fram,
          aiMl: aiml,
          databases: db,
          tools: tools,
        };
      })(),
      experiences: Array.isArray(parsedProfile.experiences) ? parsedProfile.experiences : [],
      projects: sanitizedProjects.length > 0 ? sanitizedProjects : sahilProfile.projects,
      education: resolvedEducation,
      achievements: Array.isArray(parsedProfile.achievements) ? parsedProfile.achievements : [],
      personalDetails: extractedPersonalDetailsText || activeCandidateProfile.personalDetails,
    };
    console.log(`✅ Successfully loaded candidate profile for ${activeCandidateProfile.name}!`);
  } catch (err) {
    console.warn('Error reading or parsing candidate PDF documents:', err);
  }

  if (extractedPersonalDetailsText) {
    activeCandidateProfile.personalDetails = extractedPersonalDetailsText;
  }

  return activeCandidateProfile;
}

// Build dynamic system prompt based on active profile
function getSystemPrompt(profile: any): string {
  return `
You are an AI assistant representing job candidate ${profile.name}.
Below is everything you know about ${profile.name} from their uploaded resume and personal details documents:

Name: ${profile.name}
Title: ${profile.title}
Location: ${profile.location}
Email: ${profile.email}
Phone: ${profile.phone}
Total Experience: ${profile.totalExperienceYears}
Bio: ${profile.bio}

${profile.resumeRawText ? `FULL RAW TEXT FROM RESUME PDF:\n${profile.resumeRawText}\n` : ''}
${profile.personalDetails ? `PERSONAL DETAILS & ADDITIONAL CANDIDATE DOCUMENTS:\n${profile.personalDetails}\n` : ''}

Skills:
- Languages: ${(profile.skills?.languages || []).join(', ')}
- Frameworks & Web: ${(profile.skills?.frameworks || []).join(', ')}
- AI/ML & LLM: ${(profile.skills?.aiMl || []).join(', ')}
- Databases: ${(profile.skills?.databases || []).join(', ')}
- Developer Tools: ${(profile.skills?.tools || []).join(', ')}

Work Experience:
${(profile.experiences || []).length > 0 ? (profile.experiences || []).map((e: any) => `- ${e.role} at ${e.company} (${e.duration}, ${e.type}): ${e.description} Key Skills: ${(e.skillsUsed || []).join(', ')}`).join('\n') : 'None explicitly listed in resume'}

Key Projects:
${(profile.projects || []).length > 0 ? (profile.projects || []).map((p: any) => `- ${p.title} (${p.category}): ${p.description} Tech Stack: ${(p.techStack || []).join(', ')}. Highlights: ${(p.highlights || []).join('; ')}`).join('\n') : 'None explicitly listed in resume'}

Education:
${(profile.education || []).length > 0 ? (profile.education || []).map((ed: any) => `- ${ed.degree} in ${ed.field} at ${ed.institution} (${ed.duration}). Score: ${ed.cgpa}. ${(ed.highlights || []).join('; ')}`).join('\n') : 'None explicitly listed in resume'}

Key Achievements:
${(profile.achievements || []).length > 0 ? (profile.achievements || []).map((a: any) => `- ${a}`).join('\n') : 'None explicitly listed in resume'}

Rules:
1. Answer questions about ${profile.name} using ONLY facts present in the raw resume text or personal details documents above.
2. CRITICAL: NEVER invent, hallucinate, or assume location (e.g. San Francisco, Remote, CA), years of experience, degrees, or companies if they are NOT written in the candidate's documents above.
3. If a detail (such as location, degree, or experience) is NOT present in any document, explicitly state: "This detail is not mentioned in the provided documents."
4. If anyone asks to update, modify, or replace ${profile.name}'s resume or documents, you MUST refuse and state: "I can't update the resume, I don't have this much permission."
5. Be professional, friendly, enthusiastic, clear, and direct.
6. FORMATTING: NEVER output raw HTML tags such as <br>, <br/>, <div>, or <span> in your response. Use clean standard Markdown bullet points (- or *) and double newlines for paragraph breaks instead of tables with <br> tags.
`;
}

function cleanLlmResponse(text: string): string {
  if (!text) return '';
  let cleaned = text;
  cleaned = cleaned.replace(/<br\s*\/?>/gi, '\n');
  cleaned = cleaned.replace(/<\/br>/gi, '');
  return cleaned;
}

// Helper: fallback response generator if Gemini/Groq keys are missing or offline
function generateFallbackAnswer(question: string, profile?: any): string {
  const q = question.toLowerCase();

  if (q.includes('update resume') || q.includes('new resume') || q.includes('replace resume') || q.includes('change resume') || q.includes('modify resume') || q.includes('upload new resume') || (q.includes('resume') && (q.includes('update') || q.includes('new') || q.includes('change') || q.includes('replace')))) {
    return `I can't update the resume, I don't have this much permission.`;
  }

  const name = profile?.name || 'Sahil Singh';
  const bio = profile?.bio || 'AI & Full-Stack Engineer';

  if (q.includes('tell me about') || q.includes('who are you') || q.includes('summary') || q.includes('bio') || q.includes('intro')) {
    return `Hello! I am ${name}'s AI representative.\n\n**${name}** - ${profile?.title || 'AI & Full-Stack Engineer'}\n\n${bio}\n\nHow can I help you learn more about ${name}'s experience, background, or job match?`;
  }

  if (q.includes('project') || q.includes('build') || q.includes('portfolio') || q.includes('work')) {
    if (profile?.projects?.length > 0) {
      const list = profile.projects.map((p: any, i: number) => `${i + 1}. **${p.title}**: ${p.description}`).join('\n\n');
      return `${name}'s Key Projects:\n\n${list}`;
    }
    return `${name} has built multiple impressive AI & full-stack projects including live LLM streaming web apps, RAG document intelligence microservices, and interactive web workspaces.`;
  }

  if (q.includes('skill') || q.includes('technology') || q.includes('tech stack') || q.includes('know') || q.includes('language')) {
    if (profile?.skills) {
      const langs = (profile.skills.languages || []).join(', ');
      const fw = (profile.skills.frameworks || []).join(', ');
      const ai = (profile.skills.aiMl || []).join(', ');
      return `Here is a summary of ${name}'s technical skills:\n\n- **Languages**: ${langs || 'Python, TypeScript, JavaScript, SQL'}\n- **Frameworks**: ${fw || 'FastAPI, React 19, Node.js, Express, Tailwind CSS'}\n- **AI/ML**: ${ai || 'PyTorch, Groq API, Gemini API, RAG, Vector DBs'}`;
    }
  }

  return `Thank you for asking! ${name} is a skilled professional with experience in AI and full-stack software development.\n\n- **Name**: ${name}\n- **Title**: ${profile?.title || 'Engineer'}\n- **Contact**: ${profile?.email || 'Available on request'}\n\nFeel free to ask specific questions about ${name}'s background, skills, or projects!`;
}

// Helper to call Groq API directly using GROQ_API_KEY with model fallback
async function callGroqApi(question: string): Promise<string | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === 'your_groq_api_key_here') {
    return null;
  }
  
  const configuredModel = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
  const modelsToTry = [configuredModel, 'openai/gpt-oss-120b', 'llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'gemma2-9b-it'];
  const uniqueModels = Array.from(new Set(modelsToTry));

  const profile = await updateProfileFromResumePdfIfNeeded();
  const systemPrompt = getSystemPrompt(profile);

  for (const model of uniqueModels) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: question },
          ],
        }),
      });
      if (res.ok) {
        const data: any = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) return cleanLlmResponse(content);
      } else {
        const errText = await res.text();
        console.warn(`Groq API model ${model} error:`, errText);
      }
    } catch (err) {
      console.warn(`Groq API fetch exception with model ${model}:`, err);
    }
  }

  return null;
}

// ------------------- API ENDPOINTS -------------------

// 1. Health & Status
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    groqConfigured: !!process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'your_groq_api_key_here',
    groqModel: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
    geminiConfigured: !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY',
    fastapiConfigured: !!process.env.FASTAPI_URL,
    fastapiUrl: process.env.FASTAPI_URL || null,
  });
});

// 2. Candidate Info
app.get('/api/candidate-info', async (req: Request, res: Response) => {
  const profile = await updateProfileFromResumePdfIfNeeded();
  res.json(profile);
});

// 3. Chat Endpoint (Compatible with uploaded FastAPI POST /chat body {"question": "..."})
app.post(['/chat', '/api/chat'], async (req: Request, res: Response) => {
  const { question, stream, fastApiUrl } = req.body;

  if (!question || typeof question !== 'string') {
    res.status(400).json({ error: 'Question parameter is required.' });
    return;
  }

  const profile = await updateProfileFromResumePdfIfNeeded();
  const currentSystemPrompt = getSystemPrompt(profile);

  // Refuse updating resume rule
  const qLower = question.toLowerCase();
  if (
    qLower.includes('update resume') ||
    qLower.includes('new resume') ||
    qLower.includes('replace resume') ||
    qLower.includes('change resume') ||
    qLower.includes('modify resume') ||
    qLower.includes('upload new resume') ||
    (qLower.includes('resume') &&
      (qLower.includes('update') || qLower.includes('new') || qLower.includes('change') || qLower.includes('replace')))
  ) {
    const refusal = "I can't update the resume, I don't have this much permission.";
    if (stream !== false) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.write(`data: ${JSON.stringify({ chunk: refusal, done: true })}\n\n`);
      res.end();
      return;
    }
    res.json({ answer: refusal });
    return;
  }

  // Check if custom FastAPI URL is passed or set in environment
  const targetFastApi = fastApiUrl || process.env.FASTAPI_URL;
  if (targetFastApi) {
    try {
      const targetUrl = targetFastApi.replace(/\/$/, '') + '/chat';
      const proxyRes = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });

      if (proxyRes.ok) {
        const data: any = await proxyRes.json();
        const fastApiAnswer = data.answer || data.message;
        if (fastApiAnswer) {
          if (stream !== false) {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            const chunks = fastApiAnswer.split(' ');
            for (let i = 0; i < chunks.length; i++) {
              const chunk = (i === 0 ? '' : ' ') + chunks[i];
              res.write(`data: ${JSON.stringify({ chunk, done: false })}\n\n`);
              await new Promise((r) => setTimeout(r, 15));
            }
            res.write(`data: ${JSON.stringify({ chunk: '', done: true })}\n\n`);
            res.end();
            return;
          }
          res.json({ answer: fastApiAnswer });
          return;
        }
      }
    } catch (err) {
      console.log('⚡ Local Python FastAPI server on port 8000 is offline. Proceeding seamlessly with Node Groq/Gemini LLM engine.');
    }
  }

  let answer = '';

  // 1. First Priority: Try Groq API directly
  const groqAnswer = await callGroqApi(question);
  if (groqAnswer) {
    answer = groqAnswer;
  } else {
    // 2. Second Priority: Try Gemini API
    const ai = getGeminiClient();
    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: [{ role: 'user', parts: [{ text: `${currentSystemPrompt}\n\nUser Question: ${question}` }] }],
        });
        answer = response.text || generateFallbackAnswer(question);
      } catch (error: any) {
        console.warn('Gemini API call failed, using intelligent candidate fallback:', error?.message || error);
        answer = generateFallbackAnswer(question);
      }
    } else {
      // 3. Fallback: Intelligent candidate response rules
      answer = generateFallbackAnswer(question);
    }
  }

  answer = cleanLlmResponse(answer);


  if (stream !== false) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const chunks = answer.split(' ');
    for (let i = 0; i < chunks.length; i++) {
      const chunk = (i === 0 ? '' : ' ') + chunks[i];
      res.write(`data: ${JSON.stringify({ chunk, done: false })}\n\n`);
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    res.write(`data: ${JSON.stringify({ chunk: '', done: true })}\n\n`);
    res.end();
    return;
  }

  res.json({ answer });
});

// 4. Job Match Analysis Endpoint (Supports text Job Description)
app.post('/api/job-match', async (req: Request, res: Response) => {
  const { jobDescription } = req.body;

  if (!jobDescription || typeof jobDescription !== 'string') {
    res.status(400).json({ error: 'Job description text is required.' });
    return;
  }

  const activeProfile = await updateProfileFromResumePdfIfNeeded();
  const jdLower = jobDescription.toLowerCase();

  // Dynamic skill matching algorithm against active candidate profile
  const candidateSkillsList = [
    ...(activeProfile.skills?.languages || []),
    ...(activeProfile.skills?.frameworks || []),
    ...(activeProfile.skills?.aiMl || []),
    ...(activeProfile.skills?.databases || []),
    ...(activeProfile.skills?.tools || []),
  ];

  const matchedSkills = candidateSkillsList.filter((s) => jdLower.includes(s.toLowerCase()));

  // Comprehensive industry technical keywords to evaluate gap
  const checkKeywords = [
    'python', 'react', 'fastapi', 'typescript', 'docker', 'postgresql',
    'rag', 'langchain', 'aws', 'kubernetes', 'graphql', 'go', 'java', 'ci/cd',
    'mongodb', 'tailwind', 'javascript', 'pytorch', 'openai', 'llm', 'redis', 'linux'
  ];

  const missingSkills = checkKeywords.filter(
    (kw) => jdLower.includes(kw) && !matchedSkills.some((m) => m.toLowerCase().includes(kw))
  );

  // Calculate dynamic score based on keyword overlap ratio
  const jdWordCount = jdLower.split(/\s+/).length;
  const matchRatio = candidateSkillsList.length > 0 ? (matchedSkills.length / Math.min(10, Math.max(3, candidateSkillsList.length))) : 0.7;
  
  let dynamicScore = Math.round(50 + matchRatio * 42);
  if (matchedSkills.length >= 6) dynamicScore += 8;
  if (missingSkills.length >= 4) dynamicScore -= 12;
  if (jdLower.includes('senior') || jdLower.includes('lead')) dynamicScore -= 5;
  dynamicScore = Math.min(97, Math.max(52, dynamicScore));

  const ai = getGeminiClient();
  if (ai) {
    try {
      const promptText = `Analyze this job description for candidate ${activeProfile.name || sahilProfile.name}:
      
      Candidate Profile:
      - Name: ${activeProfile.name || sahilProfile.name}
      - Title: ${activeProfile.title || sahilProfile.title}
      - Skills: ${candidateSkillsList.join(', ')}
      - Experience: ${(activeProfile.experiences || sahilProfile.experiences).map((e: any) => e.role + ' at ' + e.company + ': ' + e.description).join('; ')}
      - Projects: ${(activeProfile.projects || sahilProfile.projects).map((p: any) => p.title + ': ' + p.description).join('; ')}

      Job Description Text:
      ${jobDescription.slice(0, 4000)}

      Evaluate candidate compatibility and return a JSON object with strictly these keys:
      - matchScore (number 0 to 100)
      - summary (string overview of fit)
      - strengths (array of 3-5 strings highlighting candidate alignment)
      - missingSkills (array of strings of skills in JD not explicit in candidate profile)
      - keyMatchingSkills (array of matching candidate skill tags)
      - recommendation (string e.g. "Highly Recommended for Technical Interview")
      `;

      const geminiRes = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: [{ role: 'user', parts: [{ text: promptText }] }],
        config: { responseMimeType: 'application/json' },
      });

      if (geminiRes.text) {
        const parsed = JSON.parse(geminiRes.text);
        res.json({
          matchScore: typeof parsed.matchScore === 'number' ? parsed.matchScore : dynamicScore,
          candidateName: activeProfile.name || sahilProfile.name,
          summary: parsed.summary || `${activeProfile.name || sahilProfile.name} demonstrates a ${dynamicScore}% compatibility match for this position based on technical stack alignment.`,
          strengths: parsed.strengths || [
            `Proficiency in core technologies matching the job requirement.`,
            `Demonstrated project execution in full-stack and AI engineering.`,
            `Strong academic foundation and problem-solving track record.`
          ],
          missingSkills: parsed.missingSkills || missingSkills,
          recommendation: parsed.recommendation || (dynamicScore >= 80 ? 'Strong Hire Candidate - Schedule Interview' : 'Good Fit - Technical Screening Recommended'),
          keyMatchingSkills: parsed.keyMatchingSkills || (matchedSkills.length > 0 ? matchedSkills : ['Python', 'FastAPI', 'React', 'TypeScript']),
          extractedText: jobDescription.slice(0, 1000),
        });
        return;
      }
    } catch (e: any) {
      if (e?.status === 429 || e?.message?.includes('RESOURCE_EXHAUSTED') || e?.message?.includes('quota')) {
        console.warn('Gemini Job Match quota exceeded (429), using dynamic fallback matcher.');
      } else {
        console.warn('Gemini Job Match failed, using fallback engine:', e?.message || e);
      }
    }
  }

  // Dynamic fallback response
  res.json({
    matchScore: dynamicScore,
    candidateName: activeProfile.name || sahilProfile.name,
    summary: `${activeProfile.name || sahilProfile.name} achieves a ${dynamicScore}% alignment score for this role. Key overlap includes ${matchedSkills.slice(0, 4).join(', ') || 'Full-Stack & Python technologies'}.`,
    strengths: [
      `Hands-on expertise in ${matchedSkills.slice(0, 3).join(', ') || 'Python, FastAPI, and React'}`,
      `Extensive project portfolio with production-ready code`,
      `Solid problem-solving background and technical adaptability`,
      `Proven experience building modern web and AI applications`
    ],
    missingSkills: missingSkills.slice(0, 4),
    recommendation: dynamicScore >= 80 ? 'Strong Hire Candidate - Schedule Interview' : 'Good Fit - Technical Screening Recommended',
    keyMatchingSkills: matchedSkills.length > 0 ? matchedSkills : ['Python', 'FastAPI', 'React', 'TypeScript', 'Docker'],
    extractedText: jobDescription.slice(0, 1000),
  });
});

// 5. Resume Download Endpoint
app.get('/api/resume/download', async (req: Request, res: Response) => {
  const profile = await updateProfileFromResumePdfIfNeeded();
  const markdownResume = `
# ${profile.name}
${profile.title} | ${profile.location}
Email: ${profile.email} | Phone: ${profile.phone}
GitHub: ${profile.github} | LinkedIn: ${profile.linkedin}

---

## PROFESSIONAL SUMMARY
${profile.bio}

## TECHNICAL SKILLS
- **Languages**: ${(profile.skills?.languages || []).join(', ')}
- **Frameworks & Web**: ${(profile.skills?.frameworks || []).join(', ')}
- **AI / ML & LLMs**: ${(profile.skills?.aiMl || []).join(', ')}
- **Databases**: ${(profile.skills?.databases || []).join(', ')}
- **Tools & DevOps**: ${(profile.skills?.tools || []).join(', ')}

${profile.experiences && profile.experiences.length > 0 ? `## WORK EXPERIENCE\n` + profile.experiences.map((e: any) => `
### ${e.role} — ${e.company} (${e.duration})
*${e.location} | ${e.type}*
- ${e.description}
- **Technologies Used**: ${(e.skillsUsed || []).join(', ')}
`).join('\n') : ''}

## PROJECTS
${(profile.projects || [])
  .map(
    (p: any) => `
### ${p.title}
*Tech Stack: ${(p.techStack || []).join(', ')}*
- ${p.description}
${(p.highlights || []).map((h: string) => `- ${h}`).join('\n')}
`
  )
  .join('\n')}

${profile.education && profile.education.length > 0 ? `## EDUCATION\n` + profile.education.map((ed: any) => `
### ${ed.degree} in ${ed.field}
*${ed.institution} (${ed.duration})*
- CGPA: **${ed.cgpa}**
${(ed.highlights || []).map((h: string) => `- ${h}`).join('\n')}
`).join('\n') : ''}

${profile.achievements && profile.achievements.length > 0 ? `## ACHIEVEMENTS\n` + profile.achievements.map((a: string) => `- ${a}`).join('\n') : ''}
`;

  res.setHeader('Content-Type', 'text/markdown');
  res.setHeader('Content-Disposition', `attachment; filename="${profile.name.replace(/\s+/g, '_')}_Resume.md"`);
  res.send(markdownResume);
});

// ------------------- VITE SETUP & LISTEN -------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      root: path.resolve(process.cwd(), 'frontend'),
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else if (process.env.NODE_ENV === 'production') {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[Windows 11 AI Resume Server] Listening on http://0.0.0.0:${PORT}`);
    });
  }
}

startServer();

export default app;
