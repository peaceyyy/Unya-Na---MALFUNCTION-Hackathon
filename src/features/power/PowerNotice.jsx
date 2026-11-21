import React from 'react';
import { usePower } from '../../app/context/PowerContext';

function clock(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = String(totalSeconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

// The utility's announcement and, during the blackout, the restoration countdown.
// It sits above the flashlight overlay (z-50) so it can still be read in the dark.
export default function PowerNotice() {
  const { phase, utility, secondsLeft } = usePower();
  if (phase === 'on') return null;

  const out = phase === 'out';

  return (
    <div
      role={out ? 'alert' : 'status'}
      aria-live={out ? 'assertive' : 'polite'}
      data-power-phase={phase}
      className={`fixed left-1/2 top-16 z-[60] w-[min(92vw,24rem)] -translate-x-1/2 rounded-xl border-2 px-4 py-3 shadow-lg ${
        out
          ? 'border-amber-400 bg-slate-900 text-amber-100 shadow-[0_0_24px_rgba(251,191,36,0.35)]'
          : 'border-amber-500 bg-amber-50 text-amber-950'
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-base font-bold ${
            out ? 'bg-amber-400 text-slate-900' : 'bg-amber-500 text-white'
          }`}
          aria-hidden="true"
        >
          {out ? '⏻' : '!'}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-widest opacity-80">
            {utility} {out ? 'outage' : 'advisory'}
          </p>
          {out ? (
            <p className="mt-0.5 text-sm font-medium leading-snug">
              Power is out. Restoration in{' '}
              <span className="tnum font-bold">{clock(secondsLeft)}</span>. The light switch is
              locked until then.
            </p>
          ) : (
            <p className="mt-0.5 text-sm font-medium leading-snug">
              Scheduled power interruption in{' '}
              <span className="tnum font-bold">{clock(secondsLeft)}</span>. Please save your work.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
