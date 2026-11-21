import React, { useState, useEffect, useRef } from 'react';
import { playAirhorn } from '../common/soundEffects';

const PROTOCOLS = [
  {
    id: 'restoration-deep',
    name: 'Cognitive Restoration & Focus Burst',
    breakSeconds: 23 * 60 + 47, // 23:47
    workSeconds: 41,             // 00:41
    breakLabel: '23m 47s Rest',
    workLabel: '41s Sprint',
    description: 'Extended neurological decompression paired with targeted high-yield output.',
  },
  {
    id: 'micro-sprint',
    name: 'Precision Interval Protocol',
    breakSeconds: 11 * 60 + 39, // 11:39
    workSeconds: 23,             // 00:23
    breakLabel: '11m 39s Rest',
    workLabel: '23s Sprint',
    description: 'Calibrated recovery interval structured before an accelerated sprint.',
  },
  {
    id: 'ultradian-deep',
    name: 'Ultradian Deep Recovery',
    breakSeconds: 74 * 60 + 19, // 1h 14m 19s
    workSeconds: 17,             // 00:17
    breakLabel: '1h 14m 19s Rest',
    workLabel: '17s Sprint',
    description: 'Maximum restorative downtime followed by high-urgency execution.',
  },
  {
    id: 'adaptive-cadence',
    name: 'Adaptive Cadence Focus',
    breakSeconds: 37 * 60 + 13, // 37:13
    workSeconds: 31,             // 00:31
    breakLabel: '37m 13s Rest',
    workLabel: '31s Sprint',
    description: 'Optimized neuro-attunement baseline with focused delivery block.',
  },
];

