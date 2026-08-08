import React, { useState } from 'react';
import { 
  Search, 
  Bot, 
  FileText, 
  FolderKanban, 
  Code2, 
  Briefcase, 
  Award, 
  Mail, 
  Settings, 
  Power, 
  ChevronRight,
  Clock,
  Sparkles,
  ExternalLink
} from 'lucide-react';

import { CandidateProfile } from '../types';
import { sahilProfile } from '../data/candidateData';

interface Windows11StartMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenApp: (appId: string) => void;
  onResetSession?: () => void;
  profile?: CandidateProfile;
}

export const Windows11StartMenu: React.FC<Windows11StartMenuProps> = ({
  isOpen,
  onClose,
  onOpenApp,
  onResetSession,
  profile,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showPowerMenu, setShowPowerMenu] = useState(false);

  if (!isOpen) return null;

  const p = profile || sahilProfile;
  const initials = p.name ? p.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'SS';

  const pinnedApps = [
    {
      id: 'ai_chat',
      name: 'Personal AI',
      desc: 'Main AI Chatbot',
      icon: Bot,
      color: 'bg-gradient-to-tr from-blue-600 to-cyan-500 text-white',
    },
    {
      id: 'resume',
      name: 'Resume',
      desc: 'PDF & Markdown',
      icon: FileText,
      color: 'bg-gradient-to-tr from-rose-600 to-orange-500 text-white',
    },
    {
      id: 'projects',
      name: 'Projects',
      desc: 'Code & Systems',
      icon: FolderKanban,
      color: 'bg-gradient-to-tr from-indigo-600 to-purple-500 text-white',
    },
    {
      id: 'skills',
      name: 'Skills',
      desc: 'Tech Stack Matrix',
      icon: Code2,
      color: 'bg-gradient-to-tr from-sky-600 to-blue-500 text-white',
    },
    {
      id: 'jd_match',
      name: 'JD Matcher',
      desc: 'AI Gap Analyzer',
      icon: Briefcase,
      color: 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white',
    },
    {
      id: 'contact',
      name: 'Contact Me',
      desc: 'Candidate Bio & Mail',
      icon: Mail,
      color: 'bg-gradient-to-tr from-blue-700 to-indigo-600 text-white',
    },
  ];

  const filteredApps = searchQuery.trim()
    ? pinnedApps.filter((a) =>
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.desc.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : pinnedApps;

  const recentDocs = [
    {
      title: 'Sahil_Singh_Resume.md',
      desc: 'Recently viewed • Document Viewer',
      appId: 'resume',
      icon: FileText,
    },
    {
      title: 'GenAI RAG Search Architecture',
      desc: '10m ago • Projects Explorer',
      appId: 'projects',
      icon: FolderKanban,
    },
    {
      title: 'FastAPI & Microservices Benchmarks',
      desc: '1h ago • Skills Matrix',
      appId: 'skills',
      icon: Code2,
    },
  ];

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[1px]"
        onClick={onClose}
      />

      {/* Start Menu Floating Panel */}
      <div
        id="win11-start-menu"
        className="fixed bottom-14 left-1/2 -translate-x-1/2 w-[560px] max-w-[95vw] h-[580px] max-h-[82vh] bg-white/85 dark:bg-[#202020]/90 backdrop-blur-2xl border border-white/40 dark:border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.35)] z-50 flex flex-col overflow-hidden text-slate-800 dark:text-slate-100 window-enter"
      >
        {/* Search Bar */}
        <div className="p-4 sm:p-6 pb-3 border-b border-black/5 dark:border-white/5">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Type to search apps, skills, projects, resume..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 sm:py-2.5 bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0078d4] placeholder-slate-400 dark:placeholder-slate-500 transition-all"
              autoFocus
            />
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 py-3 sm:py-4 space-y-4 sm:space-y-6">
          {/* Pinned Applications */}
          <div>
            <div className="flex items-center justify-between mb-2 sm:mb-3 px-1">
              <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Pinned Apps & Tools
              </span>
              <button
                onClick={() => {
                  onOpenApp('ai_chat');
                  onClose();
                }}
                className="text-[11px] sm:text-xs text-[#0078d4] hover:underline flex items-center gap-1 font-medium"
              >
                Personal AI <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              {filteredApps.map((app) => {
                const Icon = app.icon;
                return (
                  <button
                    key={app.id}
                    onClick={() => {
                      onOpenApp(app.id);
                      onClose();
                    }}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-all duration-150 group text-center border border-transparent hover:border-black/5 dark:hover:border-white/5"
                  >
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform ${app.color}`}
                    >
                      <Icon className="w-5.5 h-5.5" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold leading-tight text-slate-800 dark:text-slate-100 group-hover:text-[#0078d4] transition-colors block">
                        {app.name}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">
                        {app.desc}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recommended Documents */}
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Recent Documents & Views
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {recentDocs.map((doc, idx) => {
                const Icon = doc.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      onOpenApp(doc.appId);
                      onClose();
                    }}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-all text-left group border border-transparent hover:border-black/5 dark:hover:border-white/5"
                  >
                    <div className="p-2 rounded-lg bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-[#0078d4] transition-colors">
                        {doc.title}
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                        {doc.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Start Menu Footer with User Profile */}
        <div className="px-6 py-3 bg-slate-100/70 dark:bg-[#1a1a1a]/80 border-t border-black/5 dark:border-white/5 flex items-center justify-between relative">
          <button
            onClick={() => {
              onOpenApp('contact');
              onClose();
            }}
            className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors group text-left"
          >
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                {initials}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-[#0078d4] transition-colors">
                {p.name}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                {p.title}
              </div>
            </div>
          </button>

          {/* Power Button */}
          <div className="relative">
            <button
              onClick={() => setShowPowerMenu(!showPowerMenu)}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              title="Power Options"
            >
              <Power className="w-4 h-4 text-rose-500" />
            </button>

            {/* Power Menu Popover */}
            {showPowerMenu && (
              <div className="absolute right-0 bottom-12 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1 z-50 text-xs">
                <button
                  onClick={() => {
                    if (onResetSession) onResetSession();
                    setShowPowerMenu(false);
                    onClose();
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-2"
                >
                  <Power className="w-3.5 h-3.5 text-blue-500" /> Restart Chat Session
                </button>

              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
