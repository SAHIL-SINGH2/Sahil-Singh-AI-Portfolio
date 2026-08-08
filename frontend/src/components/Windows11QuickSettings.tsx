import React, { useState } from 'react';
import { 
  Wifi, 
  Bluetooth, 
  Moon, 
  Sun, 
  Volume2, 
  Battery, 
  Settings, 
  Sliders, 
  ShieldCheck,
  Zap
} from 'lucide-react';

interface Windows11QuickSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const Windows11QuickSettings: React.FC<Windows11QuickSettingsProps> = ({
  isOpen,
  onClose,
  theme,
  onToggleTheme,
}) => {
  const [volume, setVolume] = useState(80);
  const [isWifiOn, setIsWifiOn] = useState(true);
  const [isBluetoothOn, setIsBluetoothOn] = useState(true);
  const [isBatterySaverOn, setIsBatterySaverOn] = useState(false);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-transparent" onClick={onClose} />
      <div
        id="win11-quick-settings"
        className="fixed bottom-14 right-3 w-80 bg-white/85 dark:bg-[#202020]/90 backdrop-blur-2xl border border-white/40 dark:border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] z-50 p-4 space-y-4 text-slate-800 dark:text-slate-100 window-enter select-none"
      >
        {/* Toggle Grid */}
        <div className="grid grid-cols-3 gap-2">
          {/* Wi-Fi Toggle */}
          <button
            onClick={() => setIsWifiOn(!isWifiOn)}
            className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
              isWifiOn
                ? 'bg-[#0078d4] text-white border-blue-500 shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
            }`}
          >
            <Wifi className="w-5 h-5 mb-1" />
            <span className="text-[11px] font-medium">Wi-Fi</span>
            <span className="text-[9px] opacity-80">{isWifiOn ? 'Connected' : 'Off'}</span>
          </button>

          {/* Bluetooth Toggle */}
          <button
            onClick={() => setIsBluetoothOn(!isBluetoothOn)}
            className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
              isBluetoothOn
                ? 'bg-[#0078d4] text-white border-blue-500 shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
            }`}
          >
            <Bluetooth className="w-5 h-5 mb-1" />
            <span className="text-[11px] font-medium">Bluetooth</span>
            <span className="text-[9px] opacity-80">{isBluetoothOn ? 'On' : 'Off'}</span>
          </button>

          {/* Theme Mode Toggle */}
          <button
            onClick={onToggleTheme}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-[#0078d4] transition-all"
          >
            {theme === 'dark' ? (
              <Moon className="w-5 h-5 mb-1 text-purple-400" />
            ) : (
              <Sun className="w-5 h-5 mb-1 text-amber-500" />
            )}
            <span className="text-[11px] font-medium">Theme</span>
            <span className="text-[9px] opacity-80 uppercase">{theme}</span>
          </button>

          {/* Battery Saver */}
          <button
            onClick={() => setIsBatterySaverOn(!isBatterySaverOn)}
            className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
              isBatterySaverOn
                ? 'bg-[#0078d4] text-white border-blue-500 shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
            }`}
          >
            <Zap className="w-5 h-5 mb-1 text-amber-300" />
            <span className="text-[11px] font-medium font-sans">Battery Saver</span>
            <span className="text-[9px] opacity-80">{isBatterySaverOn ? 'Active' : 'Off'}</span>
          </button>

          {/* AI Guard */}
          <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-slate-700">
            <ShieldCheck className="w-5 h-5 mb-1" />
            <span className="text-[11px] font-medium">AI Agent</span>
            <span className="text-[9px] opacity-80">Protected</span>
          </div>

          {/* Equalizer */}
          <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            <Sliders className="w-5 h-5 mb-1 text-blue-500" />
            <span className="text-[11px] font-medium">Audio HD</span>
            <span className="text-[9px] opacity-80">Spatial</span>
          </div>
        </div>

        {/* Sliders */}
        <div className="space-y-3 pt-2">
          {/* Volume Control */}
          <div className="flex items-center gap-3">
            <Volume2 className="w-4 h-4 text-slate-500" />
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="flex-1 accent-[#0078d4] h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
            />
            <span className="text-xs font-mono w-8 text-right">{volume}%</span>
          </div>
        </div>

        {/* Quick Settings Footer */}
        <div className="pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Battery className="w-4 h-4 text-emerald-500" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">98% Remaining</span>
          </div>
        </div>
      </div>
    </>
  );
};
