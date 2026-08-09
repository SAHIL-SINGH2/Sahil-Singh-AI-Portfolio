import React, { useState, useEffect } from 'react';
import { Conversation, Message, AppSettings, CandidateProfile } from './types';
import { ApiService } from './services/api';
import { ChatWindow } from './components/ChatWindow';
import { ChatInput } from './components/ChatInput';
import { SectionDetailView } from './components/SectionDetailView';
import { JobMatchAppView } from './components/JobMatchAppView';
import { ContactAppView } from './components/ContactAppView';
import { SettingsAppView } from './components/SettingsAppView';
import { NotificationToast, ToastMessage } from './components/NotificationToast';
import { Windows11Taskbar, TaskbarAppInfo } from './components/Windows11Taskbar';
import { Windows11StartMenu } from './components/Windows11StartMenu';
import { Windows11DesktopIcons } from './components/Windows11DesktopIcons';
import { Windows11QuickSettings } from './components/Windows11QuickSettings';
import { WindowFrame } from './components/WindowFrame';

import { 
  Bot, 
  FileText, 
  FolderKanban, 
  Code2, 
  Briefcase, 
  Award, 
  Mail, 
  Settings, 
  LucideIcon,
  Sparkles
} from 'lucide-react';

// Wallpaper static path
const DEFAULT_WALLPAPER = '/wallpaper.jpg';

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  accentColor: '#0078d4',
  backendUrl: '',
  autoScroll: true,
  soundEffects: false,
  streamingEnabled: true,
};

const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv-default',
    title: 'New chat',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: [],
  },
];

export interface AppWindowState {
  id: string;
  name: string;
  icon: LucideIcon;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  color: string;
  badge?: string;
  defaultPosition: { x: number; y: number; width: number; height: number };
}

