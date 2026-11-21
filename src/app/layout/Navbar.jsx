import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useOpacity } from '../context/OpacityContext';
import SakugaSlider from '../components/SakugaSlider';
import LightSwitch from '../components/LightSwitch';
import JustDanceButton from '../../features/dance/JustDanceButton';
import { usePower } from '../context/PowerContext';
import SakugaButton from '../components/SakugaButton';
import { loadSakuga } from '../components/sakugaLoader';

function formatDuration(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export default function Navbar({ onLogout }) {
  const { isFlashlight, toggleTheme, isLocked } = useTheme();
  const { phase, utility } = usePower();

  useEffect(() => {
    loadSakuga('button');
  }, []);
  const { opacity } = useOpacity();
  const [idleSeconds, setIdleSeconds] = useState(0);
  const lastActivityRef = useRef(Date.now());

  useEffect(() => {
    const resetActivity = () => {
      lastActivityRef.current = Date.now();
      setIdleSeconds(0);
    };

    const events = ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart'];
    events.forEach((evt) => window.addEventListener(evt, resetActivity, { passive: true }));

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - lastActivityRef.current) / 1000);
      setIdleSeconds(elapsed);
    }, 1000);

    return () => {
      clearInterval(interval);
      events.forEach((evt) => window.removeEventListener(evt, resetActivity));
    };
  }, []);

  return (
    <header className="relative flex h-14 w-full shrink-0 items-center justify-between border-b border-border bg-surface px-6 z-40">
      {/* Left: Branding & Session Inactivity */}
      <div className="flex items-center gap-5">
        <a
          href="#"
          className="flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          aria-label="Unya na Home"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-white">
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 4v9a7 7 0 0 0 14 0V4" />
              <path d="M19 19h-6" strokeWidth="2" strokeDasharray="2 2" />
            </svg>
          </span>
          <span className="font-display text-lg font-bold tracking-tight text-ink">
            Unya na
          </span>
        </a>

        <div className="hidden sm:block h-4 w-px bg-border" aria-hidden="true" />

        <div
          className="hidden sm:flex items-center gap-1.5 text-xs text-ink-secondary"
          title="Resets whenever you move, click, or type"
        >
          <span>Session inactivity:</span>
          <span className="font-semibold text-ink tnum">
            {formatDuration(idleSeconds)}
          </span>
        </div>
      </div>

      {/* Top Center: Sakuga VFX Opacity Indicator (visual cue only) */}
      <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none select-none z-10">
        <SakugaSlider
          value={opacity}
          label="Interface Opacity"
          readOnly
        />
      </div>

      {/* Right: Tactile Physical Light Switch & Status */}
      <div className="flex items-center gap-5">
        <JustDanceButton />
        <div
          className="hidden sm:flex items-center gap-2 text-xs font-medium text-ink-secondary"
          title={isFlashlight ? 'Room lights are OFF (Flashlight active)' : 'Room lights are ON (Daylight view)'}
        >
          {phase === 'out' ? (
            <>
              <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              <span>{utility} outage</span>
            </>
          ) : isFlashlight ? (
            <>
              <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              <span>Flashlight Active</span>
            </>
          ) : (
            <>
              <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
              <span>Daylight View</span>
            </>
          )}
        </div>

        <div data-theme-toggle="true" className="flex items-center">
          <LightSwitch
            isFlashlight={isFlashlight}
            onToggle={toggleTheme}
            disabled={isLocked}
            disabledReason={`No power. ${utility || 'The utility'} has to restore it first.`}
          />
        </div>

        {onLogout && (
          // The Sakuga button is taller than the navbar, so it is scaled down like the
          // Just dance button next to it.
          <div
            className="relative flex h-9 w-[81px] shrink-0 items-center justify-end"
            title="Log out back to login screen"
          >
            <div style={{ transform: 'scale(0.6)', transformOrigin: 'right center', flex: 'none' }}>
              <SakugaButton variant="secondary" onClick={onLogout} label="Log out">
                Log out
              </SakugaButton>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
