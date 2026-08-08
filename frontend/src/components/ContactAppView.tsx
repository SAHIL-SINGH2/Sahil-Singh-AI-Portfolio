import React from 'react';
import { Mail, Phone, MapPin, Linkedin, Github, Sparkles } from 'lucide-react';
import { CandidateProfile } from '../types';
import { sahilProfile } from '../data/candidateData';
import { ensureAbsoluteUrl } from '../utils/urlHelper';

interface ContactAppViewProps {
  onAskAI: (prompt: string) => void;
  onDownloadResume: () => void;
  profile?: CandidateProfile;
}

export const ContactAppView: React.FC<ContactAppViewProps> = ({
  onAskAI,
  profile,
}) => {
  const p = profile || sahilProfile;
  const initials = p.name ? p.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'SS';

  return (
    <div className="p-3 sm:p-6 max-w-4xl mx-auto h-full overflow-y-auto space-y-4 sm:space-y-6 window-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-slate-200 dark:border-white/10 pb-3 sm:pb-4 gap-3 border-b">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-wider border border-blue-500/20 mb-1">
            Windows Mail & People
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Contact Candidate & Connect with {p.name}
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Reach out regarding software engineering roles, interviews, or project collaborations
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/30 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
            Open for Opportunities
          </span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Contact Info Card */}
        <div className="space-y-4">
          <div className="bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 text-white font-extrabold text-xl flex items-center justify-center shadow-lg ring-2 ring-white/20">
                {initials}
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">{p.name}</h2>
                <p className="text-xs text-cyan-700 dark:text-cyan-400 font-semibold">{p.title}</p>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-cyan-600 dark:text-cyan-400" /> {p.location}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed border-t border-slate-200 dark:border-white/10 pt-3">
              {p.bio}
            </p>

            <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-white/10 text-xs">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold uppercase">Direct Email</span>
                  <a href={`mailto:${p.email}`} className="text-slate-900 dark:text-white font-medium hover:text-cyan-600 dark:hover:text-cyan-300 transition-colors">
                    {p.email}
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold uppercase">Phone</span>
                  <span className="text-slate-900 dark:text-white font-medium">{p.phone}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                  <Linkedin className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold uppercase">LinkedIn Profile</span>
                  <a href={ensureAbsoluteUrl(p.linkedin)} target="_blank" rel="noreferrer" className="text-cyan-600 dark:text-cyan-400 hover:underline font-medium break-all">
                    {p.linkedin}
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-slate-500/15 text-slate-700 dark:text-slate-300 border border-slate-500/20">
                  <Github className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold uppercase">GitHub Repositories</span>
                  <a href={ensureAbsoluteUrl(p.github)} target="_blank" rel="noreferrer" className="text-cyan-600 dark:text-cyan-400 hover:underline font-medium break-all">
                    {p.github}
                  </a>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => onAskAI(`What is ${p.name}'s preferred role, location, and salary expectations?`)}
            className="w-full win-btn win-btn-primary py-2.5 px-4 text-xs font-bold flex items-center justify-center gap-2 shadow-lg"
          >
            <Sparkles className="w-4 h-4 text-cyan-300" /> Ask AI Assistant About Hiring {p.name}
          </button>
        </div>
      </div>
    </div>
  );
};
