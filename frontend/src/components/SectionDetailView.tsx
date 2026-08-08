import React, { useState } from 'react';
import {
  FolderKanban,
  Code2,
  Briefcase,
  GraduationCap,
  Award,
  FileText,
  UserCheck,
  ExternalLink,
  Github,
  MessageSquare,
  Sparkles,
  Download,
  Filter,
  CheckCircle2,
  Terminal,
  Search,
  FileDown,
  FileCheck,
  FileCode
} from 'lucide-react';
import { ApiService } from '../services/api';
import { SidebarTab, CandidateProfile } from '../types';
import { sahilProfile } from '../data/candidateData';
import { ensureAbsoluteUrl } from '../utils/urlHelper';

interface SectionDetailViewProps {
  activeTab: SidebarTab;
  onAskAboutSection: (prompt: string) => void;
  onDownloadResume: () => void;
  profile?: CandidateProfile;
}

export const SectionDetailView: React.FC<SectionDetailViewProps> = ({
  activeTab,
  onAskAboutSection,
  onDownloadResume,
  profile,
}) => {
  const [projectCategory, setProjectCategory] = useState<string>('All');
  const [skillSearch, setSkillSearch] = useState<string>('');

  const p = profile || sahilProfile;

  const projectsList = (p.projects && p.projects.length > 0) ? p.projects : sahilProfile.projects;
  const candidateSkills = (p.skills && (
    (p.skills.languages && p.skills.languages.length > 0) ||
    (p.skills.frameworks && p.skills.frameworks.length > 0) ||
    (p.skills.aiMl && p.skills.aiMl.length > 0) ||
    (p.skills.databases && p.skills.databases.length > 0) ||
    (p.skills.tools && p.skills.tools.length > 0)
  )) ? p.skills : sahilProfile.skills;

  const filteredProjects = projectCategory === 'All'
    ? projectsList
    : projectsList.filter(proj => {
        const cat = (proj.category || '').toLowerCase();
        const title = (proj.title || '').toLowerCase();
        const desc = (proj.description || '').toLowerCase();
        const target = projectCategory.toLowerCase();
        const techMatch = (proj.techStack || []).some(t => t.toLowerCase().includes(target));
        return cat.includes(target) || title.includes(target) || desc.includes(target) || techMatch;
      });

  switch (activeTab) {
    case 'projects':
      return (
        <div className="p-3 sm:p-6 max-w-5xl mx-auto space-y-4 sm:space-y-6 window-enter h-full overflow-y-auto">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-3 sm:pb-4 gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-bold uppercase tracking-wider border border-amber-500/20 mb-1">
                Windows 11 Code Explorer
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <FolderKanban className="w-5 h-5 text-amber-400" />
                Featured Projects & Software Architectures
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Inspect AI applications, GenAI tools, and full-stack software built by {p.name}
              </p>
            </div>
            <button
              onClick={() => onAskAboutSection(`Tell me about ${p.name}'s top projects and technical architecture`)}
              className="win-btn win-btn-primary text-xs self-start sm:self-auto flex items-center gap-1.5 shadow-lg"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
              Ask AI About Projects
            </button>
          </div>

          {/* Category Filter Bar */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1 shrink-0 mr-1">
              <Filter className="w-3.5 h-3.5 text-cyan-400" /> Filter:
            </span>
            {['All', 'AI', 'Full Stack', 'Backend'].map((cat) => (
              <button
                key={cat}
                onClick={() => setProjectCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 border ${
                  projectCategory === cat
                    ? 'bg-blue-600 text-white border-blue-400 shadow-md'
                    : 'bg-slate-900/60 text-slate-300 border-white/10 hover:bg-slate-800'
                }`}
              >
                {cat} Projects
              </button>
            ))}
          </div>

          {/* Projects Grid */}
          {filteredProjects.length === 0 ? (
            <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-8 text-center space-y-4 my-4">
              <FolderKanban className="w-12 h-12 text-amber-400/60 mx-auto" />
              <h3 className="text-lg font-bold text-white">No Projects Found under "{projectCategory}"</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                No projects matched this category filter. Click below to view all candidate projects or ask AI to explain candidate projects.
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setProjectCategory('All')}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all shadow-md"
                >
                  Show All Projects
                </button>
                <button
                  onClick={() => onAskAboutSection(`Tell me about all projects built by ${p.name}`)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-all"
                >
                  Ask AI About Projects
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProjects.map((proj) => (
                <div 
                  key={proj.id} 
                  className="bg-slate-900/80 border border-white/10 hover:border-cyan-500/50 rounded-2xl p-5 space-y-3.5 flex flex-col justify-between shadow-xl transition-all hover:bg-slate-900/95 group"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                        {proj.category || 'AI & Full-Stack'}
                      </span>
                      {proj.githubUrl && (
                        <a
                          href={ensureAbsoluteUrl(proj.githubUrl)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-400 hover:text-cyan-400 flex items-center gap-1 text-xs transition-colors font-medium"
                        >
                          <Github className="w-4 h-4 text-cyan-400" />
                          Code Repo
                        </a>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">{proj.title}</h3>
                    <p className="text-xs text-slate-300 leading-relaxed">{proj.description}</p>
                    
                    <div className="pt-2">
                      <span className="text-[10px] font-bold text-cyan-400 uppercase block mb-1">Key Accomplishments</span>
                      <ul className="space-y-1.5 text-xs text-slate-300">
                        {(proj.highlights && proj.highlights.length > 0 ? proj.highlights : [proj.description || 'Project built by candidate']).map((h, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                            <span>{h}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-1">
                      {(proj.techStack && proj.techStack.length > 0 ? proj.techStack : ['Software Engineering']).map((t, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-cyan-200 border border-cyan-500/20 font-mono">
                          {t}
                        </span>
                      ))}
                    </div>
                    <button
                      onClick={() => onAskAboutSection(`Explain details and tech stack of project: ${proj.title}`)}
                      className="px-3 py-1 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 border border-blue-400/30 text-xs font-semibold transition-all flex items-center gap-1.5"
                    >
                      <MessageSquare className="w-3 h-3 text-cyan-400" />
                      Deep Dive
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );

    case 'skills':
      return (
        <div className="p-3 sm:p-6 max-w-4xl mx-auto space-y-4 sm:space-y-6 window-enter h-full overflow-y-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-3 sm:pb-4 gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/20 mb-1">
                Diagnostic Stack Matrix
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <Code2 className="w-5 h-5 text-emerald-400" />
                Technical Competencies & Engineering Stack
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Core programming languages, frameworks, AI/ML tools, databases, and infrastructure
              </p>
            </div>
            <button
              onClick={() => onAskAboutSection(`What are ${p.name}'s strongest skills in Python, FastAPI, React, and LLMs?`)}
              className="win-btn win-btn-primary text-xs self-start sm:self-auto flex items-center gap-1.5 shadow-lg"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
              Ask AI About Skills
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Languages */}
            <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-5 space-y-3 shadow-xl">
              <h3 className="font-bold text-sm text-white flex items-center gap-2 border-b border-white/10 pb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
                Programming Languages
              </h3>
              <div className="flex flex-wrap gap-2">
                {(candidateSkills.languages || []).map((s, i) => (
                  <span key={i} className="px-3 py-1.5 rounded-xl bg-blue-500/15 text-blue-200 border border-blue-400/30 font-semibold text-xs shadow-sm">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* AI / ML */}
            <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-5 space-y-3 shadow-xl">
              <h3 className="font-bold text-sm text-white flex items-center gap-2 border-b border-white/10 pb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse"></span>
                AI / ML & LLM Engineering
              </h3>
              <div className="flex flex-wrap gap-2">
                {(candidateSkills.aiMl || []).map((s, i) => (
                  <span key={i} className="px-3 py-1.5 rounded-xl bg-purple-500/15 text-purple-200 border border-purple-400/30 font-semibold text-xs shadow-sm">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Frameworks */}
            <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-5 space-y-3 shadow-xl">
              <h3 className="font-bold text-sm text-white flex items-center gap-2 border-b border-white/10 pb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Web Frameworks & APIs
              </h3>
              <div className="flex flex-wrap gap-2">
                {(candidateSkills.frameworks || []).map((s, i) => (
                  <span key={i} className="px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-200 border border-emerald-400/30 font-semibold text-xs shadow-sm">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Databases & Tools */}
            <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-5 space-y-3 shadow-xl">
              <h3 className="font-bold text-sm text-white flex items-center gap-2 border-b border-white/10 pb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                Databases & Infrastructure Tools
              </h3>
              <div className="flex flex-wrap gap-2">
                {[...(candidateSkills.databases || []), ...(candidateSkills.tools || [])].map((s, i) => (
                  <span key={i} className="px-3 py-1.5 rounded-xl bg-amber-500/15 text-amber-200 border border-amber-400/30 font-semibold text-xs shadow-sm">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      );

    case 'experience':
      return (
        <div className="p-3 sm:p-6 max-w-4xl mx-auto space-y-4 sm:space-y-6 window-enter h-full overflow-y-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-3 sm:pb-4 gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-bold uppercase tracking-wider border border-indigo-500/20 mb-1">
                Industry Contributions
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-indigo-400" />
                Work Experience & Internships
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Software Engineering Internships and industry AI/Full-Stack contributions
              </p>
            </div>
            <button
              onClick={() => onAskAboutSection(`Tell me about ${p.name}'s internship experience and achievements`)}
              className="win-btn win-btn-primary text-xs self-start sm:self-auto flex items-center gap-1.5 shadow-lg"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
              Ask AI About Experience
            </button>
          </div>

          <div className="space-y-4">
            {p.experiences.map((exp) => (
              <div key={exp.id} className="bg-slate-900/80 border border-white/10 rounded-2xl p-5 space-y-3 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-white">{exp.role}</h3>
                    <div className="text-cyan-400 font-semibold text-xs">
                      {exp.company} • <span className="text-slate-400">{exp.location}</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 self-start sm:self-auto">
                    {exp.duration}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{exp.description}</p>

                <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-1.5">
                    {exp.skillsUsed.map((sk, i) => (
                      <span key={i} className="text-[10px] px-2.5 py-0.5 rounded-md bg-slate-800 text-cyan-200 border border-cyan-500/20 font-mono">
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'education':
      return (
        <div className="p-3 sm:p-6 max-w-4xl mx-auto space-y-4 sm:space-y-6 window-enter h-full overflow-y-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-3 sm:pb-4 gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 text-[10px] font-bold uppercase tracking-wider border border-purple-500/20 mb-1">
                Academic Qualifications
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-purple-400" />
                Education & Academic Standing
              </h1>
            </div>
            <button
              onClick={() => onAskAboutSection(`What degree does ${p.name} hold and what is their academic standing?`)}
              className="win-btn win-btn-primary text-xs self-start sm:self-auto flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
              Ask AI About Education
            </button>
          </div>

          {p.education && p.education.length > 0 ? (
            p.education.map((edu) => (
              <div key={edu.id} className="bg-slate-900/80 border border-white/10 rounded-2xl p-6 space-y-4 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      {edu.degree} {edu.field ? `in ${edu.field}` : ''}
                    </h2>
                    <p className="text-xs text-slate-400">
                      {edu.institution} {edu.duration ? `(${edu.duration})` : ''}
                    </p>
                  </div>
                  {edu.cgpa && edu.cgpa !== 'N/A' && (
                    <div className="px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-black text-sm sm:text-base text-center shadow-lg">
                      {edu.scoreLabel || 'Score'}: {edu.cgpa}
                    </div>
                  )}
                </div>

                {edu.highlights && edu.highlights.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-white/10">
                    <h4 className="font-semibold text-xs text-cyan-400">Academic Highlights & Details</h4>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {edu.highlights.map((h, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-6 text-center text-slate-400 text-xs">
              No specific education entries recorded in candidate profile. Use "Ask AI" to query candidate credentials.
            </div>
          )}
        </div>
      );



    case 'resume':
      return (
        <div className="p-3 sm:p-6 max-w-4xl mx-auto space-y-4 sm:space-y-6 window-enter h-full overflow-y-auto">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-3 sm:pb-4 gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 text-[10px] font-bold uppercase tracking-wider border border-cyan-500/20 mb-1">
                Official Document Viewer
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-400" />
                Resume & Candidate Portfolio
              </h1>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={() => ApiService.downloadResumePDF()}
                className="win-btn win-btn-primary text-xs flex items-center gap-2 shadow-lg px-4 py-2"
              >
                <FileDown className="w-4 h-4 text-cyan-200" />
                <span>Download Resume PDF</span>
              </button>
              <button
                onClick={() => ApiService.downloadResumeMarkdown()}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/15 text-xs font-semibold transition-all flex items-center gap-1.5"
                title="Download Markdown Format (.md)"
              >
                <FileCode className="w-3.5 h-3.5 text-slate-400" />
                <span>Markdown</span>
              </button>
            </div>
          </div>

          {/* Download Callout Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/60 via-slate-900/80 to-blue-950/60 border border-cyan-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-400/30">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  {p.name.replace(/\s+/g, '_')}_Resume.pdf
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    PDF Document
                  </span>
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Formatted single-page ATS resume with full contact info, skills matrix, projects, and work experience.
                </p>
              </div>
            </div>
            <button
              onClick={() => ApiService.downloadResumePDF()}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all shrink-0"
            >
              <Download className="w-4 h-4" />
              Get PDF Resume
            </button>
          </div>

          {/* Interactive Formatted Resume Document Sheet */}
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/15 rounded-2xl p-6 sm:p-8 space-y-6 text-slate-900 dark:text-slate-100 shadow-2xl">
            {/* Sheet Header */}
            <div className="border-b border-slate-200 dark:border-white/10 pb-5 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{p.name}</h2>
                  <p className="text-sm font-bold text-cyan-600 dark:text-cyan-400">{p.title}</p>
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1 sm:text-right">
                  <div>{p.email} • {p.phone}</div>
                  <div>{p.location}</div>
                  <div className="text-cyan-600 dark:text-cyan-400 font-medium">{p.github.replace('https://', '')} • {p.linkedin.replace('https://', '')}</div>
                </div>
              </div>
            </div>

            {/* Section: Summary */}
            <div className="space-y-1.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 border-b border-slate-200 dark:border-white/10 pb-1">
                Professional Summary
              </h3>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{p.bio}</p>
            </div>

            {/* Section: Technical Skills */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 border-b border-slate-200 dark:border-white/10 pb-1">
                Technical Skills Matrix
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div><strong className="text-slate-900 dark:text-white">Languages:</strong> <span className="text-slate-600 dark:text-slate-300">{p.skills.languages.join(', ')}</span></div>
                <div><strong className="text-slate-900 dark:text-white">Frameworks:</strong> <span className="text-slate-600 dark:text-slate-300">{p.skills.frameworks.join(', ')}</span></div>
                <div><strong className="text-slate-900 dark:text-white">AI / ML & LLMs:</strong> <span className="text-slate-600 dark:text-slate-300">{p.skills.aiMl.join(', ')}</span></div>
                <div><strong className="text-slate-900 dark:text-white">Databases:</strong> <span className="text-slate-600 dark:text-slate-300">{p.skills.databases.join(', ')}</span></div>
              </div>
            </div>

            {/* Section: Work Experience */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 border-b border-slate-200 dark:border-white/10 pb-1">
                Work Experience
              </h3>
              {p.experiences.map((exp) => (
                <div key={exp.id} className="space-y-1 text-xs">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-slate-900 dark:text-white">{exp.role} — <span className="text-cyan-600 dark:text-cyan-400">{exp.company}</span></span>
                    <span className="text-slate-500 font-normal">{exp.duration}</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{exp.description}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">Key Stack: {exp.skillsUsed.join(', ')}</p>
                </div>
              ))}
            </div>

            {/* Section: Featured Projects */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 border-b border-slate-200 dark:border-white/10 pb-1">
                Featured Engineering Projects
              </h3>
              {p.projects.map((proj) => (
                <div key={proj.id} className="space-y-1 text-xs">
                  <div className="font-bold text-slate-900 dark:text-white">{proj.title}</div>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{proj.description}</p>
                  <p className="text-[11px] text-cyan-600 dark:text-cyan-400 font-medium">Stack: {proj.techStack.join(', ')}</p>
                </div>
              ))}
            </div>

            {/* Section: Education */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 border-b border-slate-200 dark:border-white/10 pb-1">
                Education
              </h3>
              {p.education.map((edu) => (
                <div key={edu.id} className="flex items-center justify-between text-xs">
                  <div>
                    <strong className="text-slate-900 dark:text-white">{edu.degree} in {edu.field}</strong>
                    <div className="text-slate-500">{edu.institution}</div>
                  </div>
                  <div className="font-bold text-emerald-600 dark:text-emerald-400">CGPA {edu.cgpa}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );

    case 'about':
    default:
      return (
        <div className="p-3 sm:p-6 max-w-4xl mx-auto space-y-4 sm:space-y-6 window-enter h-full overflow-y-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-3 sm:pb-4 gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-400 text-[10px] font-bold uppercase tracking-wider border border-teal-500/20 mb-1">
                Candidate File
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-teal-400" />
                About {p.name}
              </h1>
            </div>
            <button
              onClick={onDownloadResume}
              className="win-btn win-btn-primary text-xs self-start sm:self-auto flex items-center gap-2"
            >
              <Download className="w-3.5 h-3.5" />
              Download Resume
            </button>
          </div>

          <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-6 space-y-4 shadow-xl">
            <h2 className="text-lg font-bold text-white">Bio & Engineering Philosophy</h2>
            <p className="text-xs text-slate-300 leading-relaxed">{p.bio}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/10 text-xs">
              <div>
                <span className="font-semibold block text-slate-400">Email</span>
                <span className="text-cyan-300 font-medium">{p.email}</span>
              </div>
              <div>
                <span className="font-semibold block text-slate-400">Location</span>
                <span className="text-slate-200">{p.location}</span>
              </div>
              <div>
                <span className="font-semibold block text-slate-400">GitHub Repository</span>
                <a href={ensureAbsoluteUrl(p.github)} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline font-medium break-all">
                  {p.github}
                </a>
              </div>
              <div>
                <span className="font-semibold block text-slate-400">LinkedIn Profile</span>
                <a href={ensureAbsoluteUrl(p.linkedin)} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline font-medium break-all">
                  {p.linkedin}
                </a>
              </div>
            </div>
          </div>
        </div>
      );
  }
};

