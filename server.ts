import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import zlib from 'zlib';
import dotenv from 'dotenv';
import { sahilProfile } from './frontend/src/data/candidateData.js';
import { CandidateProfile } from './frontend/src/types.js';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN PRINCIPLE
// sahilProfile in candidateData.ts is the SINGLE SOURCE OF TRUTH.
// Every field in it (name, title, email, phone, github, linkedin, education,
// projects, skills, bio) is CORRECT and MUST NOT be overwritten by any Groq
// parse output.  Groq PDF parsing is only used to SUPPLEMENT fields that are
// explicitly empty ("") in sahilProfile — never to replace populated ones.
// This eliminates hallucinated education, fake work experience, wrong email,
// missing title, and all other Groq-invented details.
// ─────────────────────────────────────────────────────────────────────────────

// The active profile starts as sahilProfile and never changes its core fields.
// It is built once at startup and reused on every request (no re-parse per chat).
let profileCache: CandidateProfile | null = null;
let profileBuildStarted = false;

// Groq model priority — llama-3.1-8b-instant is for CHAT only (low tokens),
// llama-3.3-70b-versatile is the PDF PARSE model (higher quality, used once).
const CHAT_MODEL  = 'llama-3.1-8b-instant';
const PARSE_MODEL = 'llama-3.3-70b-versatile';
// Three-model chain for chat: if 8b-instant hits rate limit → try 70b → try gemma2-9b-it
// All three are free on Groq. This gives ~3x more capacity before hitting built-in fallback.
const CHAT_MODELS_CHAIN = [
  'llama-3.1-8b-instant',    // primary: fastest, lowest token cost
  'llama-3.3-70b-versatile', // secondary: smarter, different rate limit bucket
  'gemma2-9b-it',            // tertiary: Google Gemma, separate quota entirely
];

function isGroqConfigured(): boolean {
  const key = process.env.GROQ_API_KEY;
  return !!key && key !== 'your_groq_api_key_here';
}

// ─────────────────────────────────────────────────────────────────────────────
// TEXT HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Fix PDF "s ah il @g m ai l. co m" → "sahil@gmail.com" */
function fixSpacedText(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/\b([a-zA-Z0-9._%+\-@]) (?=[a-zA-Z0-9._%+\-@])/g, (_, c) => c)
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function normaliseEmail(raw: string): string {
  if (!raw) return '';
  const stripped = raw.replace(/\s+/g, '').toLowerCase();
  return /^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$/.test(stripped)
    ? stripped : raw.trim();
}

function normalisePhone(raw: string): string {
  if (!raw) return '';
  return raw.replace(/\s+/g, '');
}

function ensureAbsoluteUrl(url: string): string {
  if (!url) return '';
  const t = url.trim();
  if (!t) return '';
  if (t.startsWith('http://') || t.startsWith('https://')) return t;
  return `https://${t.replace(/^\/+/, '')}`;
}

