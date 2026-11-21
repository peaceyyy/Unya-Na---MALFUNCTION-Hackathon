import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

export default function Navbar() {
  const { isFlashlight, toggleTheme } = useTheme();
  const [sessionSeconds, setSessionSeconds] = useState(384); // 6m 24s

  useEffect(() => {
    const interval = setInterval(() => {
      setSessionSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatSessionTime = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const handleToggle = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    toggleTheme({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });
  };

  return (
    <header className="flex h-13 w-full shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/90 px-6 backdrop-blur-md z-40 select-none">
      {/* Brand & System Architecture */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2.5">
          {/* Bespoke Geometric Mark */}
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1752F0] text-white shadow-sm">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 4v9a7 7 0 0 0 14 0V4" />
              <path d="M19 19h-6" strokeWidth="2" strokeDasharray="2 2" />
            </svg>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-sm font-bold tracking-tight text-slate-900">
              Unya na
            </span>
            <span className="font-mono text-[11px] text-slate-600">
              v0.9.4
            </span>
          </div>
        </div>

        <div className="h-4 w-px bg-slate-200 hidden md:block" />

        {/* Live System State */}
        <div className="hidden md:flex items-center gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#1752F0]" />
            <span className="font-medium text-slate-700">Status: Dormant</span>
          </div>

          <span className="text-slate-300">•</span>

          <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-500">
            <span>Session Inactivity:</span>
            <span className="font-semibold text-slate-800">{formatSessionTime(sessionSeconds)}</span>
          </div>
        </div>
      </div>

      {/* Right Controls & Utilities */}
      <div className="flex items-center gap-3">
        <div className="hidden lg:flex items-center gap-2 text-[11px] font-mono text-slate-600 bg-slate-100/80 px-2.5 py-1 rounded-md border border-slate-200/60">
          <kbd className="font-sans font-semibold text-slate-700">⌘D</kbd>
          <span>Defer All</span>
        </div>

        {/* Flashlight Theme Switcher */}
        <button
          type="button"
          data-theme-toggle="true"
          onClick={handleToggle}
          aria-label="Toggle flashlight dark mode"
          className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1752F0] active:scale-95 cursor-pointer ${
            isFlashlight
              ? 'border-slate-800 bg-slate-900 text-white shadow-sm'
              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:text-slate-900'
          }`}
          title={isFlashlight ? 'Switch to daylight view' : 'Toggle flashlight dark room'}
        >
          {isFlashlight ? (
            <>
              <svg className="h-3.5 w-3.5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
              <span>Flashlight Active</span>
            </>
          ) : (
            <>
              <svg className="h-3.5 w-3.5 text-[#1752F0]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
              <span>Flashlight Mode</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}
