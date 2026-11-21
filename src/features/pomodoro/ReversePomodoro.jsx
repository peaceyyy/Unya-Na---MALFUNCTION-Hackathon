import React, { useState, useEffect, useRef } from 'react';
import { playAirhorn } from '../common/soundEffects';
import styles from './ReversePomodoro.module.css';

// 8 arbitrary duration presets (no multiples of 5, duration-only display)
const TIME_PRESETS = [
  { id: 't1', label: '11:39', breakSeconds: 11 * 60 + 39, workSeconds: 23 },
  { id: 't2', label: '17:51', breakSeconds: 17 * 60 + 51, workSeconds: 29 },
  { id: 't3', label: '23:47', breakSeconds: 23 * 60 + 47, workSeconds: 41 },
  { id: 't4', label: '31:13', breakSeconds: 31 * 60 + 13, workSeconds: 37 },
  { id: 't5', label: '37:29', breakSeconds: 37 * 60 + 29, workSeconds: 31 },
  { id: 't6', label: '43:19', breakSeconds: 43 * 60 + 19, workSeconds: 53 },
  { id: 't7', label: '58:07', breakSeconds: 58 * 60 + 7, workSeconds: 19 },
  { id: 't8', label: '1:14:19', breakSeconds: 74 * 60 + 19, workSeconds: 17 },
];