function cleanPdfRawText(rawText: string): string {
  if (!rawText) return '';
  return rawText
    .replace(/\.[a-zA-Z0-9_]+\(\)[;\s]*/g, ' ')
    .replace(/L\s*I\s*N\s*K\s*S/gi, ' ')
    .replace(/\/(?:Font|Device|Color|Catalog|Page|Obj|Parent|Type|ProcSet)[a-zA-Z0-9]*/gi, ' ')
    .replace(/(?:^|\s)(?:[a-zA-Z0-9]\s+){4,}[a-zA-Z0-9](?=$|\s)/g, ' ')
    .replace(/\\+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanLlmResponse(text: string): string {
  if (!text) return '';
  return text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/br>/gi, '')
    .replace(/^(?:As\s+[\w'\s]+AI\s+assistant,\s*provide\s*an\s*answer\s*to\s*this\s*question:\s*[^\n]*\n?)+/gi, '')
    .trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// PDF TEXT EXTRACTION
// ─────────────────────────────────────────────────────────────────────────────

function extractTextWithZlib(pdfBuffer: Buffer): string {
  const textPieces: string[] = [];
  try {
    const pdfString = pdfBuffer.toString('latin1');
    const streamRegex = /stream[\r\n]+([\s\S]*?)[\r\n]+endstream/g;
    let match: RegExpExecArray | null;
    while ((match = streamRegex.exec(pdfString)) !== null) {
      const matchIndex = match.index;
      const sStart = pdfBuffer.indexOf(Buffer.from('stream'), matchIndex);
      if (sStart === -1) continue;
      let dataStart = sStart + 6;
      if (pdfBuffer[dataStart] === 13) dataStart++;
      if (pdfBuffer[dataStart] === 10) dataStart++;
      const eEnd = pdfBuffer.indexOf(Buffer.from('endstream'), dataStart);
      if (eEnd === -1 || eEnd <= dataStart) continue;
      const chunk = pdfBuffer.subarray(dataStart, eEnd);
      let decompressed: Buffer | null = null;
      try { decompressed = zlib.inflateSync(chunk); } catch {
        try { decompressed = zlib.unzipSync(chunk); } catch {
          try { decompressed = zlib.inflateRawSync(chunk); } catch { decompressed = chunk; }
        }
      }
      if (decompressed) {
        const decoded = decompressed.toString('latin1');
        const literals = decoded.match(/\(([^()]*)\)\s*T[jJ]/g) || decoded.match(/\[\s*\(([^()]*)\)[\s\S]*?\]\s*T[jJ]/g);
        if (literals) {
          for (const lit of literals) {
            const inner = lit.match(/\(([^()]*)\)/g);
            if (inner) for (const s of inner) {
              const c = s.slice(1, -1).replace(/\\([()\\])/g, '$1').trim();
              if (c.length > 0) textPieces.push(c);
            }
          }
        } else {
          const allParens = decoded.match(/\(([^()]{2,})\)/g);
          if (allParens) for (const p of allParens) {
            const c = p.slice(1, -1).replace(/\\([()\\])/g, '$1').trim();
            if (c.length > 1 && /[a-zA-Z0-9]/.test(c) &&
                !/^\/|^[0-9.]+$|^Font|^Color|^Device|^Obj|^Catalog|^Page/i.test(c))
              textPieces.push(c);
          }
        }
      }
    }
    const uncompressed = pdfString.match(/\(([^()]*)\)\s*T[jJ]/g);
    if (uncompressed) for (const m of uncompressed) {
      const c = m.replace(/^\(/, '').replace(/\)\s*T[jJ]$/, '').replace(/\\([()\\])/g, '$1').trim();
      if (c.length > 0) textPieces.push(c);
    }
  } catch { /* ignore */ }
  return textPieces.join(' ').replace(/\s+/g, ' ').trim();
}

async function extractTextFromPdfBuffer(pdfBuffer: Buffer): Promise<string> {
  if (typeof (globalThis as any).DOMMatrix === 'undefined')
    (globalThis as any).DOMMatrix = class DOMMatrix { a=1;b=0;c=0;d=1;e=0;f=0; constructor(init?: any) { if (Array.isArray(init) && init.length>=6){this.a=init[0];this.b=init[1];this.c=init[2];this.d=init[3];this.e=init[4];this.f=init[5];} } };
  if (typeof (globalThis as any).ImageData === 'undefined') (globalThis as any).ImageData = class ImageData {};
  if (typeof (globalThis as any).Path2D === 'undefined') (globalThis as any).Path2D = class Path2D {};
  try {
    const mod = await import('pdf-parse') as any;
    const fn = typeof mod === 'function' ? mod : mod.default;
    if (typeof fn === 'function') {
      const res = await fn(pdfBuffer);
      if (res?.text && res.text.trim().length > 30) return res.text.trim();
    }
  } catch { /* fall through */ }
  return extractTextWithZlib(pdfBuffer) || '';
}

// ─────────────────────────────────────────────────────────────────────────────
// PDF FILE DISCOVERY — ONLY scans the project's own public folders.
// Never touches ~/Downloads or other system paths.
// ─────────────────────────────────────────────────────────────────────────────
function findCandidatePdfFiles() {
  const resumePdfs: { path: string; name: string; mtimeMs: number }[] = [];
  const personalPdfs: { path: string; name: string; mtimeMs: number }[] = [];
  const safeSearchDirs = [
    path.join(process.cwd(), 'frontend', 'public'),
    path.join(process.cwd(), 'public'),
    path.join(process.cwd(), 'backend'),
    path.join(process.cwd(), 'assets'),
    '/var/task/frontend/public',
    '/var/task/public',
  ];
  for (const dir of safeSearchDirs) {
    if (!fs.existsSync(dir)) continue;
    try {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (!entry.isFile() || !entry.name.toLowerCase().endsWith('.pdf')) continue;
        const fullPath = path.join(dir, entry.name);
        try {
          const stat = fs.statSync(fullPath);
          const fl = entry.name.toLowerCase();
          if (fl.includes('resume') || fl.includes('cv'))
            resumePdfs.push({ path: fullPath, name: entry.name, mtimeMs: stat.mtimeMs });
          else if (['personal','detail','information','info','bio','profile','about','contact'].some(k => fl.includes(k)))
            personalPdfs.push({ path: fullPath, name: entry.name, mtimeMs: stat.mtimeMs });
        } catch { /* skip */ }
      }
    } catch { /* skip */ }
  }
  resumePdfs.sort((a, b) => b.mtimeMs - a.mtimeMs);
  personalPdfs.sort((a, b) => b.mtimeMs - a.mtimeMs);
  console.log(`📁 PDF scan: ${resumePdfs.length} resume PDF(s), ${personalPdfs.length} personal PDF(s)`);
  resumePdfs.forEach(f => console.log(`  📄 Resume: ${f.path}`));
  personalPdfs.forEach(f => console.log(`  📄 Personal: ${f.path}`));
  return { resumePdfs, personalPdfs };
}

// ─────────────────────────────────────────────────────────────────────────────
// GROQ PDF PARSE — called AT MOST ONCE per deployment/startup.
// Uses the PARSE_MODEL (70b) for higher accuracy.
// Only supplements fields that are EMPTY in sahilProfile.
// ─────────────────────────────────────────────────────────────────────────────
async function callGroqForResumeParse(combinedText: string): Promise<any | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === 'your_groq_api_key_here') return null;

  // Minimal prompt — short output JSON uses fewer tokens and always completes.
  // We only need skills + any extra projects + experiences from PDF.
  // All core identity fields (name/title/email/phone/edu/bio) come from sahilProfile.
  const parsePrompt = `From this resume, extract ONLY what is explicitly written. Return compact JSON:
{"skills":{"languages":[],"frameworks":[],"aiMl":[],"databases":[],"tools":[]},"experiences":[],"projects":[{"id":"proj-1","title":"","description":"","techStack":[],"category":"AI & Full-Stack","highlights":[]}],"achievements":[]}
Rules: skills arrays = string lists, experiences = [] if no jobs listed, projects = list of real projects only.`;

  // Keep input small so prompt+response fits in 6000 TPM.
  // ~3000 chars ≈ ~800 tokens input; 2000 max_tokens output → JSON always completes.
  const cleanedText = cleanPdfRawText(combinedText).slice(0, 3000);
  try {
    console.log(`🤖 Parsing resume PDFs with Groq (${PARSE_MODEL}) — one time only...`);
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: PARSE_MODEL,
        response_format: { type: 'json_object' },
        max_tokens: 2000,
        temperature: 0,
        messages: [
          { role: 'system', content: 'Expert resume parser. Output ONLY valid JSON. Extract ONLY facts from the text. Never invent anything.' },
          { role: 'user', content: `${parsePrompt}\n\nDocument Text:\n${cleanedText}` },
        ],
      }),
    });
    if (res.status === 429) {
      console.warn('Rate limit on parse model, skipping Groq parse — will use sahilProfile defaults.');
      return null;
    }
    if (res.ok) {
      const data: any = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        const cleaned = content.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '').trim();
        const json = JSON.parse(cleaned);
        console.log(`✅ Groq PDF parse complete. Candidate name from PDF: ${json.name || '(not found)'}`);
        return json;
      }
    } else {
      const errText = await res.text();
      console.warn(`Groq parse error (${res.status}):`, errText);
    }
  } catch (err) {
    console.warn('Groq parse exception:', err);
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// BUILD PROFILE — runs ONCE at startup.
//
// Strategy:
//   1. Start from sahilProfile (100% correct hardcoded data).
//   2. If PDF(s) found, extract raw text (for the chat system prompt context).
//   3. Optionally run Groq parse on PDFs.
//   4. ONLY fill empty fields from Groq parse — NEVER overwrite non-empty ones.
//   5. Cache result forever (no re-parse per request).
// ─────────────────────────────────────────────────────────────────────────────
async function buildProfile(): Promise<CandidateProfile> {
  if (profileCache) return profileCache;

  let resumeRawText = '';
  let personalRawText = '';

  const { resumePdfs, personalPdfs } = findCandidatePdfFiles();

  if (resumePdfs.length > 0) {
    try {
      console.log(`📄 Extracting text from: ${resumePdfs[0].path}`);
      const buf = fs.readFileSync(resumePdfs[0].path);
      resumeRawText = await extractTextFromPdfBuffer(buf);
    } catch (e) { console.warn('Could not read resume PDF:', e); }
  }

  for (const pf of personalPdfs) {
    try {
      console.log(`📄 Extracting text from: ${pf.path}`);
      const buf = fs.readFileSync(pf.path);
      const t = await extractTextFromPdfBuffer(buf);
      if (t.trim()) personalRawText += `\n--- ${pf.name} ---\n${t.trim()}\n`;
    } catch (e) { console.warn(`Could not read ${pf.path}:`, e); }
  }

  const combinedRawText = [resumeRawText, personalRawText].filter(Boolean).join('\n\n');

  // Try Groq parse only if we have PDFs
  let groqParsed: any = null;
  if (combinedRawText.trim().length > 100 && isGroqConfigured()) {
    groqParsed = await callGroqForResumeParse(combinedRawText);
  }

  // ── START FROM sahilProfile — it is always correct ──
  // Only supplement EMPTY fields from groqParsed. Never overwrite populated ones.
  const base = { ...sahilProfile };

  // Projects: use PDF projects if Groq found them AND sahilProfile.projects already has entries
  // (sahilProfile.projects are the correct reference projects — don't replace unless PDF has new ones)
  // Education: sahilProfile has the correct entry — never replace with Groq parse
  // Experiences: sahilProfile.experiences=[] — keep it []  unless PDF explicitly lists a job
  // Skills: merge (PDF may list additional tools)
  let mergedSkills = { ...base.skills };
  if (groqParsed?.skills) {
    const gsk = groqParsed.skills;
    const merge = (a: string[], b: string[]) =>
      Array.from(new Set([...a, ...(Array.isArray(b) ? b : [])])).filter(Boolean);
    mergedSkills = {
      languages: merge(base.skills.languages, gsk.languages),
      frameworks: merge(base.skills.frameworks, gsk.frameworks),
      aiMl: merge(base.skills.aiMl, gsk.aiMl || gsk.ai_ml || []),
      databases: merge(base.skills.databases, gsk.databases),
      tools: merge(base.skills.tools, gsk.tools),
    };
  }

  // Experiences: only use from Groq if it found real ones (and base is empty)
  let resolvedExperiences = base.experiences; // [] by default
  if (
    base.experiences.length === 0 &&
    groqParsed?.experiences &&
    Array.isArray(groqParsed.experiences) &&
    groqParsed.experiences.length > 0
  ) {
    // Only accept if experience entries look real (have company + role)
    const realExps = groqParsed.experiences.filter(
      (e: any) => e.company && e.role &&
        !e.company.toLowerCase().includes('not specified') &&
        !e.role.toLowerCase().includes('not specified')
    );
    resolvedExperiences = realExps;
  }

  // Additional projects from PDF (add ones not already in base)
  let resolvedProjects = base.projects;
  if (groqParsed?.projects && Array.isArray(groqParsed.projects) && groqParsed.projects.length > 0) {
    const baseTitles = new Set(base.projects.map((p: any) => p.title.toLowerCase()));
    const newProjs = groqParsed.projects
      .filter((p: any) => p.title && !baseTitles.has(p.title.toLowerCase()))
      .map((p: any, idx: number) => ({
        id: p.id || `proj-pdf-${idx + 1}`,
        title: p.title,
        description: p.description || '',
        techStack: Array.isArray(p.techStack) ? p.techStack : [],
        githubUrl: ensureAbsoluteUrl(p.githubUrl || p.github_url || ''),
        liveUrl: ensureAbsoluteUrl(p.liveUrl || p.live_url || ''),
        category: p.category || 'AI & Full-Stack',
        highlights: Array.isArray(p.highlights) ? p.highlights : [p.description || ''],
      }));
    if (newProjs.length > 0) resolvedProjects = [...base.projects, ...newProjs];
  }

  profileCache = {
    // ── Core identity — always from sahilProfile, never overwritten ──
    name:      base.name,
    title:     base.title,
    location:  base.location,
    email:     base.email,
    phone:     base.phone,
    github:    base.github,
    linkedin:  base.linkedin,
    portfolio: base.portfolio,
    avatarUrl: base.avatarUrl,
    totalExperienceYears: base.totalExperienceYears,
    bio:       base.bio,
    // ── Education — always from sahilProfile, never overwritten ──
    education: base.education,
    // ── Skills — merged ──
    skills: mergedSkills,
    // ── Projects — base + any new ones from PDF ──
    projects: resolvedProjects,
    // ── Experiences ──
    experiences: resolvedExperiences,
    // ── Achievements ──
    achievements: (Array.isArray(groqParsed?.achievements) && groqParsed.achievements.length > 0)
      ? groqParsed.achievements : base.achievements,
    // ── Raw text for chat context ──
    resumeRawText: combinedRawText,
    personalDetails: personalRawText || base.personalDetails,
  };

  console.log(`✅ Profile ready: ${profileCache.name} | ${profileCache.title} | email:${profileCache.email} | phone:${profileCache.phone} | projects:${profileCache.projects.length} | edu:${profileCache.education.length} | exp:${profileCache.experiences.length}`);
  return profileCache;
}

// Initialise profile immediately on startup (not on first request)
buildProfile().catch(e => console.error('Profile build error:', e));

// ─────────────────────────────────────────────────────────────────────────────
// CHAT SYSTEM PROMPT
// ─────────────────────────────────────────────────────────────────────────────
function getSystemPrompt(profile: CandidateProfile): string {
  // Only include the first 3000 chars of raw PDF text as supplemental context.
  // The structured fields above are the primary source — raw text is a fallback.
  const rawCtx = cleanPdfRawText(profile.resumeRawText || '').slice(0, 3000);

  return `You are the personal AI assistant of ${profile.name}. You ONLY answer questions about ${profile.name} using the structured data below. Never make up, guess, or assume any detail not present here.

=== IDENTITY ===
Name: ${profile.name}
Title: ${profile.title}
Location: ${profile.location}
Email: ${profile.email}
Phone: ${profile.phone}
GitHub: ${profile.github}
LinkedIn: ${profile.linkedin}
Portfolio: ${profile.portfolio || 'Not listed'}

=== PROFESSIONAL SUMMARY ===
${profile.bio}

=== TECHNICAL SKILLS ===
Languages: ${(profile.skills?.languages || []).join(', ')}
Frameworks: ${(profile.skills?.frameworks || []).join(', ')}
AI/ML & LLMs: ${(profile.skills?.aiMl || []).join(', ')}
Databases: ${(profile.skills?.databases || []).join(', ')}
Tools: ${(profile.skills?.tools || []).join(', ')}

=== WORK EXPERIENCE ===
${(profile.experiences || []).length > 0
  ? profile.experiences.map((e: any) =>
      `• ${e.role} at ${e.company} (${e.duration})\n  ${e.description}\n  Stack: ${(e.skillsUsed||[]).join(', ')}`
    ).join('\n\n')
  : 'No work experience listed. Sahil is a student currently building projects.'}

=== PROJECTS ===
${(profile.projects || []).map((p: any, i: number) =>
  `${i+1}. ${p.title} [${p.category}]\n   ${p.description}\n   Tech: ${(p.techStack||[]).join(', ')}\n   Highlights: ${(p.highlights||[]).slice(0,3).join('; ')}`
).join('\n\n')}

=== EDUCATION ===
${(profile.education || []).map((ed: any) =>
  `• ${ed.degree} in ${ed.field}\n  Institution: ${ed.institution}\n  Duration: ${ed.duration}\n  ${ed.scoreLabel || 'CGPA'}: ${ed.cgpa}`
).join('\n\n')}

=== ACHIEVEMENTS ===
${(profile.achievements || []).map((a: string) => `• ${a}`).join('\n')}

${rawCtx ? `=== ADDITIONAL RESUME CONTEXT ===\n${rawCtx}\n` : ''}

=== STRICT ANSWER RULES ===
1. Answer ONLY using the facts listed above. NEVER invent, guess, or approximate.
2. For contact questions: Email is exactly "${profile.email}", Phone is "${profile.phone}". Use these exact values.
3. For education questions: Institution is "${(profile.education[0]?.institution) || 'Vision Institute of Technology, Aligarh'}", Degree is "${(profile.education[0]?.degree) || 'B.Tech'}", CGPA is "${(profile.education[0]?.cgpa) || 'N/A'}". Use these exact values.
4. Work experience: ${(profile.experiences||[]).length === 0 ? 'There is NO work experience. Sahil is a student. Do NOT invent any jobs.' : 'See work experience section above.'}
5. If any detail is not in the data above, respond: "This information is not mentioned in the provided documents."
6. Be direct, specific, and enthusiastic. Do not pad responses. Do not repeat the question.
7. For resume-update requests, respond: "I can't update the resume, I don't have this much permission."`;
}

// ─────────────────────────────────────────────────────────────────────────────
// GROQ CHAT — uses CHAT_MODEL (8b-instant) for low token usage per request.
// Profile is already cached — no re-parsing here.
// ─────────────────────────────────────────────────────────────────────────────
async function callGroqChat(question: string): Promise<string | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === 'your_groq_api_key_here') return null;
  const profile = profileCache || await buildProfile();
  const systemPrompt = getSystemPrompt(profile);
  // Try chat model first, fall back to parse model if rate limited
  const modelsToTry = CHAT_MODELS_CHAIN;
  for (const model of modelsToTry) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          max_tokens: 600,
          temperature: 0,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: question },
          ],
        }),
      });
      if (res.status === 429) {
        console.warn(`Rate limit on ${model}, trying next model...`);
        await new Promise(r => setTimeout(r, 800));
        continue;
      }
      if (res.ok) {
        const data: any = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) return cleanLlmResponse(content);
      } else {
        const err = await res.text();
        console.warn(`Groq chat error (${model}):`, err);
      }
    } catch (err) {
      console.warn(`Groq chat exception (${model}):`, err);
    }
  }
  return null;
}

