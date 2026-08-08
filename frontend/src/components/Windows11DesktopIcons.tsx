import React from 'react';
import { 
  Bot, 
  FileText, 
  FolderKanban, 
  Code2, 
  Briefcase, 
  Award, 
  Mail, 
  Settings, 
  Globe, 
  Linkedin
} from 'lucide-react';
import { CandidateProfile } from '../types';
import { sahilProfile } from '../data/candidateData';
import { ensureAbsoluteUrl } from '../utils/urlHelper';

interface Windows11DesktopIconsProps {
  onOpenApp: (appId: string) => void;
  profile?: CandidateProfile;
}

export const Windows11DesktopIcons: React.FC<Windows11DesktopIconsProps> = ({
  onOpenApp,
  profile,
}) => {
  const p = profile || sahilProfile;
  const shortcuts = [
    {
      id: 'ai_chat',
      name: 'Personal AI',
      subtext: 'Main AI Chatbot',
      icon: Bot,
      bgColor: 'bg-gradient-to-tr from-blue-600 to-cyan-500 text-white',
      badge: 'AI Assistant',
    },
    {
      id: 'resume',
      name: 'Resume',
      subtext: 'PDF & Markdown',
      icon: FileText,
      bgColor: 'bg-gradient-to-tr from-rose-600 to-orange-500 text-white',
    },
    {
      id: 'projects',
      name: 'Projects',
      subtext: 'Featured Code & Architecture',
      icon: FolderKanban,
      bgColor: 'bg-gradient-to-tr from-indigo-600 to-purple-500 text-white',
    },
    {
      id: 'skills',
      name: 'Skills',
      subtext: 'Languages & ML Stack',
      icon: Code2,
      bgColor: 'bg-gradient-to-tr from-sky-600 to-blue-500 text-white',
    },
    {
      id: 'jd_match',
      name: 'JD Matcher',
      subtext: 'AI Job Gap Analyzer',
      icon: Briefcase,
      bgColor: 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white',
      badge: 'PRO',
    },
    {
      id: 'contact',
      name: 'Contact Me',
      subtext: 'Profile & Message Form',
      icon: Mail,
      bgColor: 'bg-gradient-to-tr from-blue-700 to-indigo-600 text-white',
    },
    {
      id: 'github',
      name: 'GitHub',
      subtext: 'Repository',
      icon: Globe,
      bgColor: 'bg-slate-900 text-white dark:bg-slate-800',
      isExternal: true,
      url: ensureAbsoluteUrl(p.github) || 'https://github.com/SAHIL-SINGH2',
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      subtext: 'Network Profile',
      icon: Linkedin,
      bgColor: 'bg-blue-700 text-white',
      isExternal: true,
      url: ensureAbsoluteUrl(p.linkedin) || 'https://www.linkedin.com/in/sahil-singh2/',
    },
  ];

  return (
    <div className="absolute top-14 sm:top-16 left-2 sm:left-4 z-10 flex flex-wrap sm:flex-col sm:flex-wrap gap-2 sm:gap-4 max-h-[calc(100vh-110px)] max-w-[calc(100vw-16px)] overflow-x-auto sm:overflow-visible no-scrollbar select-none p-1">
      {shortcuts.map((shortcut) => {
        const Icon = shortcut.icon;
        const handleClick = () => {
          if (shortcut.isExternal && shortcut.url) {
            window.open(ensureAbsoluteUrl(shortcut.url), '_blank');
          } else {
            onOpenApp(shortcut.id);
          }
        };

        return (
          <button
            key={shortcut.id}
            onClick={handleClick}
            onDoubleClick={handleClick}
            className="w-20 sm:w-24 flex flex-col items-center gap-1 p-1.5 sm:p-2 rounded-xl hover:bg-white/20 dark:hover:bg-black/30 hover:backdrop-blur-md transition-all group border border-transparent hover:border-white/30 dark:hover:border-white/10 shrink-0"
          >
            <div className="relative">
              <div
                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform ${shortcut.bgColor}`}
              >
                <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              {shortcut.badge && (
                <span className="absolute -top-1 -right-2 px-1.5 py-0.5 text-[8px] font-extrabold bg-amber-400 text-slate-900 rounded-full shadow-sm uppercase tracking-tight">
                  {shortcut.badge}
                </span>
              )}
            </div>
            <div className="flex flex-col items-center leading-tight">
              <span className="text-xs font-semibold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] text-center line-clamp-1 group-hover:text-blue-200 transition-colors">
                {shortcut.name}
              </span>
              <span className="text-[10px] text-white/70 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] text-center line-clamp-1 hidden sm:inline">
                {shortcut.subtext}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
};
