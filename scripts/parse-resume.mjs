/**
 * One-time resume/personal-details parser.
 *
 * WHY THIS EXISTS
 * ----------------
 * Previously, the server (server.ts) parsed your resume + personal details PDFs
 * with Groq on EVERY cold start (and sometimes on every chat message), which:
 *   1. Burned Groq tokens repeatedly for no reason.
 *   2. Produced slightly different JSON each time (since only the first ~3000
 *      characters of text were sent), causing inconsistent / incomplete /
 *      "hallucinated-looking" answers and inconsistent details across the
 *      Resume, Skills, Projects, Job-Match, and Chat apps.
 *
 * This script parses your PDFs with Groq ONCE, locally, and writes the result
 * to frontend/src/data/parsedProfile.json. The server now loads that file
 * directly on every request — no PDF parsing, no extra Groq call, and every
 * app in the UI reads the exact same data, so nothing is inconsistent.
 *
 * HOW TO USE
 * ----------
 * 1. Put your resume PDF (filename containing "resume" or "cv") and your
 *    personal details PDF (filename containing "personal"/"details"/"info"/
 *    "bio"/"profile") in the project root, /backend, or /frontend/public.
 * 2. Set GROQ_API_KEY in a local .env file (or export it in your shell).
 * 3. Run:  node scripts/parse-resume.mjs
 * 4. Commit the generated frontend/src/data/parsedProfile.json file.
 * 5. Re-run this script + re-commit ANY TIME you update your resume/personal
 *    details PDFs. That is the only time Groq will parse the PDFs again.
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

if (!GROQ_API_KEY || GROQ_API_KEY === 'your_groq_api_key_here') {
  console.error('❌ GROQ_API_KEY is not set. Add it to a .env file or export it, then re-run.');
  process.exit(1);
}

function findPdfs() {
  const searchDirs = [
    process.cwd(),
    path.join(process.cwd(), 'backend'),
    path.join(process.cwd(), 'public'),
    path.join(process.cwd(), 'frontend', 'public'),
  ];
  const resumePdfs = [];
  const personalPdfs = [];
  const other = [];

  for (const dir of searchDirs) {
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir)) {
      if (!name.toLowerCase().endsWith('.pdf')) continue;
      const full = path.join(dir, name);
      const lower = name.toLowerCase();
      if (lower.includes('resume') || lower.includes('cv')) resumePdfs.push(full);
      else if (['personal', 'detail', 'info', 'bio', 'profile', 'about'].some((k) => lower.includes(k))) personalPdfs.push(full);
      else other.push(full);
    }
  }
  if (resumePdfs.length === 0 && other.length > 0) resumePdfs.push(other.shift());
  if (personalPdfs.length === 0 && other.length > 0) personalPdfs.push(other.shift());
  return { resumePdfs, personalPdfs };
}

async function extractPdfText(filePath) {
  const { PDFParse } = await import('pdf-parse');
  const buffer = fs.readFileSync(filePath);
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  return (result?.text || '').trim();
}

async function callGroq(messages, { json = true, temperature = 0 } = {}) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      temperature,
      max_tokens: 3000,
      ...(json ? { response_format: { type: 'json_object' } } : {}),
    }),
  });
  if (!res.ok) throw new Error(`Groq API error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

const PARSE_PROMPT = `You are an expert resume parser. Parse the candidate document(s) below into structured JSON.

CRITICAL ACCURACY RULES:
1. Use ONLY facts explicitly written in the document text. Never invent, guess, or add anything not present.
2. "bio": ONLY the Professional Summary paragraph, no URLs/location/phone/email/page numbers.
3. "education": every education entry (degree, institution, field, duration, cgpa/score).
4. "skills": only technical skills/languages/frameworks/databases/tools actually written.
5. "projects": every project with its real title, tech stack, and description.
6. "experiences": every job/internship listed.
7. If a field genuinely is not present anywhere in the text, use an empty string / empty array — do not fabricate a value.

Return STRICT JSON with exactly this shape:
{
  "name": "", "title": "", "location": "", "email": "", "phone": "",
  "github": "", "linkedin": "", "portfolio": "", "totalExperienceYears": "",
  "bio": "",
  "skills": { "languages": [], "frameworks": [], "aiMl": [], "databases": [], "tools": [] },
  "experiences": [{ "id": "exp-1", "company": "", "role": "", "duration": "", "location": "", "type": "", "description": "", "skillsUsed": [] }],
  "projects": [{ "id": "proj-1", "title": "", "description": "", "techStack": [], "githubUrl": "", "liveUrl": "", "category": "", "highlights": [] }],
  "education": [{ "id": "edu-1", "institution": "", "degree": "", "field": "", "duration": "", "cgpa": "", "scoreLabel": "CGPA", "highlights": [] }],
  "achievements": []
}`;

async function main() {
  const { resumePdfs, personalPdfs } = findPdfs();
  if (resumePdfs.length === 0 && personalPdfs.length === 0) {
    console.error('❌ No resume or personal-details PDFs found in project root, /backend, /public, or /frontend/public.');
    process.exit(1);
  }

  let combinedText = '';
  if (resumePdfs.length > 0) {
    console.log(`📄 Reading resume: ${resumePdfs[0]}`);
    combinedText += await extractPdfText(resumePdfs[0]);
  }
  for (const p of personalPdfs) {
    console.log(`📄 Reading personal details: ${p}`);
    combinedText += `\n\n--- Personal Details Document ---\n` + (await extractPdfText(p));
  }

  console.log(`🤖 Parsing with Groq (${GROQ_MODEL})... (${combinedText.length} chars of source text)`);
  const raw = await callGroq([
    { role: 'system', content: 'Output ONLY valid JSON. Never invent facts not present in the input text.' },
    { role: 'user', content: `${PARSE_PROMPT}\n\nCandidate Document Text:\n${combinedText.slice(0, 15000)}` },
  ]);

  const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '').trim();
  const parsed = JSON.parse(cleaned);

  parsed.resumeRawText = combinedText;
  parsed.avatarUrl = parsed.avatarUrl || '';

  const outPath = path.join(process.cwd(), 'frontend', 'src', 'data', 'parsedProfile.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(parsed, null, 2), 'utf-8');
  console.log(`✅ Saved parsed profile to ${outPath}`);
  console.log('   Commit this file and redeploy. The server will use it directly — no more re-parsing on every question.');
}

main().catch((err) => {
  console.error('❌ Failed to parse resume:', err);
  process.exit(1);
});
