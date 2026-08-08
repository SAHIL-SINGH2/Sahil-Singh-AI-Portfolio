import React from 'react';
import { 
  Settings, 
  Moon, 
  Sun, 
  Palette, 
  Trash2, 
  Cpu, 
  ShieldCheck, 
  Volume2, 
  Sparkles, 
  HardDrive,
  RefreshCw,
  Globe
} from 'lucide-react';
import { AppSettings, Conversation } from '../types';

interface SettingsAppViewProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  conversations: Conversation[];
  onClearChats: () => void;
}

const ACCENT_COLORS = [
  { name: 'Windows Blue', value: '#0078d4' },
  { name: 'Emerald Teal', value: '#10b981' },
  { name: 'Purple Ray', value: '#8b5cf6' },
  { name: 'Rose Red', value: '#f43f5e' },
  { name: 'Amber Gold', value: '#f59e0b' },
  { name: 'Cyan Sky', value: '#06b6d4' },
];

export const SettingsAppView: React.FC<SettingsAppViewProps> = ({
  settings,
  onUpdateSettings,
  conversations,
  onClearChats,
}) => {
  return (
    <div className="p-3 sm:p-6 max-w-4xl mx-auto h-full overflow-y-auto space-y-4 sm:space-y-6 window-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3 sm:pb-4 gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-500/10 text-slate-700 dark:text-slate-300 text-[10px] font-bold uppercase tracking-wider border border-slate-300 dark:border-white/20 mb-1">
            System Control Center
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            Windows 11 OS Settings & System Preferences
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Customize visual theme, accent colors, AI model streaming, and chat memory
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* System & Appearance */}
        <div className="space-y-4">
          <div className="bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-2xl p-5 space-y-4 shadow-xl">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-white/10 pb-2">
              <Palette className="w-4 h-4 text-cyan-600 dark:text-cyan-400" /> Visual Theme & Accent Colors
            </h3>

            {/* Dark / Light Mode */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">System Theme Mode</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Select preferred OS appearance</span>
              </div>
              <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-white/15">
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ theme: 'dark' })}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    settings.theme === 'dark'
                      ? 'bg-cyan-600 text-white shadow-md'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" /> Dark
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ theme: 'light' })}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    settings.theme === 'light'
                      ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" /> Light
                </button>
              </div>
            </div>

            {/* Accent Color Palette */}
            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-white/10">
              <span className="text-xs font-bold text-slate-900 dark:text-white block">Windows Accent Color</span>
              <div className="flex flex-wrap gap-2.5">
                {ACCENT_COLORS.map((col) => (
                  <button
                    key={col.value}
                    onClick={() => onUpdateSettings({ accentColor: col.value })}
                    className={`w-7 h-7 rounded-full transition-transform flex items-center justify-center ${
                      settings.accentColor === col.value ? 'scale-110 ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 ring-cyan-500' : 'hover:scale-105 opacity-80 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: col.value }}
                    title={col.name}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* AI Intelligence Config */}
          <div className="bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-2xl p-5 space-y-4 shadow-xl">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-white/10 pb-2">
              <Sparkles className="w-4 h-4 text-purple-500" /> AI Engine Configuration
            </h3>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">Real-time Streaming</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Stream tokens char-by-char</span>
              </div>
              <input
                type="checkbox"
                checked={settings.streamingEnabled}
                onChange={(e) => onUpdateSettings({ streamingEnabled: e.target.checked })}
                className="w-4 h-4 accent-[#0078d4] cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-white/10">
              <div>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">Auto-scroll Chat</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Scroll to newest AI responses</span>
              </div>
              <input
                type="checkbox"
                checked={settings.autoScroll}
                onChange={(e) => onUpdateSettings({ autoScroll: e.target.checked })}
                className="w-4 h-4 accent-[#0078d4] cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Storage & System Stats */}
        <div className="space-y-4">
          {/* System Environment Specs */}
          <div className="bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-2xl p-5 space-y-3 shadow-xl">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-white/10 pb-2">
              <Cpu className="w-4 h-4 text-emerald-500" /> System Specifications
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200 dark:border-white/10">
                <span className="text-slate-500 dark:text-slate-400">OS Edition</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">Windows 11 Pro AI Edition</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200 dark:border-white/10">
                <span className="text-slate-500 dark:text-slate-400">AI Engine</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">Gemini 3.6 Flash Server Proxy</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200 dark:border-white/10">
                <span className="text-slate-500 dark:text-slate-400">Candidate Data</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">Sahil Sharma (Verified Profile)</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500 dark:text-slate-400">Security Status</span>
                <span className="font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-500" /> Sandboxed & Protected
                </span>
              </div>
            </div>
          </div>

          {/* Reset & Storage */}
          <div className="bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-2xl p-5 space-y-4 shadow-xl">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-white/10 pb-2">
              <HardDrive className="w-4 h-4 text-rose-500" /> Data Storage & Reset
            </h3>

            <div className="flex items-center justify-between text-xs">
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200 block">Saved Conversations</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">{conversations.length} conversation session(s) active</span>
              </div>
              <button
                onClick={onClearChats}
                className="win-btn py-1.5 px-3 text-xs text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-500/10 flex items-center gap-1.5 font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear History
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
