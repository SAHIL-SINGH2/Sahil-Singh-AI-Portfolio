import React, { useState, useEffect } from 'react';
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
  LayoutGrid
} from 'lucide-react';

export interface TaskbarAppInfo {
  id: string;
  name: string;
  icon: any;
  isOpen: boolean;
  isMinimized: boolean;
  isFocused: boolean;
  color: string;
}

interface Windows11TaskbarProps {
  isStartMenuOpen: boolean;
  onToggleStartMenu: () => void;
  openApps: TaskbarAppInfo[];
  onAppTaskbarClick: (appId: string) => void;
  onOpenQuickSettings: () => void;
  isQuickSettingsOpen: boolean;
}

export const Windows11Taskbar: React.FC<Windows11TaskbarProps> = ({
  isStartMenuOpen,
  onToggleStartMenu,
  openApps,
  onAppTaskbarClick,
  onOpenQuickSettings,
  isQuickSettingsOpen,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
      setCurrentDate(
        now.toLocaleDateString([], { month: 'numeric', day: 'numeric', year: 'numeric' })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <footer 
      id="win11-taskbar"
      className="fixed bottom-0 left-0 right-0 h-12 bg-white/75 dark:bg-[#1a1a1a]/85 backdrop-blur-2xl border-t border-white/40 dark:border-white/10 z-50 flex items-center justify-between px-3 select-none transition-colors duration-200 shadow-xl"
    >
      {/* Left side Widget & Weather */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={onToggleStartMenu}
          className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs text-slate-700 dark:text-slate-300 hover:bg-white/40 dark:hover:bg-white/10 transition-colors"
          title="Widgets & Weather"
        >
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-medium hidden md:inline text-[11px]">22°C Clear</span>
        </button>
      </div>
      <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-xl border border-black/5 dark:border-white/5 backdrop-blur-md max-w-[55vw] sm:max-w-[60vw] overflow-x-auto no-scrollbar">
        {/* Windows 11 Start Menu Button */}
        <button
          onClick={onToggleStartMenu}
          id="win11-start-button"
          className={`relative p-2 rounded-lg transition-all duration-150 group ${
            isStartMenuOpen
              ? 'bg-white/80 dark:bg-white/20 shadow-sm scale-95'
              : 'hover:bg-white/60 dark:hover:bg-white/10 hover:scale-105'
          }`}
          title="Start Menu"
        >
          <div className="grid grid-cols-2 gap-[2px] w-4 h-4">
            <div className="bg-[#00adef] rounded-[1px] group-hover:bg-[#0078d4] transition-colors" />
            <div className="bg-[#00adef] rounded-[1px] group-hover:bg-[#0078d4] transition-colors" />
            <div className="bg-[#00adef] rounded-[1px] group-hover:bg-[#0078d4] transition-colors" />
            <div className="bg-[#00adef] rounded-[1px] group-hover:bg-[#0078d4] transition-colors" />
          </div>
        </button>

        {/* Search Icon */}
        <button
          onClick={onToggleStartMenu}
          className="p-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-white/60 dark:hover:bg-white/10 hover:scale-105 transition-all duration-150"
          title="Search Apps & Files"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Task View */}
        <button
          onClick={onToggleStartMenu}
          className="p-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-white/60 dark:hover:bg-white/10 hover:scale-105 transition-all duration-150"
          title="Task View"
        >
          <LayoutGrid className="w-4 h-4 text-sky-500 dark:text-sky-400" />
        </button>

        <div className="w-[1px] h-5 bg-slate-400/30 dark:bg-slate-600/40 mx-1" />

        {/* Dynamic App Taskbar Shortcuts */}
        {openApps.map((app) => {
          const Icon = app.icon;
          return (
            <button
              key={app.id}
              onClick={() => onAppTaskbarClick(app.id)}
              id={`win11-taskbar-app-${app.id}`}
              className={`relative p-2 rounded-lg transition-all duration-150 flex items-center justify-center ${
                app.isOpen && !app.isMinimized && app.isFocused
                  ? 'bg-white/90 dark:bg-white/20 shadow-sm scale-105'
                  : app.isOpen && !app.isMinimized
                  ? 'bg-white/60 dark:bg-white/10 hover:bg-white/80 dark:hover:bg-white/15'
                  : 'hover:bg-white/50 dark:hover:bg-white/10 opacity-80 hover:opacity-100 hover:scale-105'
              }`}
              title={app.name}
            >
              <div
                className={`w-5 h-5 rounded-md flex items-center justify-center text-white shadow-sm ${app.color}`}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>

              {/* Windows 11 Active Indicator Dot/Line */}
              {app.isOpen && !app.isMinimized ? (
                <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-1 bg-[#0078d4] rounded-full shadow-[0_0_6px_#0078d4]" />
              ) : app.isOpen && app.isMinimized ? (
                <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full" />
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Right Side System Tray */}
      <div className="flex items-center shrink-0 justify-end text-slate-700 dark:text-slate-200 text-xs">
        {/* System Time & Date */}
        <button
          onClick={onToggleStartMenu}
          className="px-2 py-1 rounded-lg hover:bg-white/50 dark:hover:bg-white/10 transition-colors text-right leading-tight"
          title="Clock & Calendar"
        >
          <div className="font-semibold text-[10px] sm:text-[11px]">{currentTime || '11:00 AM'}</div>
          <div className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 hidden sm:block">{currentDate || '5/7/2026'}</div>
        </button>
      </div>
    </footer>
  );
};
