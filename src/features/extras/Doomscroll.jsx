import React, { useState, useEffect, useRef } from 'react';
import ReelsPlayer from './ReelsPlayer';
import { useMovable } from '../../app/hooks/useMovable';

const MODE_KEY = 'unproductive_doomscroll_mode';
const MODES = [
  { id: 'subway', label: 'Subway' },
  { id: 'reels', label: 'Reels' },
];

function readMode() {
  try {
    return localStorage.getItem(MODE_KEY) === 'reels' ? 'reels' : 'subway';
  } catch {
    return 'subway';
  }
}

export default function Doomscroll() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState(readMode);
  const move = useMovable('unproductive_pos_doomscroll');
  const tooltipRef = useRef(null);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Sync custom element click event with state toggle
  useEffect(() => {
    const el = tooltipRef.current;
    if (!el) return;

    const handleClick = () => {
      setIsOpen((prev) => !prev);
    };

    el.addEventListener('click', handleClick);
    return () => {
      el.removeEventListener('click', handleClick);
    };
  }, []);

  const chooseMode = (id) => {
    setMode(id);
    try {
      localStorage.setItem(MODE_KEY, id);
    } catch {
      // not remembering the choice is fine
    }
  };

  const handleClose = (e) => {
    e.stopPropagation();
    setIsOpen(false);
  };

  return (
    <aside
      ref={move.ref}
      aria-label="Doomscroll Corner"
      className={`fixed bottom-6 right-6 sm:bottom-8 sm:right-8 flex flex-col items-end select-none pointer-events-auto ${
        move.dragging ? '' : 'transition-all duration-300'
      } ${isOpen ? 'z-[60]' : 'z-40'}`}
    >
      {/* Pure Edge-to-Edge Looping Vertical Video (9:16 Aspect Ratio, No Borders) */}
      <div
        className={`group relative mb-3 overflow-hidden rounded-2xl shadow-2xl transition-all duration-300 ease-out origin-bottom-right ${
          isOpen
            ? 'w-[190px] sm:w-[210px] aspect-[9/16] opacity-100 scale-100 translate-y-0 pointer-events-auto'
            : 'w-[190px] sm:w-[210px] h-0 max-h-0 opacity-0 scale-95 translate-y-4 pointer-events-none'
        }`}
        role="dialog"
        aria-modal="false"
        aria-label="Doomscroll Video Player"
      >
        {isOpen && (
          <>
            {/* Drag the whole corner by this strip; double-click it to put the corner back */}
            <div
              data-drag-handle=""
              title="Drag to move. Double-click to put it back."
              aria-hidden="true"
              className="absolute inset-x-0 top-0 z-[5] flex h-11 cursor-grab touch-none items-start justify-center pt-1.5 active:cursor-grabbing"
            >
              <span className="h-1 w-8 rounded-full bg-white/60" />
            </div>

            {mode === 'reels' ? (
              <ReelsPlayer />
            ) : (
              <iframe
                className="h-full w-full border-0 block"
                src="https://www.youtube.com/embed/zZ7AimPACzc?playlist=zZ7AimPACzc&loop=1&autoplay=1&rel=0"
                title="Doomscroll Looping Vertical Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            )}

            {/* Pick what to doomscroll: always visible, top left */}
            <div
              role="group"
              aria-label="What to doomscroll"
              className="absolute left-2.5 top-2.5 z-10 flex rounded-full bg-black/55 p-0.5 backdrop-blur-md"
            >
              {MODES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  aria-pressed={mode === m.id}
                  onClick={() => chooseMode(m.id)}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                    mode === m.id ? 'bg-white text-slate-900' : 'text-white/80 hover:text-white'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Subtle floating close button visible on hover */}
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close doomscroll"
              className="absolute top-2.5 right-2.5 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white/90 hover:bg-black/80 hover:text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <svg
                className="h-3.5 w-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Floating Sakuga Tooltip Trigger Button */}
      <div data-drag-handle="interactive" className="relative flex items-center justify-center">
        <sakuga-tooltip
          ref={tooltipRef}
          text="Lock In"
          label="Lock In"
          title={isOpen ? 'Close Doomscroll' : 'Lock In Doomscroll'}
          style={{
            margin: 0,
            display: 'inline-flex',
            '--sk-pri': '#1752F0',
            '--sk-soft': '#bfdbfe',
            '--sk-ink': '#0f172a',
            '--sk-bw': '2.5px',
          }}
        >
          <span
            className="flex h-full w-full items-center justify-center text-slate-900 transition-transform hover:scale-110 active:scale-95"
            aria-hidden="true"
          >
            {isOpen ? (
              <svg
                className="h-4 w-4 text-slate-900"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg
                className="h-4 w-4 text-slate-900"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            )}
          </span>
        </sakuga-tooltip>
      </div>
    </aside>
  );
}