export default function App() {
  // Local storage state initialization
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    try {
      const saved = localStorage.getItem('sahil_ai_chats');
      if (saved) {
        const parsed: Conversation[] = JSON.parse(saved);
        // Clean out legacy sample dummy items
        const cleaned = parsed.filter(
          (c) =>
            !['conv-1', 'conv-2', 'conv-3', 'conv-4', 'conv-5', 'conv-6', 'conv-7', 'conv-8', 'conv-9'].includes(c.id) &&
            !['Best Laptop Under 55k', 'Laptop Processor Comparison', 'Best Phone Under 15k', 'AI Voice Support Prompt', 'Program Location Inquiry', 'Frontend Engineering Internship', 'AI Resume Chatbot', 'Internship Application Advice', 'Certificate Resume Description'].includes(c.title)
        );
        if (cleaned.length > 0) {
          return cleaned;
        }
      }
      return INITIAL_CONVERSATIONS;
    } catch {
      return INITIAL_CONVERSATIONS;
    }
  });

  const [activeConvId, setActiveConvId] = useState<string>(() => {
    return conversations[0]?.id || 'conv-default';
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('sahil_ai_settings');
      return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [isThinking, setIsThinking] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [candidateProfile, setCandidateProfile] = useState<CandidateProfile | undefined>(undefined);

  // Fetch dynamic candidate profile from backend on mount
  useEffect(() => {
    ApiService.getCandidateInfo()
      .then((profile) => {
        if (profile) {
          setCandidateProfile(profile);
        }
      })
      .catch((err) => {
        console.warn('Could not load dynamic candidate info:', err);
      });
  }, []);

  // Desktop System Panels
  const [isStartMenuOpen, setIsStartMenuOpen] = useState(false);
  const [isQuickSettingsOpen, setIsQuickSettingsOpen] = useState(false);
  const [maxZIndex, setMaxZIndex] = useState(20);

  // 8 Windows 11 AI Desktop App Window States
  const [appWindows, setAppWindows] = useState<Record<string, AppWindowState>>({
    ai_chat: {
      id: 'ai_chat',
      name: 'Personal AI',
      icon: Bot,
      isOpen: true,
      isMinimized: false,
      isMaximized: false,
      zIndex: 20,
      color: 'bg-gradient-to-tr from-blue-600 to-cyan-500',
      badge: 'Main AI',
      defaultPosition: { x: 80, y: 35, width: 920, height: 630 },
    },
    resume: {
      id: 'resume',
      name: 'Resume',
      icon: FileText,
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      zIndex: 10,
      color: 'bg-gradient-to-tr from-rose-600 to-orange-500',
      defaultPosition: { x: 120, y: 45, width: 860, height: 600 },
    },
    projects: {
      id: 'projects',
      name: 'Projects',
      icon: FolderKanban,
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      zIndex: 10,
      color: 'bg-gradient-to-tr from-indigo-600 to-purple-500',
      defaultPosition: { x: 140, y: 50, width: 880, height: 610 },
    },
    skills: {
      id: 'skills',
      name: 'Skills',
      icon: Code2,
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      zIndex: 10,
      color: 'bg-gradient-to-tr from-sky-600 to-blue-500',
      defaultPosition: { x: 160, y: 55, width: 840, height: 580 },
    },
    jd_match: {
      id: 'jd_match',
      name: 'JD Matcher',
      icon: Briefcase,
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      zIndex: 10,
      color: 'bg-gradient-to-tr from-emerald-600 to-teal-500',
      badge: 'PRO',
      defaultPosition: { x: 180, y: 40, width: 880, height: 620 },
    },
    contact: {
      id: 'contact',
      name: 'Contact Me',
      icon: Mail,
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      zIndex: 10,
      color: 'bg-gradient-to-tr from-blue-700 to-indigo-600',
      defaultPosition: { x: 220, y: 65, width: 860, height: 590 },
    },
  });

  // Apply Theme & Accent Color CSS variables
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    root.style.setProperty('--accent-color', settings.accentColor);
  }, [settings.theme, settings.accentColor]);

  // Sync Conversations to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('sahil_ai_chats', JSON.stringify(conversations));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }, [conversations]);

  // Sync Settings to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('sahil_ai_settings', JSON.stringify(settings));
    } catch (e) {
      console.warn('LocalStorage settings save failed:', e);
    }
  }, [settings]);

  // Toast Helper
  const showToast = (title: string, message?: string, type: 'success' | 'error' | 'info' = 'info') => {
    const newToast: ToastMessage = {
      id: Date.now().toString(),
      title,
      message,
      type,
    };
    setToasts((prev) => [...prev, newToast]);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Window Manager Actions
  const handleOpenApp = (appId: string) => {
    const nextZ = maxZIndex + 1;
    setMaxZIndex(nextZ);

    setAppWindows((prev) => {
      const app = prev[appId];
      if (!app) return prev;
      return {
        ...prev,
        [appId]: {
          ...app,
          isOpen: true,
          isMinimized: false,
          zIndex: nextZ,
        },
      };
    });
  };

  const handleCloseApp = (appId: string) => {
    setAppWindows((prev) => ({
      ...prev,
      [appId]: {
        ...prev[appId],
        isOpen: false,
        isMinimized: false,
      },
    }));
  };

  const handleMinimizeApp = (appId: string) => {
    setAppWindows((prev) => ({
      ...prev,
      [appId]: {
        ...prev[appId],
        isMinimized: true,
      },
    }));
  };

  const handleMaximizeApp = (appId: string) => {
    setAppWindows((prev) => ({
      ...prev,
      [appId]: {
        ...prev[appId],
        isMaximized: !prev[appId].isMaximized,
      },
    }));
  };

  const handleFocusApp = (appId: string) => {
    const nextZ = maxZIndex + 1;
    setMaxZIndex(nextZ);
    setAppWindows((prev) => ({
      ...prev,
      [appId]: {
        ...prev[appId],
        zIndex: nextZ,
      },
    }));
  };

  const handleTaskbarClick = (appId: string) => {
    const app = appWindows[appId];
    if (!app) return;

    if (!app.isOpen) {
      handleOpenApp(appId);
      return;
    }

    if (app.isMinimized) {
      handleOpenApp(appId);
      return;
    }

    // Check if it's the top window
    const isTop = (Object.values(appWindows) as AppWindowState[]).every(
      (w) => !w.isOpen || w.isMinimized || w.zIndex <= app.zIndex
    );

    if (isTop) {
      handleMinimizeApp(appId);
    } else {
      handleFocusApp(appId);
    }
  };

  // Get active conversation for Personal AI Chatbot app
  const activeConv = conversations.find((c) => c.id === activeConvId) || conversations[0];

  // Send Message Handler for Personal AI Chatbot
  const handleSendMessage = async (questionText: string) => {
    if (!questionText.trim() || isThinking) return;

    // Ensure AI Chat app window is open & focused
    handleOpenApp('ai_chat');

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: questionText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const assistantMsgId = (Date.now() + 1).toString();
    const assistantPlaceholderMessage: Message = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isStreaming: true,
    };

    const updatedTitle =
      activeConv.messages.length === 0
        ? questionText.slice(0, 30) + (questionText.length > 30 ? '...' : '')
        : activeConv.title;

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeConv.id) {
          return {
            ...c,
            title: updatedTitle,
            updatedAt: new Date().toISOString(),
            messages: [...c.messages, userMessage, assistantPlaceholderMessage],
          };
        }
        return c;
      })
    );

    setIsThinking(true);

    try {
      let accumulatedText = '';

      await ApiService.sendChatMessage(
        {
          question: questionText,
          stream: settings.streamingEnabled,
          fastApiUrl: settings.backendUrl,
        },
        (chunkText) => {
          accumulatedText = chunkText;
          setConversations((prev) =>
            prev.map((c) => {
              if (c.id === activeConv.id) {
                return {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === assistantMsgId
                      ? { ...m, content: accumulatedText, isStreaming: true }
                      : m
                  ),
                };
              }
              return c;
            })
          );
        }
      );

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === activeConv.id) {
            return {
              ...c,
              messages: c.messages.map((m) =>
                m.id === assistantMsgId ? { ...m, isStreaming: false } : m
              ),
            };
          }
          return c;
        })
      );
    } catch (err) {
      console.error('Send message error:', err);
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === activeConv.id) {
            return {
              ...c,
              messages: c.messages.map((m) =>
                m.id === assistantMsgId
                  ? {
                      ...m,
                      content:
                        "I am currently operating in offline mode. Sahil is an AI & Full-Stack Engineer with strong expertise in Python, FastAPI, React, and RAG architectures.",
                      isStreaming: false,
                    }
                  : m
              ),
            };
          }
          return c;
        })
      );
    } finally {
      setIsThinking(false);
    }
  };

  const handleCopyMessage = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    showToast('Copied to Clipboard', 'Text copied successfully', 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRegenerateLastMessage = () => {
    const msgs = activeConv.messages;
    if (msgs.length === 0) return;

    const lastUserMsg = [...msgs].reverse().find((m) => m.role === 'user');
    if (lastUserMsg) {
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === activeConv.id) {
            return {
              ...c,
              messages: c.messages.filter((m) => m.id !== msgs[msgs.length - 1].id),
            };
          }
          return c;
        })
      );
      handleSendMessage(lastUserMsg.content);
    }
  };

  const handleDownloadResume = async () => {
    try {
      await ApiService.downloadResume();
      showToast('Resume PDF Generated', 'Saved Sahil_Singh_Resume.pdf', 'success');
    } catch {
      showToast('Download Error', 'Could not generate resume file', 'error');
    }
  };

  const handleSelectConv = (id: string) => {
    setActiveConvId(id);
  };

  const handleNewChat = () => {
    const newId = `conv-${Date.now()}`;
    const newConv: Conversation = {
      id: newId,
      title: 'New chat',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveConvId(newId);
  };

  const handleDeleteConv = (id: string) => {
    setConversations((prev) => {
      const filtered = prev.filter((c) => c.id !== id);
      if (filtered.length === 0) {
        const fresh: Conversation = {
          id: `conv-${Date.now()}`,
          title: 'New chat',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          messages: [],
        };
        setActiveConvId(fresh.id);
        return [fresh];
      }
      if (id === activeConvId) {
        setActiveConvId(filtered[0].id);
      }
      return filtered;
    });
    showToast('Chat Deleted', 'Removed conversation history', 'info');
  };

  const handleClearAllChats = () => {
    const fresh: Conversation[] = [
      {
        id: `conv-${Date.now()}`,
        title: 'New chat',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [],
      },
    ];
    setConversations(fresh);
    setActiveConvId(fresh[0].id);
    showToast('Chats Reset', 'All AI chat logs have been cleared', 'info');
  };

  // Convert app Windows state for Taskbar bar rendering
  const taskbarAppsList: TaskbarAppInfo[] = (Object.values(appWindows) as AppWindowState[]).map((app) => ({
    id: app.id,
    name: app.name,
    icon: app.icon,
    isOpen: app.isOpen,
    isMinimized: app.isMinimized,
    isFocused:
      app.isOpen &&
      !app.isMinimized &&
      (Object.values(appWindows) as AppWindowState[]).every(
        (w) => !w.isOpen || w.isMinimized || w.zIndex <= app.zIndex
      ),
    color: app.color,
  }));

  const wallpaperSrc = DEFAULT_WALLPAPER;

  return (
    <div className="w-screen h-screen overflow-hidden relative select-none font-sans bg-slate-950 flex flex-col justify-between">
      {/* 1. Official Windows 11 Desktop Background Wallpaper */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <img
          src={wallpaperSrc}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = '/wallpaper.jpg';
          }}
          alt="Windows 11 Desktop Wallpaper"
          className="w-full h-full object-cover object-center scale-100 transition-all duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 pointer-events-none" />
      </div>

      {/* 1.5 Sleek Windows 11 Desktop Header & Branding Widget */}
      <div className="absolute top-2 sm:top-3 left-1/2 -translate-x-1/2 z-0 px-2 sm:px-4 max-w-[98vw]">
        <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl bg-slate-900/75 dark:bg-slate-900/85 backdrop-blur-2xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.4)] text-white select-none">
          {/* Candidate Profile Branding Badge */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 font-extrabold text-[11px] sm:text-xs flex items-center justify-center text-white shadow-md ring-1 ring-white/30 shrink-0">
              SS
            </div>
            <div className="flex flex-col text-left leading-tight">
              <span className="text-[11px] sm:text-xs font-black tracking-wider text-white uppercase flex items-center gap-1.5">
                SAHIL SINGH AI PORTFOLIO
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 animate-pulse" title="Active AI Desktop OS" />
              </span>
              <span className="text-[9px] sm:text-[10px] text-cyan-200/90 font-medium line-clamp-1">
                AI & Full-Stack Engineer • Windows 11 OS
              </span>
            </div>
          </div>

          <div className="hidden sm:block w-[1px] h-6 bg-white/20 mx-1" />

          {/* Quick Header App Launchers */}
          <div className="hidden sm:flex items-center gap-1.5">
            <button
              onClick={() => handleOpenApp('ai_chat')}
              className="px-2.5 py-1 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-100 border border-blue-400/30 text-[11px] font-semibold transition-all flex items-center gap-1.5 hover:scale-105 active:scale-95"
            >
              <Bot className="w-3.5 h-3.5 text-cyan-400" /> AI Chat
            </button>
            <button
              onClick={() => handleOpenApp('resume')}
              className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-100 border border-rose-400/30 text-[11px] font-semibold transition-all flex items-center gap-1.5 hover:scale-105 active:scale-95"
            >
              <FileText className="w-3.5 h-3.5 text-rose-400" /> Resume
            </button>
            <button
              onClick={() => handleOpenApp('jd_match')}
              className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-100 border border-emerald-400/30 text-[11px] font-semibold transition-all flex items-center gap-1.5 hover:scale-105 active:scale-95"
            >
              <Briefcase className="w-3.5 h-3.5 text-emerald-400" /> JD Matcher
            </button>
          </div>
        </div>
      </div>

      {/* 2. Windows 11 Desktop Icons Grid */}
      <Windows11DesktopIcons onOpenApp={handleOpenApp} profile={candidateProfile} />

      {/* 3. MULTI-APP WINDOW MANAGER (Floating Movable & Resizable Windows) */}

      {/* APP 1: 🤖 Personal AI Chatbot Window */}
      <WindowFrame
        id={appWindows.ai_chat.id}
        title="Personal AI — Sahil's Assistant"
        icon={appWindows.ai_chat.icon}
        isOpen={appWindows.ai_chat.isOpen}
        isMinimized={appWindows.ai_chat.isMinimized}
        isMaximized={appWindows.ai_chat.isMaximized}
        zIndex={appWindows.ai_chat.zIndex}
        badge={appWindows.ai_chat.badge}
        defaultPosition={appWindows.ai_chat.defaultPosition}
        onClose={() => handleCloseApp('ai_chat')}
        onMinimize={() => handleMinimizeApp('ai_chat')}
        onMaximize={() => handleMaximizeApp('ai_chat')}
        onFocus={() => handleFocusApp('ai_chat')}
      >
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <ChatWindow
            conversations={conversations}
            activeConvId={activeConvId}
            onSelectConversation={handleSelectConv}
            onNewChat={handleNewChat}
            onDeleteConversation={handleDeleteConv}
            messages={activeConv?.messages || []}
            isThinking={isThinking}
            onSendMessage={handleSendMessage}
            onRegenerateLastMessage={handleRegenerateLastMessage}
            onCopyMessage={handleCopyMessage}
            onDownloadResume={handleDownloadResume}
            copiedId={copiedId}
            profile={candidateProfile}
          />
        </div>
      </WindowFrame>

      {/* APP 2: 📄 Resume App Window */}
      <WindowFrame
        id={appWindows.resume.id}
        title={`${(candidateProfile?.name || 'Sahil_Singh').replace(/\s+/g, '_')}_Resume.pdf — Candidate Document Viewer`}
        icon={appWindows.resume.icon}
        isOpen={appWindows.resume.isOpen}
        isMinimized={appWindows.resume.isMinimized}
        isMaximized={appWindows.resume.isMaximized}
        zIndex={appWindows.resume.zIndex}
        defaultPosition={appWindows.resume.defaultPosition}
        onClose={() => handleCloseApp('resume')}
        onMinimize={() => handleMinimizeApp('resume')}
        onMaximize={() => handleMaximizeApp('resume')}
        onFocus={() => handleFocusApp('resume')}
      >
        <SectionDetailView
          activeTab="resume"
          onAskAboutSection={handleSendMessage}
          onDownloadResume={handleDownloadResume}
          profile={candidateProfile}
        />
      </WindowFrame>

      {/* APP 3: 💼 Projects App Window */}
      <WindowFrame
        id={appWindows.projects.id}
        title="Projects Explorer — Featured AI & Full-Stack Code"
        icon={appWindows.projects.icon}
        isOpen={appWindows.projects.isOpen}
        isMinimized={appWindows.projects.isMinimized}
        isMaximized={appWindows.projects.isMaximized}
        zIndex={appWindows.projects.zIndex}
        defaultPosition={appWindows.projects.defaultPosition}
        onClose={() => handleCloseApp('projects')}
        onMinimize={() => handleMinimizeApp('projects')}
        onMaximize={() => handleMaximizeApp('projects')}
        onFocus={() => handleFocusApp('projects')}
      >
        <SectionDetailView
          activeTab="projects"
          onAskAboutSection={handleSendMessage}
          onDownloadResume={handleDownloadResume}
          profile={candidateProfile}
        />
      </WindowFrame>

      {/* APP 4: 🧠 Skills App Window */}
      <WindowFrame
        id={appWindows.skills.id}
        title="Technical Skills Matrix — Languages & LLM Stack"
        icon={appWindows.skills.icon}
        isOpen={appWindows.skills.isOpen}
        isMinimized={appWindows.skills.isMinimized}
        isMaximized={appWindows.skills.isMaximized}
        zIndex={appWindows.skills.zIndex}
        defaultPosition={appWindows.skills.defaultPosition}
        onClose={() => handleCloseApp('skills')}
        onMinimize={() => handleMinimizeApp('skills')}
        onMaximize={() => handleMaximizeApp('skills')}
        onFocus={() => handleFocusApp('skills')}
      >
        <SectionDetailView
          activeTab="skills"
          onAskAboutSection={handleSendMessage}
          onDownloadResume={handleDownloadResume}
          profile={candidateProfile}
        />
      </WindowFrame>

      {/* APP 5: 📊 JD Match Analyzer App Window */}
      <WindowFrame
        id={appWindows.jd_match.id}
        title="Job Description Matcher & AI Gap Analyzer"
        icon={appWindows.jd_match.icon}
        isOpen={appWindows.jd_match.isOpen}
        isMinimized={appWindows.jd_match.isMinimized}
        isMaximized={appWindows.jd_match.isMaximized}
        zIndex={appWindows.jd_match.zIndex}
        badge={appWindows.jd_match.badge}
        defaultPosition={appWindows.jd_match.defaultPosition}
        onClose={() => handleCloseApp('jd_match')}
        onMinimize={() => handleMinimizeApp('jd_match')}
        onMaximize={() => handleMaximizeApp('jd_match')}
        onFocus={() => handleFocusApp('jd_match')}
      >
        <JobMatchAppView profile={candidateProfile} />
      </WindowFrame>



      {/* APP 7: 📬 Contact Me App Window */}
      <WindowFrame
        id={appWindows.contact.id}
        title={`Contact ${candidateProfile?.name || 'Sahil Singh'} — Candidate Profile`}
        icon={appWindows.contact.icon}
        isOpen={appWindows.contact.isOpen}
        isMinimized={appWindows.contact.isMinimized}
        isMaximized={appWindows.contact.isMaximized}
        zIndex={appWindows.contact.zIndex}
        defaultPosition={appWindows.contact.defaultPosition}
        onClose={() => handleCloseApp('contact')}
        onMinimize={() => handleMinimizeApp('contact')}
        onMaximize={() => handleMaximizeApp('contact')}
        onFocus={() => handleFocusApp('contact')}
      >
        <ContactAppView
          onAskAI={handleSendMessage}
          onDownloadResume={handleDownloadResume}
          profile={candidateProfile}
        />
      </WindowFrame>

      {/* 4. Windows 11 Centered Bottom Taskbar */}
      <Windows11Taskbar
        isStartMenuOpen={isStartMenuOpen}
        onToggleStartMenu={() => setIsStartMenuOpen(!isStartMenuOpen)}
        openApps={taskbarAppsList}
        onAppTaskbarClick={handleTaskbarClick}
        onOpenQuickSettings={() => setIsQuickSettingsOpen(!isQuickSettingsOpen)}
        isQuickSettingsOpen={isQuickSettingsOpen}
      />

      {/* 5. Windows 11 Start Menu Popup */}
      <Windows11StartMenu
        isOpen={isStartMenuOpen}
        onClose={() => setIsStartMenuOpen(false)}
        onOpenApp={handleOpenApp}
        onResetSession={handleClearAllChats}
        profile={candidateProfile}
      />

      {/* 6. Windows 11 Quick Settings Overlay */}
      <Windows11QuickSettings
        isOpen={isQuickSettingsOpen}
        onClose={() => setIsQuickSettingsOpen(false)}
        theme={settings.theme}
        onToggleTheme={() =>
          setSettings((s) => ({ ...s, theme: s.theme === 'dark' ? 'light' : 'dark' }))
        }
      />

      {/* 7. Toast Notification Stack */}
      <NotificationToast toasts={toasts} onDismiss={handleDismissToast} />
    </div>
  );
}
