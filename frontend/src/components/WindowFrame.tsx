import React, { useState, useRef, useEffect } from 'react';
import { Minus, Square, Copy, X, LucideIcon } from 'lucide-react';

interface WindowFrameProps {
  id: string;
  title: string;
  icon: LucideIcon;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  defaultPosition?: { x: number; y: number; width: number; height: number };
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onFocus: () => void;
  children: React.ReactNode;
  badge?: string;
}

export const WindowFrame: React.FC<WindowFrameProps> = ({
  id,
  title,
  icon: Icon,
  isOpen,
  isMinimized,
  isMaximized,
  zIndex,
  defaultPosition = { x: 40, y: 30, width: 850, height: 600 },
  onClose,
  onMinimize,
  onMaximize,
  onFocus,
  children,
  badge,
}) => {
  // Window position and size state
  const [pos, setPos] = useState({
    x: defaultPosition.x,
    y: defaultPosition.y,
    width: defaultPosition.width,
    height: defaultPosition.height,
  });

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, initialX: 0, initialY: 0 });
  const resizeStartRef = useRef({ x: 0, y: 0, initialW: 0, initialH: 0 });

  // Handle Dragging via Titlebar
  const handlePointerDownHeader = (e: React.PointerEvent) => {
    if (isMaximized) return;
    onFocus();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      initialX: pos.x,
      initialY: pos.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMoveHeader = (e: React.PointerEvent) => {
    if (!isDragging || isMaximized) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    
    // Clamp to screen bounds
    const newX = Math.max(0, Math.min(window.innerWidth - 150, dragStartRef.current.initialX + dx));
    const newY = Math.max(0, Math.min(window.innerHeight - 100, dragStartRef.current.initialY + dy));

    setPos((prev) => ({
      ...prev,
      x: newX,
      y: newY,
    }));
  };

  const handlePointerUpHeader = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  // Handle Resizing via Bottom-Right Handle
  const handlePointerDownResize = (e: React.PointerEvent) => {
    if (isMaximized) return;
    e.stopPropagation();
    onFocus();
    setIsResizing(true);
    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      initialW: pos.width,
      initialH: pos.height,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMoveResize = (e: React.PointerEvent) => {
    if (!isResizing || isMaximized) return;
    const dx = e.clientX - resizeStartRef.current.x;
    const dy = e.clientY - resizeStartRef.current.y;

    const minW = Math.min(300, windowSize.width - 16);
    const newW = Math.max(minW, Math.min(window.innerWidth - pos.x - 10, resizeStartRef.current.initialW + dx));
    const newH = Math.max(220, Math.min(window.innerHeight - pos.y - 60, resizeStartRef.current.initialH + dy));

    setPos((prev) => ({
      ...prev,
      width: newW,
      height: newH,
    }));
  };

  const handlePointerUpResize = (e: React.PointerEvent) => {
    if (isResizing) {
      setIsResizing(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
    }
  };


  // Track screen size for responsive bounds
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobileScreen = windowSize.width < 768;

  if (!isOpen || isMinimized) return null;

  // Compute responsive layout coordinates
  let layoutStyle: React.CSSProperties = { zIndex };

  if (isMaximized || isMobileScreen) {
    layoutStyle = {
      ...layoutStyle,
      left: isMobileScreen ? '4px' : '0px',
      top: isMobileScreen ? '4px' : '0px',
      width: isMobileScreen ? 'calc(100vw - 8px)' : '100vw',
      height: isMobileScreen ? 'calc(100dvh - 56px)' : 'calc(100vh - 48px)',
    };
  } else {
    const safeWidth = Math.min(pos.width, windowSize.width - 16);
    const safeHeight = Math.min(pos.height, windowSize.height - 60);
    const safeX = Math.max(8, Math.min(pos.x, windowSize.width - safeWidth - 8));
    const safeY = Math.max(8, Math.min(pos.y, windowSize.height - safeHeight - 52));

    layoutStyle = {
      ...layoutStyle,
      left: `${safeX}px`,
      top: `${safeY}px`,
      width: `${safeWidth}px`,
      height: `${safeHeight}px`,
    };
  }

  return (
    <div
      id={`win11-app-${id}`}
      onClick={onFocus}
      style={layoutStyle}
      className={`fixed transition-all duration-75 flex flex-col overflow-hidden bg-slate-100 dark:bg-[#12131c] text-slate-900 dark:text-slate-100 backdrop-blur-2xl border border-slate-300 dark:border-white/20 shadow-[0_24px_60px_rgba(0,0,0,0.25)] dark:shadow-[0_24px_60px_rgba(0,0,0,0.6)] rounded-xl select-none ${
        isMaximized || isMobileScreen ? 'rounded-lg' : 'window-enter'
      }`}
    >
      {/* Title Bar Header */}
      <div
        onPointerDown={handlePointerDownHeader}
        onPointerMove={handlePointerMoveHeader}
        onPointerUp={handlePointerUpHeader}
        onDoubleClick={onMaximize}
        className="h-9 bg-slate-200/95 dark:bg-[#1f202d]/95 backdrop-blur-xl border-b border-slate-300 dark:border-white/10 flex items-center justify-between px-3 cursor-grab active:cursor-grabbing select-none"
      >
        {/* Left App Info */}
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
          <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center shadow-md flex-shrink-0">
            <Icon className="w-3.5 h-3.5" />
          </div>
          <span className="truncate tracking-wide">{title}</span>
          {badge && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 font-bold border border-cyan-500/30">
              {badge}
            </span>
          )}
        </div>

        {/* Right Window Controls */}
        <div className="flex items-center -mr-3 h-full">
          {/* Minimize */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMinimize();
            }}
            className="h-full px-3.5 hover:bg-slate-300/80 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 transition-colors flex items-center justify-center"
            title="Minimize"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          {/* Maximize/Restore */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMaximize();
            }}
            className="h-full px-3.5 hover:bg-slate-300/80 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 transition-colors flex items-center justify-center"
            title={isMaximized ? 'Restore Down' : 'Maximize'}
          >
            {isMaximized ? (
              <Copy className="w-3.5 h-3.5 rotate-180" />
            ) : (
              <Square className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Close */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="h-full px-3.5 hover:bg-rose-600 hover:text-white text-slate-700 dark:text-slate-300 transition-colors flex items-center justify-center"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Window Content Container */}
      <div className="flex-1 overflow-hidden relative flex flex-col bg-slate-50 dark:bg-[#161722] text-slate-900 dark:text-slate-100">
        {children}
      </div>

      {/* Resize Grip Handle (Bottom Right) */}
      {!isMaximized && (
        <div
          onPointerDown={handlePointerDownResize}
          onPointerMove={handlePointerMoveResize}
          onPointerUp={handlePointerUpResize}
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize z-50 flex items-end justify-end p-0.5 opacity-50 hover:opacity-100"
        >
          <div className="w-2 h-2 border-r-2 border-b-2 border-slate-400" />
        </div>
      )}
    </div>
  );
};