const INITIAL_KNOTS = [
  { id: 0, x: 52, y: 24, clicksLeft: 2, untangled: false },
  { id: 1, x: 110, y: 58, clicksLeft: 3, untangled: false },
  { id: 2, x: 168, y: 28, clicksLeft: 2, untangled: false },
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
  const [activeTab, setActiveTab] = useState('timer'); // 'timer' | 'activities' | 'logs'
  const [selectedPreset, setSelectedPreset] = useState(TIME_PRESETS[2]); // 23:47 default
  const [phase, setPhase] = useState('break'); // 'break' | 'work'
  const [timeLeft, setTimeLeft] = useState(TIME_PRESETS[2].breakSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [completedTimers, setCompletedTimers] = useState(0);

  // Punitive focus detection (15s idle -> airhorn) & random false-alarm ("Joke lang")
  const [idleSeconds, setIdleSeconds] = useState(0);
  const [centerOverlay, setCenterOverlay] = useState(null); // null | 'wakeup' | 'jokelang'
  const [activityLogs, setActivityLogs] = useState([]);
  const [notice, setNotice] = useState(null);
  const [sessionNotes, setSessionNotes] = useState('');

  // Break Activity 1: Watch Paint Dry
  const [paintDryness, setPaintDryness] = useState(12.4);
  const [paintTouchMsg, setPaintTouchMsg] = useState(null);

  // Break Activity 2: Count Digital Sheep
  const [sheepCount, setSheepCount] = useState(0);
  const [jumpingSheep, setJumpingSheep] = useState([]);

  // Break Activity 3: Interactive Untangle Wired Headphones
  const [knots, setKnots] = useState(INITIAL_KNOTS);
  const [draggingKnotId, setDraggingKnotId] = useState(null);
  const svgRef = useRef(null);

  const lastActivityRef = useRef(Date.now());
  const timerRef = useRef(null);
  const airhornCooldownRef = useRef(false);
  const timeLeftRef = useRef(timeLeft);
  const hasAddedLockInRef = useRef(false);

  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  const showNotice = (msg) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3800);
  };

  // Track user activity for 15s inactivity airhorn
  useEffect(() => {
    const handleActivity = () => {
      lastActivityRef.current = Date.now();
      setIdleSeconds(0);
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('scroll', handleActivity);
    window.addEventListener('click', handleActivity);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('click', handleActivity);
    };
  }, []);

  // Check idle every second
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - lastActivityRef.current) / 1000);
      setIdleSeconds(elapsed);

      if (elapsed >= 15 && !airhornCooldownRef.current) {
        airhornCooldownRef.current = true;
        playAirhorn();
        setCenterOverlay('wakeup');

        const logEntry = {
          id: Date.now(),
          time: new Date().toLocaleTimeString(),
          phase: phase === 'work' ? 'Focus Session' : 'Break Session',
          detail: '15 seconds of inactivity detected.',
          penalty: phase === 'work' ? '-10s focus time' : 'Alert triggered',
        };
        setActivityLogs((prev) => [logEntry, ...prev.slice(0, 19)]);

        if (phase === 'work') {
          setTimeLeft((prev) => Math.max(1, prev - 10));
        }

        setTimeout(() => {
          setCenterOverlay((curr) => (curr === 'wakeup' ? null : curr));
        }, 3800);
        setTimeout(() => {
          airhornCooldownRef.current = false;
        }, 5000);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [phase]);

  // Random false-alarm airhorn while timer is running -> "Joke lang" in center of screen
  useEffect(() => {
    if (!isRunning) return;

    let timeoutId;
    const scheduleFakeAlarm = () => {
      // Fires randomly between 15s and 38s (scaled down if 25x speed is enabled for quick testing)
      const minDelay = speedMultiplier > 1 ? 5000 : 15000;
      const maxDelay = speedMultiplier > 1 ? 12000 : 38000;
      const delay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;

      timeoutId = setTimeout(() => {
        if (timeLeftRef.current > 3) {
          playAirhorn();
          setCenterOverlay('jokelang');
        }
        scheduleFakeAlarm();
      }, delay);
    };

    scheduleFakeAlarm();
    return () => clearTimeout(timeoutId);
  }, [isRunning, speedMultiplier]);

  // Main countdown loop
  useEffect(() => {
    if (!isRunning) return;

    timerRef.current = setInterval(() => {
      if (timeLeftRef.current <= 1) {
        // First time the timer ends: add an extra 2 minutes and show green center-screen alert
        if (!hasAddedLockInRef.current) {
          hasAddedLockInRef.current = true;
          timeLeftRef.current = 120;
          setTimeLeft(120);
          setCenterOverlay('lockin');
          setTimeout(() => {
            setCenterOverlay((curr) => (curr === 'lockin' ? null : curr));
          }, 4500);
        } else {
          // After the extra 2 minutes finish: reset completely and wait for Start click
          hasAddedLockInRef.current = false;
          setIsRunning(false);
          setCompletedTimers((c) => c + 1);
          setPhase('break');
          timeLeftRef.current = selectedPreset.breakSeconds;
          setTimeLeft(selectedPreset.breakSeconds);
          showNotice('Timer complete. Click Start when you are ready for the next session.');
        }
      } else {
        const next = timeLeftRef.current - 1;
        timeLeftRef.current = next;
        setTimeLeft(next);
      }
    }, 1000 / speedMultiplier);

    return () => clearInterval(timerRef.current);
  }, [isRunning, selectedPreset, speedMultiplier]);

  // Paint drying ticker
  useEffect(() => {
    if (activeTab !== 'activities') return;
    const interval = setInterval(() => {
      setPaintDryness((prev) => (prev >= 99.9 ? 99.9 : +(prev + 0.02).toFixed(2)));
    }, 600);
    return () => clearInterval(interval);
  }, [activeTab]);

  const timersRemainingToUnlock = Math.max(0, 100 - completedTimers);

  const handleSelectPreset = (preset) => {
    hasAddedLockInRef.current = false;
    setSelectedPreset(preset);
    setPhase('break');
    timeLeftRef.current = preset.breakSeconds;
    setTimeLeft(preset.breakSeconds);
    setIsRunning(false);
  };

  const handleCustomTimesClick = () => {
    if (timersRemainingToUnlock > 0) {
      showNotice(
        `Finish ${timersRemainingToUnlock} more ${
          timersRemainingToUnlock === 1 ? 'timer' : 'timers'
        } to unlock custom times (${completedTimers} / 100 completed).`
      );
    } else {
      showNotice('100 timers completed! Custom times unlocked.');
    }
  };

  const handleResetTimer = () => {
    hasAddedLockInRef.current = false;
    setIsRunning(false);
    const resetTime =
      phase === 'break'
        ? selectedPreset.breakSeconds
        : selectedPreset.workSeconds;
    timeLeftRef.current = resetTime;
    setTimeLeft(resetTime);
    showNotice('Timer reset.');
  };

  // Activity 1: Watch Paint Dry
  const handleTouchPaint = () => {
    setPaintDryness((prev) => Math.max(1.5, +(prev - 4.5).toFixed(2)));
    setPaintTouchMsg('Ayg Hilabti');
    setTimeout(() => setPaintTouchMsg(null), 3500);
  };

  const handleBlowPaint = () => {
    setPaintDryness((prev) => Math.min(99.9, +(prev + 0.15).toFixed(2)));
  };

  // Activity 2: Count Digital Sheep with jump animation
  const handleHerdSheep = () => {
    setSheepCount((prev) => prev + 1);
    const sheepId = Date.now() + Math.random();
    setJumpingSheep((prev) => [...prev, sheepId]);
    setTimeout(() => {
      setJumpingSheep((prev) => prev.filter((id) => id !== sheepId));
    }, 900);
  };

  // Activity 3: Interactive Untangle Wired Headphones (click or drag knots)
  const remainingKnots = knots.filter((k) => !k.untangled).length;
  const allUntangled = remainingKnots === 0;

  const handlePullKnot = (knotId) => {
    setKnots((prev) =>
      prev.map((k) => {
        if (k.id !== knotId || k.untangled) return k;
        const nextClicks = k.clicksLeft - 1;
        if (nextClicks <= 0) {
          return { ...k, y: 45, clicksLeft: 0, untangled: true };
        }
        // Pull knot visibly closer to center line (y = 45)
        const nextY = k.y + (45 - k.y) * 0.5;
        return { ...k, y: Math.round(nextY), clicksLeft: nextClicks };
      })
    );
  };

  const handleSvgPointerMove = (e) => {
    if (draggingKnotId === null || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = 220 / rect.width;
    const scaleY = 90 / rect.height;
    const x = Math.max(30, Math.min(190, (e.clientX - rect.left) * scaleX));
    const y = Math.max(12, Math.min(78, (e.clientY - rect.top) * scaleY));

    setKnots((prev) =>
      prev.map((k) => {
        if (k.id !== draggingKnotId) return k;
        const closeToCenter = Math.abs(y - 45) < 7;
        return {
          ...k,
          x: Math.round(x),
          y: closeToCenter ? 45 : Math.round(y),
          untangled: closeToCenter ? true : k.untangled,
          clicksLeft: closeToCenter ? 0 : k.clicksLeft,
        };
      })
    );
  };

  const handleSvgPointerUp = () => {
    setDraggingKnotId(null);
  };

  const handleResetHeadphones = () => {
    setKnots(INITIAL_KNOTS.map((k) => ({ ...k })));
  };

  // Dynamic SVG wire paths driven by knot positions
  const k0 = knots[0];
  const k1 = knots[1];
  const k2 = knots[2];

  const leftWirePath = `M 14 45 C ${k0.x - 15} ${k0.y - (k0.untangled ? 0 : 22)}, ${k0.x + 15} ${k0.y + (k0.untangled ? 0 : 20)}, ${k1.x} ${k1.y} S ${k2.x - 10} ${k2.y - (k2.untangled ? 0 : 18)}, 206 38`;
  const rightWirePath = `M 14 45 C ${k0.x - 10} ${k0.y + (k0.untangled ? 0 : 24)}, ${k1.x - 20} ${k1.y - (k1.untangled ? 0 : 26)}, ${k1.x} ${k1.y} S ${k2.x + 12} ${k2.y + (k2.untangled ? 0 : 22)}, 206 52`;

  return (
    <div className="flex flex-col gap-6">
      {/* Among Us "Dead Body Reported" style center-screen alarm overlay */}
      {centerOverlay && (
        <div
          role="alert"
          onClick={() => setCenterOverlay(null)}
          className="fixed inset-0 z-50 flex cursor-pointer items-center justify-center bg-black/75 backdrop-blur-[2px]"
        >
          <div className={`relative w-full select-none ${styles.cutInBand}`}>
            {/* Top jagged flame edge */}
            <svg
              viewBox="0 0 1200 70"
              preserveAspectRatio="none"
              className="block h-12 w-full md:h-16"
              aria-hidden="true"
            >
              <path
                d="M0,70 L0,18 L95,38 L165,6 L255,44 L360,12 L470,42 L560,4 L665,40 L765,10 L860,42 L960,8 L1070,38 L1145,14 L1200,32 L1200,70 Z"
                fill={centerOverlay === 'lockin' ? '#16a34a' : '#dc2626'}
              />
              <path
                d="M0,70 L0,40 L120,52 L240,34 L380,55 L520,30 L680,54 L820,32 L980,52 L1110,36 L1200,48 L1200,70 Z"
                fill={centerOverlay === 'lockin' ? '#86efac' : '#fca5a5'}
              />
            </svg>

            {/* Center speed-lines band */}
            <div
              className={`relative flex flex-col items-center justify-center px-6 py-8 md:py-10 ${
                centerOverlay === 'lockin' ? 'bg-[#bbf7d0]' : 'bg-[#fecaca]'
              } ${styles.speedLines}`}
            >
              {/* Floating dramatic badge above text */}
              <div className="relative -mt-14 mb-2 flex flex-col items-center">
                <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-full border-2 border-ink bg-white/95 text-2xl shadow-md">
                  <span aria-hidden="true">
                    {centerOverlay === 'wakeup'
                      ? '📢'
                      : centerOverlay === 'lockin'
                        ? '🔒'
                        : '😜'}
                  </span>
                </div>
                <div className="h-0 w-0 border-x-[6px] border-t-[8px] border-x-transparent border-t-ink" />
              </div>

              <p
                className={`font-display text-center text-5xl font-extrabold uppercase md:text-7xl ${
                  centerOverlay === 'lockin'
                    ? styles.reportedTitleGreen
                    : styles.reportedTitle
                }`}
              >
                {centerOverlay === 'wakeup'
                  ? 'WAKE UP!'
                  : centerOverlay === 'lockin'
                    ? 'LOCK IN MORE!'
                    : 'Joke lang'}
              </p>

              {centerOverlay === 'lockin' && (
                <span className="mt-3 rounded-lg border-2 border-white bg-emerald-700 px-4 py-1 font-mono text-sm font-bold text-white shadow-sm">
                  +02:00 ADDED — KEEP GOING
                </span>
              )}
            </div>

            {/* Bottom jagged flame edge */}
            <svg
              viewBox="0 0 1200 70"
              preserveAspectRatio="none"
              className="block h-12 w-full md:h-16"
              aria-hidden="true"
            >
              <path
                d="M0,0 L1200,0 L1200,26 L1095,52 L985,18 L890,58 L770,22 L660,64 L540,20 L435,56 L325,18 L215,60 L110,24 L0,50 Z"
                fill={centerOverlay === 'lockin' ? '#16a34a' : '#dc2626'}
              />
              <path
                d="M0,0 L1200,0 L1200,14 L1060,34 L910,12 L760,36 L600,14 L440,34 L290,12 L140,32 L0,18 Z"
                fill={centerOverlay === 'lockin' ? '#86efac' : '#fca5a5'}
              />
            </svg>
          </div>
        </div>
      )}

      {/* System Notice */}
      {notice && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-xl border border-border bg-surface px-4 py-2.5 text-xs font-medium text-ink shadow-sm"
        >
          {notice}
        </div>
      )}

      {/* Internal Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-2">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('timer')}
            className={`rounded-lg px-4 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              activeTab === 'timer'
                ? 'bg-accent text-white font-semibold'
                : 'bg-surface text-ink hover:bg-surface-subtle'
            }`}
          >
            ⏱ Timer
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('activities')}
            className={`rounded-lg px-4 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              activeTab === 'activities'
                ? 'bg-accent text-white font-semibold'
                : 'bg-surface text-ink hover:bg-surface-subtle'
            }`}
          >
            🎨 Break Activities
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('logs')}
            className={`rounded-lg px-4 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              activeTab === 'logs'
                ? 'bg-accent text-white font-semibold'
                : 'bg-surface text-ink hover:bg-surface-subtle'
            }`}
          >
            📊 Activity Log ({activityLogs.length})
          </button>
        </div>

        {/* Speed Multiplier for Testing/Demo */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-ink-muted">Speed:</span>
          <button
            type="button"
            onClick={() => setSpeedMultiplier((prev) => (prev === 1 ? 25 : 1))}
            className={`rounded-lg border border-border px-2.5 py-1 text-xs font-medium transition-colors ${
              speedMultiplier > 1
                ? 'bg-accent text-white font-bold'
                : 'bg-surface text-ink hover:bg-surface-subtle'
            }`}
          >
            {speedMultiplier > 1 ? '⚡ 25x' : '1x'}
          </button>
        </div>
      </div>

      {/* VIEW 1: TIMER */}
      {activeTab === 'timer' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Clock Card */}
          <div className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-7 shadow-[0_1px_2px_rgba(31,28,23,0.04)] lg:col-span-2 space-y-6">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block h-3 w-3 rounded-full ${
                      phase === 'break' ? 'bg-accent' : 'bg-emerald-500 animate-pulse'
                    }`}
                  />
                  <span className="font-display text-sm font-bold uppercase tracking-wider text-ink">
                    {phase === 'break' ? 'Work Session' : 'Focus Session'}
                  </span>
                </div>
                <span className="text-xs text-ink-muted">
                  Completed: {completedTimers}
                </span>
              </div>

              {/* Big Display */}
              <div className="my-6 flex flex-col items-center justify-center rounded-2xl border border-border bg-canvas py-12 text-center">
                <span className="text-xs font-semibold uppercase tracking-widest text-ink-muted">
                  {phase === 'break' ? 'Work Time Remaining' : 'Focus Time Remaining'}
                </span>
                <div className="tnum font-display text-6xl md:text-7xl font-bold tracking-tight text-ink my-3">
                  {formatTime(timeLeft)}
                </div>
                <p className="max-w-md px-4 text-xs text-ink-secondary">
                  Stay focused and keep working steadily until the timer ends.
                </p>
              </div>

              {/* Focus Monitor (15s idle airhorn) */}
              <div className="rounded-xl border border-border bg-surface-subtle p-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-ink">Focus Monitor</span>
                  <span className={idleSeconds >= 12 ? 'font-bold text-red-600' : 'text-ink-muted'}>
                    {15 - Math.min(15, idleSeconds)}s
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
                  Monitors cursor and keyboard activity to keep you engaged during your session.
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
                  {isRunning ? 'Pause' : 'Start'}
                </button>

                <button
                  type="button"
                  onClick={handleResetTimer}
                  className="rounded-lg border border-border bg-canvas px-4 py-2.5 text-xs font-medium text-ink-secondary hover:border-border-strong hover:bg-surface-subtle transition-colors"
                >
                  Reset Timer
                </button>
              </div>
            </div>
          </div>

          {/* Right Rail: Timer Presets & Session Notes */}
          <div className="flex flex-col gap-6">
            {/* 8 Duration-Only Presets */}
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-[0_1px_2px_rgba(31,28,23,0.04)] space-y-4">
              <h2 className="font-display text-base font-bold text-ink">
                Timer Presets
              </h2>

              <div className="grid grid-cols-2 gap-2">
                {TIME_PRESETS.map((preset) => {
                  const isSelected = preset.id === selectedPreset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className={`tnum rounded-xl py-2.5 px-3 text-center font-mono text-sm font-semibold transition-all border ${
                        isSelected
                          ? 'border-accent bg-accent-soft text-accent shadow-sm'
                          : 'border-border bg-canvas text-ink hover:border-border-strong hover:bg-surface-subtle'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleCustomTimesClick}
                className="w-full rounded-lg border border-dashed border-border py-2.5 px-3 text-center text-xs font-medium text-ink-muted hover:border-border-strong hover:text-ink transition-colors"
              >
                {timersRemainingToUnlock > 0
                  ? `+ Enter Custom Times (Finish ${timersRemainingToUnlock} ${
                      timersRemainingToUnlock === 1 ? 'timer' : 'timers'
                    } to unlock)`
                  : '+ Enter Custom Times (Unlocked!)'}
              </button>
            </div>

            {/* Serious Session Notes */}
            <div className="flex-1 rounded-2xl border border-border bg-surface p-6 shadow-[0_1px_2px_rgba(31,28,23,0.04)] space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-sm font-bold text-ink">
                  Session Notes
                </h3>
                <span className="text-[11px] text-ink-muted">
                  {phase === 'work' ? 'Active' : 'Standby'}
                </span>
              </div>
              <textarea
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="Write down goals, tasks, or quick notes for this session..."
                rows={4}
                className="w-full rounded-lg border border-border bg-canvas p-3 text-xs text-ink placeholder:text-ink-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent resize-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: BREAK ACTIVITIES */}
      {activeTab === 'activities' && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Activity 1: Watch Paint Dry */}
          <div className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-6 shadow-[0_1px_2px_rgba(31,28,23,0.04)] space-y-4">
            <div className="space-y-2">
              <h3 className="font-display text-lg font-bold text-ink">
                Watch Paint Dry
              </h3>
              <p className="text-xs text-ink-secondary">
                Wait for the fresh coat to dry at room temperature.
              </p>
            </div>

            <div className="relative flex h-36 w-full items-center justify-center rounded-xl border border-border overflow-hidden bg-surface-subtle">
              <div
                className="absolute inset-0 bg-border-strong transition-all duration-500"
                style={{ opacity: Math.max(0.1, 1 - paintDryness / 100) }}
              />
              <div className="relative z-10 text-center">
                <span className="font-display text-2xl font-bold text-ink">
                  {paintDryness}% Dried
                </span>
                <p className="text-[11px] text-ink-muted">
                  {paintDryness < 100 ? 'Still wet' : 'Dry'}
                </p>
              </div>
            </div>

            {paintTouchMsg && (
              <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-center text-sm font-bold text-red-700">
                <strong>{paintTouchMsg}</strong>
              </p>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleTouchPaint}
                className="flex-1 rounded-lg border border-border bg-canvas py-2 text-xs font-medium text-ink hover:bg-surface-subtle transition-colors"
              >
                Touch Wet Paint
              </button>
              <button
                type="button"
                onClick={handleBlowPaint}
                className="flex-1 rounded-lg bg-accent px-3 py-2 text-xs font-medium text-white hover:bg-accent-hover transition-colors"
              >
                Blow on Paint
              </button>
            </div>
          </div>

          {/* Activity 2: Count Digital Sheep (Animated Emoji Jump Over Fence) */}
          <div className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-6 shadow-[0_1px_2px_rgba(31,28,23,0.04)] space-y-4">
            <div className="space-y-2">
              <h3 className="font-display text-lg font-bold text-ink">
                Count Digital Sheep
              </h3>
              <p className="text-xs text-ink-secondary">
                Herd each sheep over the wooden fence to clear your mind.
              </p>
            </div>

            {/* Animated Meadow & Fence Stage */}
            <div className="relative flex h-36 flex-col items-center justify-end overflow-hidden rounded-xl border border-border bg-canvas pb-3">
              {/* Count Badge */}
              <div className="absolute top-2.5 left-3 rounded-md bg-surface px-2.5 py-0.5 text-xs font-bold text-ink border border-border">
                {sheepCount} counted
              </div>

              {/* Jumping Sheep Emojis */}
              {jumpingSheep.map((id) => (
                <span key={id} className={styles.jumpingSheep} aria-hidden="true">
                  🐑
                </span>
              ))}

              {/* Waiting sheep on the right */}
              <span
                className="absolute bottom-3 right-5 text-2xl opacity-85"
                aria-hidden="true"
              >
                🐑
              </span>

              {/* Wooden Fence in the middle */}
              <div className="relative z-10 flex items-end gap-1" aria-hidden="true">
                <div className="h-10 w-2 rounded-t bg-amber-800" />
                <div className="flex flex-col gap-2 pb-2">
                  <div className="h-1.5 w-8 bg-amber-700 rounded-sm" />
                  <div className="h-1.5 w-8 bg-amber-700 rounded-sm" />
                </div>
                <div className="h-10 w-2 rounded-t bg-amber-800" />
              </div>

              {/* Grass strip */}
              <div className="absolute bottom-0 inset-x-0 h-2.5 bg-emerald-600/25" />
            </div>

            <button
              type="button"
              onClick={handleHerdSheep}
              className="w-full rounded-lg bg-accent-indigo py-2 text-xs font-semibold text-white hover:opacity-90 transition-opacity"
            >
              Herd Next Sheep
            </button>
          </div>

          {/* Activity 3: Interactive Untangle Wired Headphones */}
          <div className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-6 shadow-[0_1px_2px_rgba(31,28,23,0.04)] space-y-4">
            <div className="space-y-2">
              <h3 className="font-display text-lg font-bold text-ink">
                Untangle Wired Headphones
              </h3>
              <p className="text-xs text-ink-secondary">
                Click or drag each tangled knot toward the center line to straighten the cord.
              </p>
            </div>

            <div className="flex h-36 flex-col items-center justify-center rounded-xl border border-border bg-canvas p-2">
              <svg
                ref={svgRef}
                viewBox="0 0 220 90"
                className="h-24 w-full touch-none select-none"
                onPointerMove={handleSvgPointerMove}
                onPointerUp={handleSvgPointerUp}
                onPointerLeave={handleSvgPointerUp}
              >
                {/* Center guide line */}
                <line
                  x1="16"
                  y1="45"
                  x2="204"
                  y2="45"
                  stroke="#d2c7ad"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />

                {/* Plug on left */}
                <rect x="4" y="41" width="12" height="8" rx="2" fill="#544d42" />

                {/* Left & Right Headphone Wires */}
                <path
                  d={leftWirePath}
                  fill="none"
                  stroke={allUntangled ? '#2563eb' : '#4f46e5'}
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <path
                  d={rightWirePath}
                  fill="none"
                  stroke={allUntangled ? '#2563eb' : '#7c3aed'}
                  strokeWidth="3"
                  strokeLinecap="round"
                />

                {/* Earbuds on right */}
                <circle cx="208" cy="38" r="5" fill="#1f1c17" />
                <circle cx="208" cy="52" r="5" fill="#1f1c17" />

                {/* Interactive Knot Nodes */}
                {knots.map((knot) => (
                  <g
                    key={knot.id}
                    onPointerDown={(e) => {
                      if (knot.untangled) return;
                      e.stopPropagation();
                      setDraggingKnotId(knot.id);
                    }}
                    onClick={() => handlePullKnot(knot.id)}
                    className={knot.untangled ? '' : 'cursor-grab active:cursor-grabbing'}
                  >
                    <circle
                      cx={knot.x}
                      cy={knot.y}
                      r={knot.untangled ? 5 : 10}
                      fill={knot.untangled ? '#10b981' : '#ef4444'}
                      stroke="#fffdf7"
                      strokeWidth="2"
                    />
                    {!knot.untangled && (
                      <text
                        x={knot.x}
                        y={knot.y + 3.5}
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="9"
                        fontWeight="bold"
                        pointerEvents="none"
                      >
                        {knot.clicksLeft}
                      </text>
                    )}
                  </g>
                ))}
              </svg>

              <span className="text-xs font-medium text-ink-secondary">
                {allUntangled
                  ? '✓ Headphones untangled!'
                  : `${remainingKnots} knot${remainingKnots === 1 ? '' : 's'} remaining — click or drag red knots`}
              </span>
            </div>

            <button
              type="button"
              onClick={
                allUntangled
                  ? handleResetHeadphones
                  : () => {
                      const next = knots.find((k) => !k.untangled);
                      if (next) handlePullKnot(next.id);
                    }
              }
              className="w-full rounded-lg border border-border bg-canvas py-2 text-xs font-semibold text-ink hover:bg-surface-subtle transition-colors"
            >
              {allUntangled ? 'Re-tangle Cord' : 'Loosen Next Knot'}
            </button>
          </div>
        </div>
      )}

      {/* VIEW 3: ACTIVITY LOG */}
      {activeTab === 'logs' && (
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-[0_1px_2px_rgba(31,28,23,0.04)] space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h3 className="font-display text-base font-bold text-ink">
                Session Activity Log
              </h3>
              <p className="text-xs text-ink-secondary">
                Record of focus monitor alerts during your sessions.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                playAirhorn();
                setCenterOverlay('wakeup');
                setTimeout(() => {
                  setCenterOverlay((curr) => (curr === 'wakeup' ? null : curr));
                }, 3800);
              }}
              className="rounded-lg border border-border bg-canvas px-3 py-1.5 text-xs font-medium text-ink hover:bg-surface-subtle transition-colors"
            >
              📢 Test Alert
            </button>
          </div>

          {activityLogs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-xs text-ink-muted">
              No inactivity alerts recorded yet.
            </div>
          ) : (
            <div className="divide-y divide-border rounded-xl border border-border bg-canvas">
              {activityLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3.5 text-xs">
                  <div>
                    <span className="font-semibold text-ink">{log.time}</span>
                    <span className="mx-2 text-ink-muted">•</span>
                    <span className="text-ink-secondary">{log.phase}</span>
                    <p className="text-[11px] text-ink-muted mt-0.5">{log.detail}</p>
                  </div>
                  <span className="rounded-md bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-800">
                    {log.penalty}
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