function fallbackAnswer(question: string, profile: CandidateProfile): string {
  const q = question.toLowerCase();
  if (q.includes('update resume') || q.includes('modify resume'))
    return "I can't update the resume, I don't have this much permission.";
  if (q.includes('contact') || q.includes('email') || q.includes('phone') || q.includes('reach'))
    return `${profile.name}'s contact details:\n\n- **Email**: ${profile.email}\n- **Phone**: ${profile.phone}\n- **GitHub**: ${profile.github}\n- **LinkedIn**: ${profile.linkedin}\n- **Location**: ${profile.location}`;
  if (q.includes('project') || q.includes('portfolio') || q.includes('built'))
    return (profile.projects||[]).length > 0
      ? `${profile.name}'s Projects:\n\n${profile.projects.map((p,i)=>`${i+1}. **${p.title}** (${p.category})\n   ${p.description}\n   Tech: ${p.techStack.join(', ')}`).join('\n\n')}`
      : 'No projects found in the resume.';
  if (q.includes('skill') || q.includes('technology') || q.includes('tech stack'))
    return `${profile.name}'s Skills:\n\n- **Languages**: ${(profile.skills?.languages||[]).join(', ')}\n- **Frameworks**: ${(profile.skills?.frameworks||[]).join(', ')}\n- **AI/ML**: ${(profile.skills?.aiMl||[]).join(', ')}\n- **Databases**: ${(profile.skills?.databases||[]).join(', ')}\n- **Tools**: ${(profile.skills?.tools||[]).join(', ')}`;
  if (q.includes('education') || q.includes('degree') || q.includes('university') || q.includes('cgpa'))
    return (profile.education||[]).length > 0
      ? profile.education.map(e=>`**${e.degree} in ${e.field}**\n${e.institution} (${e.duration}) — ${e.scoreLabel||'CGPA'}: ${e.cgpa}`).join('\n\n')
      : 'Education not specified in resume.';
  return `${profile.name} — ${profile.title}\n\n${profile.bio}\n\nContact: ${profile.email} | ${profile.phone}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// API ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    groqConfigured: isGroqConfigured(),
    chatModels: CHAT_MODELS_CHAIN,
    parseModel: PARSE_MODEL,
    profileCached: !!profileCache,
  });
});

app.get('/api/candidate-info', async (_req: Request, res: Response) => {
  const profile = profileCache || await buildProfile();
  res.json(profile);
});

app.post(['/chat', '/api/chat'], async (req: Request, res: Response) => {
  const { question, stream, fastApiUrl } = req.body;
  if (!question || typeof question !== 'string') {
    res.status(400).json({ error: 'Question required.' }); return;
  }

  const qLower = question.toLowerCase();
  if (qLower.includes('update resume') || qLower.includes('replace resume') || qLower.includes('modify resume')) {
    const refusal = "I can't update the resume, I don't have this much permission.";
    if (stream !== false) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.write(`data: ${JSON.stringify({ chunk: refusal, done: true })}\n\n`);
      res.end(); return;
    }
    res.json({ answer: refusal }); return;
  }

  // Optional FastAPI proxy
  const targetFastApi = fastApiUrl || process.env.FASTAPI_URL;
  if (targetFastApi) {
    try {
      const proxyRes = await fetch(targetFastApi.replace(/\/$/, '') + '/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });
      if (proxyRes.ok) {
        const data: any = await proxyRes.json();
        const fa = data.answer || data.message;
        if (fa) {
          if (stream !== false) {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            const chunks = fa.split(' ');
            for (let i = 0; i < chunks.length; i++) {
              res.write(`data: ${JSON.stringify({ chunk: (i === 0 ? '' : ' ') + chunks[i], done: false })}\n\n`);
              await new Promise(r => setTimeout(r, 15));
            }
            res.write(`data: ${JSON.stringify({ chunk: '', done: true })}\n\n`);
            res.end(); return;
          }
          res.json({ answer: fa }); return;
        }
      }
    } catch { console.log('FastAPI offline, using Groq.'); }
  }

  const profile = profileCache || await buildProfile();
  let answer = await callGroqChat(question);
  if (!answer) answer = fallbackAnswer(question, profile);
  answer = cleanLlmResponse(answer);

  if (stream !== false) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    const chunks = answer.split(' ');
    for (let i = 0; i < chunks.length; i++) {
      res.write(`data: ${JSON.stringify({ chunk: (i === 0 ? '' : ' ') + chunks[i], done: false })}\n\n`);
      await new Promise(r => setTimeout(r, 20));
    }
    res.write(`data: ${JSON.stringify({ chunk: '', done: true })}\n\n`);
    res.end(); return;
  }
  res.json({ answer });
});

app.post('/api/job-match', async (req: Request, res: Response) => {
  const { jobDescription } = req.body;
  if (!jobDescription || typeof jobDescription !== 'string') {
    res.status(400).json({ error: 'Job description required.' }); return;
  }
  const profile = profileCache || await buildProfile();
  const jdLower = jobDescription.toLowerCase();
  const candidateSkillsList = [
    ...(profile.skills?.languages || []),
    ...(profile.skills?.frameworks || []),
    ...(profile.skills?.aiMl || []),
    ...(profile.skills?.databases || []),
    ...(profile.skills?.tools || []),
  ];
  const matchedSkills = candidateSkillsList.filter(s => jdLower.includes(s.toLowerCase()));
  const checkKws = ['python','react','fastapi','typescript','docker','postgresql','rag','langchain','aws','mongodb','tailwind','javascript','pytorch','openai','llm','redis','linux','node','express','nextjs','graphql'];
  const missingSkills = checkKws.filter(kw => jdLower.includes(kw) && !matchedSkills.some(m => m.toLowerCase().includes(kw)));
  let score = Math.round(50 + (matchedSkills.length / Math.min(10, Math.max(3, candidateSkillsList.length))) * 42);
  if (matchedSkills.length >= 6) score += 8;
  if (missingSkills.length >= 4) score -= 12;
  if (jdLower.includes('senior') || jdLower.includes('lead')) score -= 5;
  score = Math.min(97, Math.max(52, score));

  if (isGroqConfigured()) {
    try {
      const promptText = `Analyse this job description for ${profile.name}.\nCandidate: ${profile.title}, Skills: ${candidateSkillsList.join(', ')}\nProjects: ${profile.projects.map((p:any)=>p.title).join(', ')}\nJD:\n${jobDescription.slice(0, 2500)}\n\nReturn JSON: matchScore (0-100), summary, strengths (array), missingSkills (array), keyMatchingSkills (array), recommendation (string)`;
      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: CHAT_MODEL,
          response_format: { type: 'json_object' },
          max_tokens: 800,
          temperature: 0.2,
          messages: [
            { role: 'system', content: 'Expert talent assessor. Output only valid JSON.' },
            { role: 'user', content: promptText },
          ],
        }),
      });
      if (r.ok) {
        const d: any = await r.json();
        const parsed = JSON.parse(d.choices?.[0]?.message?.content || '{}');
        if (parsed.matchScore) {
          res.json({ matchScore: parsed.matchScore, candidateName: profile.name, ...parsed });
          return;
        }
      }
    } catch (e) { console.warn('Job match error:', e); }
  }

  res.json({
    matchScore: score,
    candidateName: profile.name,
    summary: `${profile.name} has ${score}% alignment with this role. Key matches: ${matchedSkills.slice(0, 4).join(', ') || 'Full-Stack & AI'}.`,
    strengths: [`Expertise in ${matchedSkills.slice(0, 3).join(', ') || 'core technologies'}`, 'Production-ready AI/full-stack project portfolio', 'Strong technical adaptability'],
    missingSkills: missingSkills.slice(0, 4),
    recommendation: score >= 80 ? 'Strong Hire — Schedule Interview' : 'Good Fit — Technical Screening Recommended',
    keyMatchingSkills: matchedSkills.length > 0 ? matchedSkills : ['Python', 'FastAPI', 'React', 'TypeScript'],
  });
});

app.get('/api/resume/download', async (_req: Request, res: Response) => {
  const profile = profileCache || await buildProfile();
  const md = `# ${profile.name}
${profile.title} | ${profile.location}
Email: ${profile.email} | Phone: ${profile.phone}
GitHub: ${profile.github} | LinkedIn: ${profile.linkedin}

---

## PROFESSIONAL SUMMARY
${profile.bio}

## TECHNICAL SKILLS
- **Languages**: ${(profile.skills?.languages||[]).join(', ')}
- **Frameworks**: ${(profile.skills?.frameworks||[]).join(', ')}
- **AI/ML**: ${(profile.skills?.aiMl||[]).join(', ')}
- **Databases**: ${(profile.skills?.databases||[]).join(', ')}
- **Tools**: ${(profile.skills?.tools||[]).join(', ')}

## PROJECTS
${(profile.projects||[]).map((p:any)=>`### ${p.title}\n*Tech: ${(p.techStack||[]).join(', ')}*\n${p.description}\n`).join('\n')}

## EDUCATION
${(profile.education||[]).map((ed:any)=>`### ${ed.degree} in ${ed.field}\n*${ed.institution} (${ed.duration})*\n${ed.scoreLabel||'CGPA'}: **${ed.cgpa}**\n`).join('\n')}`;
  res.setHeader('Content-Type', 'text/markdown');
  res.setHeader('Content-Disposition', `attachment; filename="${profile.name.replace(/\s+/g, '_')}_Resume.md"`);
  res.send(md);
});

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
    app.get('*', (_req: Request, res: Response) => res.sendFile(path.join(distPath, 'index.html')));
  }
  if (!process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => console.log(`[Sahil AI Resume Server] http://0.0.0.0:${PORT}`));
  }
}

startServer();
export default app;
