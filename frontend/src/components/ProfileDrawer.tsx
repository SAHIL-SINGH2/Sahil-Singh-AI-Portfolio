import React from 'react';
import {
  X,
  UserCheck,
  GraduationCap,
  Briefcase,
  Code,
  Award,
  Github,
  Linkedin,
  Globe,
  Mail,
  Phone,
  MapPin,
  Download,
  ExternalLink,
  Trophy
} from 'lucide-react';
import { CandidateProfile } from '../types';
import { sahilProfile } from '../data/candidateData';
import { ensureAbsoluteUrl } from '../utils/urlHelper';

interface ProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onDownloadResume: () => void;
  profile?: CandidateProfile;
}

export const ProfileDrawer: React.FC<ProfileDrawerProps> = ({
  isOpen,
  onClose,
  onDownloadResume,
  profile,
}) => {
  if (!isOpen) return null;

  const p = profile || sahilProfile;
  const initials = p.name ? p.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'SS';

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm transition-opacity window-enter">
      {/* Slide-out Panel */}
      <div className="w-full max-w-lg h-full win-mica shadow-2xl flex flex-col border-l border-black/10 dark:border-white/15 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-black/10 dark:border-white/10 flex items-center justify-between win-taskbar-bg">
          <div className="flex items-center gap-2 font-semibold text-sm text-gray-900 dark:text-white">
            <UserCheck className="w-4 h-4 text-blue-500" />
            <span>Candidate Profile Card</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-full text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs text-gray-700 dark:text-gray-300">
          {/* Hero Profile Card */}
          <div className="win-card p-4 flex flex-col items-center text-center space-y-3 relative overflow-hidden">
            <div className="w-20 h-20 rounded-full ring-4 ring-blue-500/30 overflow-hidden shadow-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-2xl">
              {initials}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{p.name}</h2>
              <p className="text-blue-600 dark:text-blue-400 font-medium text-xs">{p.title}</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1 mt-1">
                <MapPin className="w-3 h-3" />
                {p.location}
              </p>
            </div>

            {/* Quick Contact & Links */}
            <div className="flex items-center gap-2 pt-2">
              <a
                href={ensureAbsoluteUrl(p.github)}
                target="_blank"
                rel="noreferrer"
                className="win-btn p-1.5"
                title="GitHub"
              >
                <Github className="w-4 h-4" />
              </a>
              <a
                href={ensureAbsoluteUrl(p.linkedin)}
                target="_blank"
                rel="noreferrer"
                className="win-btn p-1.5"
                title="LinkedIn"
              >
                <Linkedin className="w-4 h-4 text-blue-500" />
              </a>
              <a
                href={ensureAbsoluteUrl(p.portfolio)}
                target="_blank"
                rel="noreferrer"
                className="win-btn p-1.5"
                title="Portfolio"
              >
                <Globe className="w-4 h-4 text-emerald-500" />
              </a>
              <button
                onClick={onDownloadResume}
                className="win-btn win-btn-primary py-1 px-3 text-xs"
              >
                <Download className="w-3.5 h-3.5" />
                Download Resume
              </button>
            </div>
          </div>

          {/* Bio Summary */}
          <div className="win-card p-4 space-y-2">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-blue-500" />
              Professional Overview
            </h3>
            <p className="leading-relaxed text-gray-600 dark:text-gray-300">{p.bio}</p>
          </div>

          {/* Education & CGPA */}
          <div className="win-card p-4 space-y-3">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-purple-500" />
              Education & CGPA
            </h3>
            {p.education && p.education.length > 0 ? (
              p.education.map((edu) => (
                <div key={edu.id} className="p-2.5 rounded-lg bg-black/5 dark:bg-white/5 space-y-1">
                  <div className="flex justify-between font-semibold text-gray-900 dark:text-white text-xs">
                    <span>{edu.degree} {edu.field ? `in ${edu.field}` : ''}</span>
                    {edu.cgpa && edu.cgpa !== 'N/A' && <span className="text-emerald-500 font-bold">{edu.cgpa}</span>}
                  </div>
                  <div className="text-[11px] text-gray-500 dark:text-gray-400">{edu.institution} {edu.duration ? `(${edu.duration})` : ''}</div>
                  {edu.highlights && edu.highlights.length > 0 && (
                    <ul className="list-disc list-inside text-[11px] space-y-0.5 pt-1 text-gray-600 dark:text-gray-300">
                      {edu.highlights.map((h, idx) => (
                        <li key={idx}>{h}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))
            ) : (
              <div className="text-xs text-gray-500 italic">No education entries listed in candidate profile.</div>
            )}
          </div>

          {/* Key Skills Tags */}
          <div className="win-card p-4 space-y-3">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
              <Code className="w-4 h-4 text-emerald-500" />
              Technical Skillset
            </h3>
            <div className="space-y-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Languages & Core</span>
                <div className="flex flex-wrap gap-1.5">
                  {p.skills.languages.map((s, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-medium text-[11px]">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">AI / ML & LLMs</span>
                <div className="flex flex-wrap gap-1.5">
                  {p.skills.aiMl.map((s, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 font-medium text-[11px]">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Frameworks & Backend</span>
                <div className="flex flex-wrap gap-1.5">
                  {p.skills.frameworks.map((s, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium text-[11px]">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Work Experience */}
          {p.experiences && p.experiences.length > 0 && (
            <div className="win-card p-4 space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-indigo-500" />
                Work Experience
              </h3>
              {p.experiences.map((exp) => (
                <div key={exp.id} className="p-3 rounded-lg bg-black/5 dark:bg-white/5 space-y-1.5">
                  <div className="flex items-center justify-between font-semibold text-gray-900 dark:text-white">
                    <span>{exp.role}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                      {exp.type}
                    </span>
                  </div>
                  <div className="text-gray-500 dark:text-gray-400 text-[11px]">{exp.company} • {exp.duration}</div>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{exp.description}</p>
                </div>
              ))}
            </div>
          )}

          {/* Featured Projects */}
          <div className="win-card p-4 space-y-3">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
              <Code className="w-4 h-4 text-amber-500" />
              Featured Projects
            </h3>
            {p.projects.map((proj) => (
              <div key={proj.id} className="p-3 rounded-lg bg-black/5 dark:bg-white/5 space-y-1.5">
                <div className="flex items-center justify-between font-semibold text-gray-900 dark:text-white">
                  <span>{proj.title}</span>
                  {proj.githubUrl && (
                    <a href={proj.githubUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline flex items-center gap-1 text-[11px]">
                      Code <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-[11px] leading-relaxed">{proj.description}</p>
                <div className="flex flex-wrap gap-1 pt-1">
                  {proj.techStack.map((t, i) => (
                    <span key={i} className="text-[10px] px-1.5 py-0.2 rounded bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Achievements */}
          <div className="win-card p-4 space-y-3">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-yellow-500" />
              Achievements
            </h3>
            <ul className="space-y-1.5 text-gray-600 dark:text-gray-300">
              {p.achievements.map((ach, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-yellow-500 font-bold">•</span>
                  <span>{ach}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