function formatTime(totalSeconds) {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export default function ReversePomodoro() {
  const [activeSubtab, setActiveSubtab] = useState('timer'); // 'timer' | 'calibration' | 'logs'
  const [selectedProtocol, setSelectedProtocol] = useState(PROTOCOLS[0]);
  const [phase, setPhase] = useState('break'); // 'break' (Rest) | 'work' (Sprint)
  const [timeLeft, setTimeLeft] = useState(PROTOCOLS[0].breakSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [idleSeconds, setIdleSeconds] = useState(0);
  const [airhornTriggered, setAirhornTriggered] = useState(false);
  const [inactivityLogs, setInactivityLogs] = useState([]);
  const [systemNotice, setSystemNotice] = useState(null);
  const [focusNotes, setFocusNotes] = useState('');

  // Calibration activities
  const [surfaceCure, setSurfaceCure] = useState(14.8);
  const [pacingCount, setPacingCount] = useState(0);

  const lastActivityTimeRef = useRef(Date.now());
  const timerRef = useRef(null);
  const airhornCooldownRef = useRef(false);

  const showSystemNotice = (msg) => {
    setSystemNotice(msg);
    setTimeout(() => setSystemNotice(null), 4000);
  };

  // Activity detection
  useEffect(() => {
    const handleUserInteraction = () => {
      lastActivityTimeRef.current = Date.now();
      setIdleSeconds(0);
    };

    window.addEventListener('mousemove', handleUserInteraction);
    window.addEventListener('keydown', handleUserInteraction);
    window.addEventListener('scroll', handleUserInteraction);

    return () => {
      window.removeEventListener('mousemove', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
      window.removeEventListener('scroll', handleUserInteraction);
    };
  }, []);

  // Idle check every second: Punitive focus detection after 15s inactivity
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - lastActivityTimeRef.current) / 1000);
      setIdleSeconds(elapsed);

      if (elapsed >= 15 && !airhornCooldownRef.current) {
        airhornCooldownRef.current = true;
        playAirhorn();
        setAirhornTriggered(true);

        const newLog = {
          id: Date.now(),
          timestamp: new Date().toLocaleTimeString(),
          phase: phase === 'work' ? 'Active Focus Sprint' : 'Mandatory Recovery Phase',
          detail: '15 seconds without continuous cursor/input movement detected.',
          resolution: phase === 'work' ? '-10s Focus Quota Penalty' : 'Auditory Re-engagement Alert',
        };

        setInactivityLogs((prev) => [newLog, ...prev.slice(0, 19)]);

        if (phase === 'work') {
          setTimeLeft((prev) => Math.max(1, prev - 10));
        }

        setTimeout(() => setAirhornTriggered(false), 3500);
        setTimeout(() => {
          airhornCooldownRef.current = false;
        }, 5000);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [phase]);

  // Main countdown timer
  useEffect(() => {
    if (!isRunning) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (phase === 'break') {
            setPhase('work');
            showSystemNotice('Recovery phase complete. Focus sprint window initialized.');
            return selectedProtocol.workSeconds;
          } else {
            setPhase('break');
            showSystemNotice('Focus sprint concluded. Mandatory recovery cycle engaged.');
            return selectedProtocol.breakSeconds;
          }
        }
        return prev - 1;
      });
    }, 1000 / speedMultiplier);

    return () => clearInterval(timerRef.current);
  }, [isRunning, phase, selectedProtocol, speedMultiplier]);

  // Surface curing tick
  useEffect(() => {
    if (activeSubtab !== 'calibration') return;
    const interval = setInterval(() => {
      setSurfaceCure((prev) => (prev >= 99.9 ? 99.9 : +(prev + 0.03).toFixed(2)));
    }, 500);
    return () => clearInterval(interval);
  }, [activeSubtab]);

  const handleSelectProtocol = (p) => {
    setSelectedProtocol(p);
    setPhase('break');
    setTimeLeft(p.breakSeconds);
    setIsRunning(false);
  };

  const handleCustomIntervalClick = () => {
    showSystemNotice(
      'Custom interval modification is locked. Adherence to structured focus ratios is required.'
    );
  };

  const handleSkipBreakAttempt = () => {
    showSystemNotice(
      'Mandatory recovery interval in progress. Cognitive rest cannot be bypassed.'
    );
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Punitive Airhorn Alert Banner */}
      {airhornTriggered && (
        <div
          role="alert"
          className="flex items-center justify-between gap-4 rounded-2xl border-2 border-red-500 bg-red-50 px-6 py-4 text-red-900 shadow-md animate-bounce"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl" aria-hidden="true">
              📢
            </span>
            <div>
              <p className="font-display text-sm font-bold uppercase tracking-wider">
                Inactivity Alert: 15 Seconds of Stillness Detected
              </p>
              <p className="text-xs">
                Continuous engagement required during focus tracking.
                {phase === 'work' && ' Deducted 10 seconds from current work interval.'}
              </p>
            </div>
          </div>
          <span className="rounded-md bg-red-600 px-3 py-1 text-xs font-semibold text-white">
            Resume Activity
          </span>
        </div>
      )}

      {/* System Notice Toast */}
      {systemNotice && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-xl border border-border bg-surface px-4 py-2.5 text-xs font-medium text-ink shadow-sm"
        >
          {systemNotice}
        </div>
      )}

      {/* Internal Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-2">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveSubtab('timer')}
            className={`rounded-lg px-4 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              activeSubtab === 'timer'
                ? 'bg-accent text-white font-semibold'
                : 'bg-surface text-ink hover:bg-surface-subtle'
            }`}
          >
            ⏱ Focus & Recovery Engine
          </button>
          <button
            type="button"
            onClick={() => setActiveSubtab('calibration')}
            className={`rounded-lg px-4 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              activeSubtab === 'calibration'
                ? 'bg-accent text-white font-semibold'
                : 'bg-surface text-ink hover:bg-surface-subtle'
            }`}
          >
            🧠 Restorative Calibration
          </button>
          <button
            type="button"
            onClick={() => setActiveSubtab('logs')}
            className={`rounded-lg px-4 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              activeSubtab === 'logs'
                ? 'bg-accent text-white font-semibold'
                : 'bg-surface text-ink hover:bg-surface-subtle'
            }`}
          >
            📊 Inactivity Telemetry ({inactivityLogs.length})
          </button>
        </div>

        {/* Speed Multiplier for Demo */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-ink-muted">Simulation Speed:</span>
          <button
            type="button"
            onClick={() => setSpeedMultiplier((prev) => (prev === 1 ? 25 : 1))}
            className={`rounded-lg border border-border px-2.5 py-1 text-xs font-medium transition-colors ${
              speedMultiplier > 1
                ? 'bg-accent text-white font-bold'
                : 'bg-surface text-ink hover:bg-surface-subtle'
            }`}
          >
            {speedMultiplier > 1 ? '⚡ 25x Accelerated' : '1x Real-time'}
          </button>
        </div>
      </div>

      {/* VIEW 1: MAIN TIMER */}
      {activeSubtab === 'timer' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Clock Card */}
          <div className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-7 shadow-[0_1px_2px_rgba(31,28,23,0.04)] lg:col-span-2 space-y-6">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block h-3 w-3 rounded-full ${
                      phase === 'break' ? 'bg-accent animate-pulse' : 'bg-red-500 animate-ping'
                    }`}
                  />
                  <span className="font-display text-sm font-bold uppercase tracking-wider text-ink">
                    {phase === 'break'
                      ? 'Restorative Phase (Mandatory Interval)'
                      : 'Active Focus Sprint (Sprint Window)'}
                  </span>
                </div>
                <span className="rounded-md border border-border bg-canvas px-2.5 py-1 text-xs font-medium text-ink-secondary">
                  {selectedProtocol.name}
                </span>
              </div>

              {/* Big Display */}
              <div className="my-6 flex flex-col items-center justify-center rounded-2xl border border-border bg-canvas py-12 text-center">
                <span className="text-xs font-semibold uppercase tracking-widest text-ink-muted">
                  {phase === 'break' ? 'Time Remaining in Rest Cycle' : 'Active Work Sprint Remaining'}
                </span>
                <div className="tnum font-display text-6xl md:text-7xl font-bold tracking-tight text-ink my-3">
                  {formatTime(timeLeft)}
                </div>
                <p className="max-w-md px-4 text-xs text-ink-secondary">
                  {phase === 'break'
                    ? 'Sprint access is locked during neurological decompression. Please observe complete recovery.'
                    : 'High-intensity output interval active. Maximize productivity before restorative rotation.'}
                </p>
              </div>

              {/* Vigilance Gauge (15s idle airhorn) */}
              <div className="rounded-xl border border-border bg-surface-subtle p-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-ink">
                    Continuous Input Verification (15s Threshold)
                  </span>
                  <span className={idleSeconds >= 12 ? 'font-bold text-red-600' : 'text-ink-muted'}>
                    {15 - Math.min(15, idleSeconds)}s until Alert
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-border">
                  <div
                    className={`h-full transition-all duration-300 ${
                      idleSeconds >= 12 ? 'bg-red-500' : 'bg-accent'
                    }`}
                    style={{ width: `${Math.min(100, (idleSeconds / 15) * 100)}%` }}
                  />
                </div>
                <p className="text-[11px] text-ink-muted">
                  The system requires active mouse interaction to verify focus continuity. Stillness exceeding 15 seconds triggers an immediate audio alert.
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsRunning(!isRunning)}
                  className={`rounded-lg px-6 py-2.5 text-xs font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                    isRunning ? 'bg-ink hover:bg-ink-secondary' : 'bg-accent hover:bg-accent-hover'
                  }`}
                >
                  {isRunning ? 'Pause Interval' : 'Start Interval'}
                </button>

                <button
                  type="button"
                  onClick={handleSkipBreakAttempt}
                  className="rounded-lg border border-border bg-canvas px-4 py-2.5 text-xs font-medium text-ink-secondary hover:border-border-strong hover:bg-surface-subtle transition-colors"
                >
                  Bypass Rest
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setTimeLeft(
                    phase === 'break'
                      ? selectedProtocol.breakSeconds
                      : selectedProtocol.workSeconds
                  );
                }}
                className="text-xs text-ink-muted hover:text-ink underline"
              >
                Reset Cycle
              </button>
            </div>
          </div>

          {/* Right Rail: Protocols & Sprint Scratchpad */}
          <div className="flex flex-col gap-6">
            {/* Structured Protocols */}
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-[0_1px_2px_rgba(31,28,23,0.04)] space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-sm font-bold text-ink">
                  Focus Cadence Ratios
                </h3>
                <span className="text-[11px] text-ink-muted">Calibrated</span>
              </div>

              <div className="space-y-2">
                {PROTOCOLS.map((proto) => {
                  const isSelected = proto.id === selectedProtocol.id;
                  return (
                    <button
                      key={proto.id}
                      type="button"
                      onClick={() => handleSelectProtocol(proto)}
                      className={`w-full rounded-xl p-3 text-left text-xs transition-all border ${
                        isSelected
                          ? 'border-accent bg-accent-soft text-ink font-medium shadow-sm'
                          : 'border-border bg-canvas text-ink-secondary hover:border-border-strong hover:bg-surface-subtle'
                      }`}
                    >
                      <div className="flex items-center justify-between font-semibold text-ink">
                        <span>{proto.name}</span>
                        <span className="text-[11px] text-accent">
                          {proto.breakLabel} / {proto.workLabel}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-ink-muted leading-relaxed">
                        {proto.description}
                      </p>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleCustomIntervalClick}
                className="w-full rounded-lg border border-dashed border-border py-2 text-center text-xs font-medium text-ink-muted hover:border-border-strong hover:text-ink transition-colors"
              >
                + Configure Custom Interval
              </button>
            </div>

            {/* Sprint Scratchpad */}
            <div className="flex-1 rounded-2xl border border-border bg-surface p-6 shadow-[0_1px_2px_rgba(31,28,23,0.04)] space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-sm font-bold text-ink">
                  Sprint Workspace
                </h3>
                <span className="text-[11px] text-ink-muted">
                  {phase === 'work' ? 'Active Input' : 'Locked during Rest'}
                </span>
              </div>
              <textarea
                value={focusNotes}
                onChange={(e) => setFocusNotes(e.target.value)}
                placeholder={
                  phase === 'work'
                    ? 'Enter deep work deliverables and focus notes...'
                    : 'Workspace locked during mandatory restoration phase. Prepare mentally for the upcoming sprint.'
                }
                disabled={phase !== 'work'}
                rows={4}
                className="w-full rounded-lg border border-border bg-canvas p-3 text-xs text-ink placeholder:text-ink-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-60 resize-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: CALIBRATION ACTIVITIES */}
      {activeSubtab === 'calibration' && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Activity 1 */}
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-[0_1px_2px_rgba(31,28,23,0.04)] space-y-4">
            <span className="rounded-md bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent">
              Calibration Protocol A
            </span>
            <h3 className="font-display text-base font-bold text-ink">
              Optic Surface Curing Verification
            </h3>
            <p className="text-xs text-ink-secondary leading-relaxed">
              Observe uniform surface curing to facilitate mental focus baseline recalibration.
            </p>

            <div className="flex h-36 flex-col items-center justify-center rounded-xl border border-border bg-canvas text-center">
              <span className="font-display text-3xl font-bold text-ink">
                {surfaceCure}% Cured
              </span>
              <p className="mt-1 text-xs text-ink-muted">
                Atmospheric curing in progress. Do not disrupt the substrate.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setSurfaceCure((prev) => Math.min(99.9, +(prev + 0.1).toFixed(2)));
              }}
              className="w-full rounded-lg border border-border bg-canvas py-2 text-xs font-semibold text-ink hover:bg-surface-subtle transition-colors"
            >
              Verify Surface Density
            </button>
          </div>

          {/* Activity 2 */}
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-[0_1px_2px_rgba(31,28,23,0.04)] space-y-4">
            <span className="rounded-md bg-accent-indigo/10 px-2.5 py-1 text-xs font-semibold text-accent-indigo">
              Calibration Protocol B
            </span>
            <h3 className="font-display text-base font-bold text-ink">
              Rhythmic Pacing Index
            </h3>
            <p className="text-xs text-ink-secondary leading-relaxed">
              Steady rhythmic inputs to synchronize alpha-wave motor coordination.
            </p>

            <div className="flex h-36 flex-col items-center justify-center rounded-xl border border-border bg-canvas text-center">
              <span className="text-3xl" aria-hidden="true">
                🎯
              </span>
              <span className="font-display text-2xl font-bold text-ink mt-2">
                {pacingCount} Pacing Pulses
              </span>
            </div>

            <button
              type="button"
              onClick={() => setPacingCount((prev) => prev + 1)}
              className="w-full rounded-lg bg-accent py-2 text-xs font-semibold text-white hover:bg-accent-hover transition-colors"
            >
              Log Pacing Pulse
            </button>
          </div>
        </div>
      )}

      {/* VIEW 3: INACTIVITY LOGS */}
      {activeSubtab === 'logs' && (
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-[0_1px_2px_rgba(31,28,23,0.04)] space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h3 className="font-display text-base font-bold text-ink">
                Session Inactivity Telemetry
              </h3>
              <p className="text-xs text-ink-secondary">
                Audit record of periods where continuous user engagement dropped below verification thresholds.
              </p>
            </div>
            <button
              type="button"
              onClick={() => playAirhorn()}
              className="rounded-lg border border-border bg-canvas px-3 py-1.5 text-xs font-medium text-ink hover:bg-surface-subtle transition-colors"
            >
              📢 Test Audio Alert
            </button>
          </div>

          {inactivityLogs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-xs text-ink-muted">
              Telemetry clean. Continuous user motion maintained throughout session.
            </div>
          ) : (
            <div className="divide-y divide-border rounded-xl border border-border bg-canvas">
              {inactivityLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3.5 text-xs">
                  <div>
                    <span className="font-semibold text-ink">{log.timestamp}</span>
                    <span className="mx-2 text-ink-muted">•</span>
                    <span className="text-ink-secondary">{log.phase}</span>
                    <p className="text-[11px] text-ink-muted mt-0.5">{log.detail}</p>
                  </div>
                  <span className="rounded-md bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-800">
                    {log.resolution}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
