import React, { useState, useEffect, useRef } from 'react';
import { playAirhorn } from '../common/soundEffects';
import styles from './Tasks.module.css';

const INITIAL_TASKS = [
  {
    id: 'task-1',
    text: 'Finish project report',
    quadrant: 'urgent', // Q1: Urgent & Important
    deleteCount: 0,
  },
  {
    id: 'task-2',
    text: 'Study for upcoming exam',
    quadrant: 'schedule', // Q2: Not Urgent & Important
    deleteCount: 0,
  },
  {
    id: 'task-3',
    text: 'Reply to team emails',
    quadrant: 'delegate', // Q3: Urgent & Not Important
    deleteCount: 0,
  },
  {
    id: 'task-4',
    text: 'Clean up old desktop files',
    quadrant: 'delete', // Q4: Not Urgent & Not Important
    deleteCount: 0,
  },
  {
    id: 'task-5',
    text: 'Pay electricity bill',
    quadrant: 'urgent',
    deleteCount: 0,
  },
];

// Random relocation candidates upon deletion — strictly EXCLUDES 'urgent' (Do First)
const NON_URGENT_QUADRANTS = ['schedule', 'delegate', 'delete'];

// Sarcastic cut-in messages when user spams Delete 3 times
const DELETE_SPAM_MESSAGES = [
  'DO THE TASK INSTEAD',
  "YOU CAN'T ESCAPE IT",
  'JUST DO FIRST & EXECUTE IT',
  'STOP DELETING, START WORKING',
];

// Anti-spam / gibberish detector for the 100-character reflection essay
function validateReflectionEssay(rawText) {
  const trimmed = rawText.trim();
  if (trimmed.length < 100) {
    return { valid: false, reason: null };
  }

  // Reject 5+ consecutive identical characters (e.g. "aaaaa", ".....")
  if (/(.)\1{4,}/i.test(trimmed)) {
    return {
      valid: false,
      reason: 'Please reflect sincerely on your growth. Repeated characters are not accepted.',
    };
  }

  // Reject low character diversity (e.g. "ababababab...")
  const uniqueChars = new Set(trimmed.toLowerCase().replace(/\s+/g, '')).size;
  if (uniqueChars < 10) {
    return {
      valid: false,
      reason: 'Please reflect sincerely on your growth. Gibberish or repetitive text detected.',
    };
  }

  // Check word count & word diversity (prevents "word word word..." or keyboard mash without spaces)
  const words = trimmed.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length < 10) {
    return {
      valid: false,
      reason: 'Please write real sentences explaining what you learned (at least 10 words).',
    };
  }

  const avgWordLen = trimmed.replace(/\s+/g, '').length / words.length;
  if (avgWordLen > 16) {
    return {
      valid: false,
      reason: 'Please reflect sincerely on your growth. Random key-mashing is not accepted.',
    };
  }

  const uniqueWords = new Set(words).size;
  if (uniqueWords / words.length < 0.45) {
    return {
      valid: false,
      reason: 'Please reflect sincerely on your growth. Avoid repeating the same words.',
    };
  }

  return { valid: true, reason: null };
}

export default function ReverseEisenhower() {
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [newTaskText, setNewTaskText] = useState('');
  const [selectedQuadrant, setSelectedQuadrant] = useState('urgent');
  const [statusNotice, setStatusNotice] = useState(null);

  // Inactivity airhorn state (5s threshold)
  const [idleSeconds, setIdleSeconds] = useState(0);
  const [inactivityAlert, setInactivityAlert] = useState(false);
  const lastActivityTimeRef = useRef(Date.now());
  const airhornCooldownRef = useRef(false);

  // Execution verification modal & Essay Police state
  const [executingTask, setExecutingTask] = useState(null);
  const [reflectionEssay, setReflectionEssay] = useState('');
  const [essayPoliceWarning, setEssayPoliceWarning] = useState(null);
  const typingTimestampsRef = useRef([]);

  // Dynamic 360-degree Execute button hover offset per task ID
  const [executeOffsets, setExecuteOffsets] = useState({});

  // Among Us–style center cut-in overlay for spam-deleting 3 times
  const [cutInBanner, setCutInBanner] = useState(null);
  const spamDeleteStreakRef = useRef(0);

  // Track timestamps of delete clicks to detect rapid/spam clicks
  const lastDeleteTimeRef = useRef({});

  const showNotice = (msg) => {
    setStatusNotice(msg);
    setTimeout(() => {
      setStatusNotice(null);
    }, 4000);
  };

  // Activity detection for 5-second inactivity airhorn
  useEffect(() => {
    const handleUserInteraction = () => {
      lastActivityTimeRef.current = Date.now();
      setIdleSeconds(0);
      setInactivityAlert(false);
    };

    window.addEventListener('mousemove', handleUserInteraction);
    window.addEventListener('keydown', handleUserInteraction);
    window.addEventListener('scroll', handleUserInteraction);
    window.addEventListener('click', handleUserInteraction);

    return () => {
      window.removeEventListener('mousemove', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
      window.removeEventListener('scroll', handleUserInteraction);
      window.removeEventListener('click', handleUserInteraction);
    };
  }, []);

  // Idle check every second
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - lastActivityTimeRef.current) / 1000);
      setIdleSeconds(elapsed);

      if (elapsed >= 5 && !airhornCooldownRef.current) {
        airhornCooldownRef.current = true;
        playAirhorn();
        setInactivityAlert(true);

        setTimeout(() => {
          airhornCooldownRef.current = false;
        }, 4000);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Add task through form — with Dropdown Betrayal (Auto-Demotion) if 'Do First' was picked
  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;

    const text = newTaskText.trim();
    const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const chosenQuadrant = selectedQuadrant;

    const newTask = {
      id: taskId,
      text,
      quadrant: chosenQuadrant,
      deleteCount: 0,
    };

    setTasks((prev) => [newTask, ...prev]);
    setNewTaskText('');
    showNotice(`Task added to ${getQuadrantName(chosenQuadrant)}.`);

    // Dropdown Betrayal: if user picked "Do First", quietly demote it 1.5s later
    if (chosenQuadrant === 'urgent') {
      const demoteTarget = Math.random() < 0.5 ? 'delete' : 'delegate';
      setTimeout(() => {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId && t.quadrant === 'urgent'
              ? { ...t, quadrant: demoteTarget }
              : t
          )
        );
        showNotice(
          `Moved "${text}" to ${getQuadrantName(demoteTarget)} — it doesn't look that urgent.`
        );
      }, 1500);
    }
  };

  // Move task to another quadrant
  const handleMoveTask = (taskId, targetQuadrant) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, quadrant: targetQuadrant } : t))
    );
    showNotice(`Task moved to ${getQuadrantName(targetQuadrant)}.`);
  };

  // Execute button dodges in any random 360° direction on hover, returns on leave
  const handleExecuteHover = (taskId) => {
    const angle = Math.random() * Math.PI * 2;
    const distance = 22 + Math.random() * 20; // 22px–42px in any direction
    const x = Math.round(Math.cos(angle) * distance);
    const y = Math.round(Math.sin(angle) * distance);
    setExecuteOffsets((prev) => ({ ...prev, [taskId]: { x, y } }));
  };

  const handleExecuteResetPos = (taskId) => {
    setExecuteOffsets((prev) => {
      if (!prev[taskId]) return prev;
      const next = { ...prev };
      delete next[taskId];
      return next;
    });
  };

  // Open confirmation prompt modal when clicking Execute
  const handleStartExecute = (task) => {
    setExecutingTask(task);
    setReflectionEssay('');
    setEssayPoliceWarning(null);
    typingTimestampsRef.current = [];
  };

  // Anti-Copy-Paste / Anti-Spam Essay Police handlers
  const handleEssayPaste = (e) => {
    e.preventDefault();
    setEssayPoliceWarning('Copy-paste is disabled. Original thoughts only.');
  };

  const handleEssayDrop = (e) => {
    e.preventDefault();
    setEssayPoliceWarning('Drag-and-drop text is disabled. Original thoughts only.');
  };

  const handleEssayChange = (e) => {
    const nextVal = e.target.value;
    const addedChars = nextVal.length - reflectionEssay.length;

    // Detect typing too fast (burst > 16 keystrokes inside 1.2 seconds)
    if (addedChars > 0) {
      const now = Date.now();
      const recent = typingTimestampsRef.current.filter((ts) => now - ts < 1200);
      for (let i = 0; i < addedChars; i++) {
        recent.push(now);
      }
      typingTimestampsRef.current = recent;

      if (recent.length > 16) {
        setEssayPoliceWarning('Slow down and really reflect on what you learned.');
      } else {
        setEssayPoliceWarning(null);
      }
    } else {
      setEssayPoliceWarning(null);
    }

    setReflectionEssay(nextVal);
  };

  // Confirm execution after valid 100-character reflection essay
  const handleConfirmExecute = (e) => {
    e.preventDefault();
    if (!executingTask) return;

    const check = validateReflectionEssay(reflectionEssay);
    if (!check.valid) {
      if (check.reason) setEssayPoliceWarning(check.reason);
      return;
    }

    const targetName = executingTask.text.trim().toLowerCase();

    // Successfully executing a task deletes all other tasks of the same name
    setTasks((prev) =>
      prev.filter((t) => t.text.trim().toLowerCase() !== targetName)
    );

    showNotice(
      `✓ Done! "${executingTask.text}" and all copies of it have been removed.`
    );
    setExecutingTask(null);
    setReflectionEssay('');
    setEssayPoliceWarning(null);
  };

  /**
   * DELETE ACTION:
   * - Pops the task to another non-urgent category (NEVER to 'Do First').
   * - Spam-deleting doubles the task.
   * - Spamming Delete 3 times flashes an Among Us–style "NICE TRY" / "DUPLICATED!" cut-in.
   */
  const handleDeleteTask = (taskId) => {
    const now = Date.now();
    const lastTime = lastDeleteTimeRef.current[taskId] || 0;
    const isSpam = now - lastTime < 1400;
    lastDeleteTimeRef.current[taskId] = now;

    // Increment spam-delete counter & trigger Among Us cut-in every 3rd delete attempt
    spamDeleteStreakRef.current += 1;
    if (spamDeleteStreakRef.current >= 3) {
      spamDeleteStreakRef.current = 0;
      const label =
        DELETE_SPAM_MESSAGES[Math.floor(Math.random() * DELETE_SPAM_MESSAGES.length)];
      setCutInBanner(label);
      setTimeout(() => {
        setCutInBanner((curr) => (curr === label ? null : curr));
      }, 2800);
    }

    setTasks((prev) => {
      const target = prev.find((t) => t.id === taskId);
      if (!target) return prev;

      const candidates = NON_URGENT_QUADRANTS.filter((q) => q !== target.quadrant);
      const nextQuadrant =
        candidates[Math.floor(Math.random() * candidates.length)] || 'schedule';

      const newDeleteCount = (target.deleteCount || 0) + 1;

      if (isSpam || newDeleteCount >= 2) {
        const cloneCandidates = NON_URGENT_QUADRANTS.filter((q) => q !== nextQuadrant);
        const cloneQuadrant =
          cloneCandidates[Math.floor(Math.random() * cloneCandidates.length)] || 'delegate';

        const clonedTask = {
          ...target,
          id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          quadrant: cloneQuadrant,
          deleteCount: newDeleteCount,
        };

        const updatedOriginal = {
          ...target,
          quadrant: nextQuadrant,
          deleteCount: newDeleteCount,
        };

        showNotice(`Task was duplicated and moved to other lists.`);
        return prev.flatMap((t) => (t.id === taskId ? [updatedOriginal, clonedTask] : [t]));
      }

      showNotice(`Task moved to ${getQuadrantName(nextQuadrant)}.`);
      return prev.map((t) =>
        t.id === taskId
          ? { ...t, quadrant: nextQuadrant, deleteCount: newDeleteCount }
          : t
      );
    });
  };

  function getQuadrantName(q) {
    switch (q) {
      case 'urgent':
        return 'Do First';
      case 'schedule':
        return 'Schedule';
      case 'delegate':
        return 'Delegate';
      case 'delete':
        return 'Eliminate';
      default:
        return q;
    }
  }

  const urgentTasks = tasks.filter((t) => t.quadrant === 'urgent');
  const scheduleTasks = tasks.filter((t) => t.quadrant === 'schedule');
  const delegateTasks = tasks.filter((t) => t.quadrant === 'delegate');
  const deleteTasks = tasks.filter((t) => t.quadrant === 'delete');

  const essayLength = reflectionEssay.trim().length;
  const essayCheck = validateReflectionEssay(reflectionEssay);
  const isEssayValid = essayCheck.valid;
  const activeEssayWarning = essayPoliceWarning || essayCheck.reason;

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Among Us–style center-screen cut-in for spam-deleting 3 times */}
      {cutInBanner && (
        <div
          role="alert"
          onClick={() => setCutInBanner(null)}
          className="fixed inset-0 z-50 flex cursor-pointer items-center justify-center bg-black/75 backdrop-blur-[2px]"
        >
          <div className={`relative w-full select-none ${styles.cutInBand}`}>
            <svg
              viewBox="0 0 1200 70"
              preserveAspectRatio="none"
              className="block h-12 w-full md:h-16"
              aria-hidden="true"
            >
              <path
                d="M0,70 L0,18 L95,38 L165,6 L255,44 L360,12 L470,42 L560,4 L665,40 L765,10 L860,42 L960,8 L1070,38 L1145,14 L1200,32 L1200,70 Z"
                fill="#dc2626"
              />
              <path
                d="M0,70 L0,40 L120,52 L240,34 L380,55 L520,30 L680,54 L820,32 L980,52 L1110,36 L1200,48 L1200,70 Z"
                fill="#fca5a5"
              />
            </svg>

            <div
              className={`relative flex flex-col items-center justify-center bg-[#fecaca] px-6 py-8 md:py-10 ${styles.speedLines}`}
            >
              <div className="relative -mt-14 mb-2 flex flex-col items-center">
                <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-full border-2 border-ink bg-white/95 text-2xl shadow-md">
                  <span aria-hidden="true">🫵</span>
                </div>
                <div className="h-0 w-0 border-x-[6px] border-t-[8px] border-x-transparent border-t-ink" />
              </div>

              <p
                className={`font-display text-center text-5xl font-extrabold uppercase md:text-7xl ${styles.reportedTitle}`}
              >
                {cutInBanner}
              </p>
            </div>

            <svg
              viewBox="0 0 1200 70"
              preserveAspectRatio="none"
              className="block h-12 w-full md:h-16"
              aria-hidden="true"
            >
              <path
                d="M0,0 L1200,0 L1200,26 L1095,52 L985,18 L890,58 L770,22 L660,64 L540,20 L435,56 L325,18 L215,60 L110,24 L0,50 Z"
                fill="#dc2626"
              />
              <path
                d="M0,0 L1200,0 L1200,14 L1060,34 L910,12 L760,36 L600,14 L440,34 L290,12 L140,32 L0,18 Z"
                fill="#fca5a5"
              />
            </svg>
          </div>
        </div>
      )}

      {/* 5s Inactivity Airhorn Alert Banner */}
      {inactivityAlert && (
        <div
          role="alert"
          className="flex items-center justify-between gap-4 rounded-2xl border-2 border-red-500 bg-red-50 px-5 py-3.5 text-red-900 shadow-md animate-bounce"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl" aria-hidden="true">
              📢
            </span>
            <div>
              <p className="font-display text-sm font-bold uppercase tracking-wider">
                Inactivity Alert: 5 Seconds Idle
              </p>
              <p className="text-xs">
                Get back to work! Move your mouse or type to dismiss this alert.
              </p>
            </div>
          </div>
          <span className="rounded-md bg-red-600 px-3 py-1 text-xs font-semibold text-white">
            Back to Work
          </span>
        </div>
      )}

      {/* Notice Feedback Banner */}
      {statusNotice && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-xl border border-border bg-surface px-4 py-2.5 text-xs font-medium text-ink shadow-sm"
        >
          {statusNotice}
        </div>
      )}

      {/* Task Creation Form */}
      <section
        aria-label="Create new task"
        className="rounded-2xl border border-border bg-surface p-4 shadow-[0_1px_2px_rgba(31,28,23,0.04)]"
      >
        <form onSubmit={handleAddTask} className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <input
            type="text"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            placeholder="Add a new task (e.g. 'Buy groceries')..."
            className="flex-1 rounded-lg border border-border bg-canvas px-3.5 py-2 text-xs text-ink placeholder:text-ink-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />

          <div className="flex items-center gap-2">
            <select
              value={selectedQuadrant}
              onChange={(e) => setSelectedQuadrant(e.target.value)}
              className="rounded-lg border border-border bg-canvas px-3 py-2 text-xs font-medium text-ink focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="urgent">🏆 Do First (Urgent & Important)</option>
              <option value="schedule">📅 Schedule (Not Urgent & Important)</option>
              <option value="delegate">👥 Delegate (Urgent & Not Important)</option>
              <option value="delete">🗑️ Eliminate (Not Urgent & Not Important)</option>
            </select>

            <button
              type="submit"
              className="rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Add Task
            </button>
          </div>
        </form>
      </section>

      {/* Eisenhower Matrix 4 Quadrants */}
      <div className="flex flex-col gap-3.5">
        {/* Axis Labels — Capitalized "PRIORITY MATRIX" */}
        <div className="flex items-center justify-between px-2 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
          <span>← Urgent</span>
          <span className="font-display text-sm font-bold tracking-wider text-ink uppercase">
            Priority Matrix
          </span>
          <span>Not Urgent →</span>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* QUADRANT 1: URGENT & IMPORTANT (DO FIRST) */}
          <section
            aria-label="Quadrant 1: Urgent and Important"
            className="flex flex-col rounded-2xl border border-border bg-surface p-4 shadow-[0_1px_2px_rgba(31,28,23,0.04)]"
          >
            <div className="flex items-start justify-between border-b border-border pb-2.5">
              <div>
                <span className="inline-block rounded-md bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent">
                  Q1 • Urgent & Important
                </span>
                <h3 className="font-display text-sm font-bold text-ink mt-0.5">
                  Do First
                </h3>
                <p className="text-[11px] text-ink-secondary">
                  Do these tasks right away.
                </p>
              </div>
              <span className="text-xl" aria-hidden="true" title="Top priority">
                🏆
              </span>
            </div>

            <div className="my-3 flex-1 space-y-2 min-h-[120px]">
              {urgentTasks.length === 0 ? (
                <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-border text-center text-xs text-ink-muted p-3">
                  No urgent tasks right now.
                </div>
              ) : (
                urgentTasks.map((t) => {
                  const offset = executeOffsets[t.id] || { x: 0, y: 0 };
                  return (
                    <div
                      key={t.id}
                      onMouseLeave={() => handleExecuteResetPos(t.id)}
                      className="flex flex-col gap-1.5 rounded-xl border border-border bg-canvas p-3 text-xs shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-ink leading-snug">{t.text}</span>
                        <button
                          type="button"
                          onMouseEnter={() => handleExecuteHover(t.id)}
                          onClick={() => handleStartExecute(t)}
                          style={{
                            transform: `translate(${offset.x}px, ${offset.y}px)`,
                          }}
                          className="inline-flex shrink-0 items-center gap-1 rounded-md bg-accent px-2 py-0.5 text-[11px] font-semibold text-white hover:bg-accent-hover transition-transform duration-150 ease-out"
                          title="Mark task as done"
                        >
                          <span>Execute</span>
                        </button>
                      </div>

                      <div className="flex items-center justify-between border-t border-border/60 pt-1.5 text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleMoveTask(t.id, 'schedule')}
                            className="rounded px-1 py-0.5 text-ink-muted hover:bg-surface-subtle hover:text-ink"
                          >
                            → Schedule
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveTask(t.id, 'delegate')}
                            className="rounded px-1 py-0.5 text-ink-muted hover:bg-surface-subtle hover:text-ink"
                          >
                            → Delegate
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteTask(t.id)}
                          className="rounded-md border border-red-300 bg-red-50 px-2.5 py-0.5 font-semibold text-red-600 shadow-xs hover:bg-red-100 hover:text-red-700 transition-colors"
                          title="Remove task"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* QUADRANT 2: NOT URGENT & IMPORTANT (SCHEDULE) */}
          <section
            aria-label="Quadrant 2: Not Urgent and Important"
            className="flex flex-col rounded-2xl border border-border bg-surface p-4 shadow-[0_1px_2px_rgba(31,28,23,0.04)]"
          >
            <div className="flex items-start justify-between border-b border-border pb-2.5">
              <div>
                <span className="inline-block rounded-md bg-accent-indigo/10 px-2 py-0.5 text-[10px] font-semibold text-accent-indigo">
                  Q2 • Not Urgent & Important
                </span>
                <h3 className="font-display text-sm font-bold text-ink mt-0.5">
                  Schedule
                </h3>
                <p className="text-[11px] text-ink-secondary">
                  Plan a time to do these later.
                </p>
              </div>
              <span className="text-xl" aria-hidden="true" title="Schedule for later">
                📅
              </span>
            </div>

            <div className="my-3 flex-1 space-y-2 min-h-[120px]">
              {scheduleTasks.length === 0 ? (
                <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-border text-center text-xs text-ink-muted p-3">
                  No scheduled tasks yet.
                </div>
              ) : (
                scheduleTasks.map((t) => (
                  <div
                    key={t.id}
                    className="flex flex-col gap-1.5 rounded-xl border border-border bg-canvas p-3 text-xs shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-ink leading-snug">{t.text}</span>
                    </div>

                    <div className="flex items-center justify-between border-t border-border/60 pt-1.5 text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleMoveTask(t.id, 'urgent')}
                          className="rounded px-1 py-0.5 text-ink-muted hover:bg-surface-subtle hover:text-ink"
                        >
                          → Do First
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveTask(t.id, 'delegate')}
                          className="rounded px-1 py-0.5 text-ink-muted hover:bg-surface-subtle hover:text-ink"
                        >
                          → Delegate
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteTask(t.id)}
                        className="rounded-md border border-red-300 bg-red-50 px-2.5 py-0.5 font-semibold text-red-600 shadow-xs hover:bg-red-100 hover:text-red-700 transition-colors"
                        title="Remove task"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* QUADRANT 3: URGENT & NOT IMPORTANT (DELEGATE) */}
          <section
            aria-label="Quadrant 3: Urgent and Not Important"
            className="flex flex-col rounded-2xl border border-border bg-surface p-4 shadow-[0_1px_2px_rgba(31,28,23,0.04)]"
          >
            <div className="flex items-start justify-between border-b border-border pb-2.5">
              <div>
                <span className="inline-block rounded-md bg-accent-violet/10 px-2 py-0.5 text-[10px] font-semibold text-accent-violet">
                  Q3 • Urgent & Not Important
                </span>
                <h3 className="font-display text-sm font-bold text-ink mt-0.5">
                  Delegate
                </h3>
                <p className="text-[11px] text-ink-secondary">
                  Pass these to someone else if you can.
                </p>
              </div>
              <span className="text-xl" aria-hidden="true" title="Delegate to others">
                👥
              </span>
            </div>

            <div className="my-3 flex-1 space-y-2 min-h-[120px]">
              {delegateTasks.length === 0 ? (
                <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-border text-center text-xs text-ink-muted p-3">
                  No tasks to delegate.
                </div>
              ) : (
                delegateTasks.map((t) => (
                  <div
                    key={t.id}
                    className="flex flex-col gap-1.5 rounded-xl border border-border bg-canvas p-3 text-xs shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-ink leading-snug">{t.text}</span>
                    </div>

                    <div className="flex items-center justify-between border-t border-border/60 pt-1.5 text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleMoveTask(t.id, 'urgent')}
                          className="rounded px-1 py-0.5 text-ink-muted hover:bg-surface-subtle hover:text-ink"
                        >
                          → Do First
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveTask(t.id, 'schedule')}
                          className="rounded px-1 py-0.5 text-ink-muted hover:bg-surface-subtle hover:text-ink"
                        >
                          → Schedule
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteTask(t.id)}
                        className="rounded-md border border-red-300 bg-red-50 px-2.5 py-0.5 font-semibold text-red-600 shadow-xs hover:bg-red-100 hover:text-red-700 transition-colors"
                        title="Remove task"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* QUADRANT 4: NOT URGENT & NOT IMPORTANT (ELIMINATE) */}
          <section
            aria-label="Quadrant 4: Not Urgent and Not Important"
            className="flex flex-col rounded-2xl border border-border bg-surface p-4 shadow-[0_1px_2px_rgba(31,28,23,0.04)]"
          >
            <div className="flex items-start justify-between border-b border-border pb-2.5">
              <div>
                <span className="inline-block rounded-md bg-canvas px-2.5 py-0.5 text-[10px] font-semibold text-ink-muted border border-border">
                  Q4 • Not Urgent & Not Important
                </span>
                <h3 className="font-display text-sm font-bold text-ink mt-0.5">
                  Eliminate
                </h3>
                <p className="text-[11px] text-ink-secondary">
                  Drop or skip these tasks.
                </p>
              </div>
              <span className="text-xl" aria-hidden="true" title="Drop or remove">
                🗑️
              </span>
            </div>

            <div className="my-3 flex-1 space-y-2 min-h-[120px]">
              {deleteTasks.length === 0 ? (
                <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-border text-center text-xs text-ink-muted p-3">
                  No tasks to eliminate.
                </div>
              ) : (
                deleteTasks.map((t) => (
                  <div
                    key={t.id}
                    className="flex flex-col gap-1.5 rounded-xl border border-border bg-canvas p-3 text-xs shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-medium text-ink-secondary leading-snug">{t.text}</span>
                    </div>

                    <div className="flex items-center justify-between border-t border-border/60 pt-1.5 text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleMoveTask(t.id, 'urgent')}
                          className="rounded px-1 py-0.5 text-ink-muted hover:bg-surface-subtle hover:text-ink"
                        >
                          → Do First
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveTask(t.id, 'schedule')}
                          className="rounded px-1 py-0.5 text-ink-muted hover:bg-surface-subtle hover:text-ink"
                        >
                          → Schedule
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteTask(t.id)}
                        className="rounded-md border border-red-300 bg-red-50 px-2.5 py-0.5 font-semibold text-red-600 shadow-xs hover:bg-red-100 hover:text-red-700 transition-colors"
                        title="Remove task"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>

      {/* CONFIRMATION PROMPT MODAL: REFLECTION ESSAY WITH ANTI-COPY-PASTE / ANTI-SPAM POLICE */}
      {executingTask && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs"
        >
          <div className="flex max-w-lg w-full flex-col gap-4 rounded-2xl border border-border bg-surface p-6 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-border pb-3">
              <div>
                <span className="rounded-md bg-accent/10 px-2 py-0.5 text-[10px] font-bold text-accent uppercase">
                  Confirm Completion
                </span>
                <h3 className="font-display text-base font-bold text-ink mt-1">
                  Task Reflection
                </h3>
              </div>
              <span className="text-2xl" aria-hidden="true">
                📝
              </span>
            </div>

            <div className="space-y-1 rounded-xl border border-border bg-canvas p-3 text-xs">
              <span className="text-[11px] font-semibold text-ink-muted uppercase">
                Task:
              </span>
              <p className="font-semibold text-ink">{executingTask.text}</p>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="reflection-essay"
                className="block text-xs font-medium text-ink-secondary leading-relaxed"
              >
                Before completing this task, please write a short reflection essay on what
                you learned from doing it (minimum 100 characters):
              </label>

              <textarea
                id="reflection-essay"
                rows={4}
                value={reflectionEssay}
                onChange={handleEssayChange}
                onPaste={handleEssayPaste}
                onDrop={handleEssayDrop}
                placeholder="Write what you learned from doing this task..."
                className="w-full resize-none rounded-xl border border-border bg-canvas p-3 text-xs text-ink placeholder:text-ink-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent leading-relaxed"
              />

              {/* Essay Police Warning */}
              {activeEssayWarning && (
                <p
                  role="alert"
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700"
                >
                  {activeEssayWarning}
                </p>
              )}

              {/* Character Count & Progress Bar */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span
                    className={
                      isEssayValid
                        ? 'font-semibold text-emerald-600'
                        : 'font-semibold text-red-600'
                    }
                  >
                    {essayLength} / 100 characters
                    {isEssayValid && ' ✓ Ready'}
                  </span>
                  <span className="text-ink-muted">
                    {essayLength < 100
                      ? `${100 - essayLength} more needed`
                      : isEssayValid
                        ? 'You can submit now'
                        : 'Sincere reflection required'}
                  </span>
                </div>

                <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
                  <div
                    className={`h-full transition-all duration-200 ${
                      isEssayValid ? 'bg-emerald-500' : 'bg-accent'
                    }`}
                    style={{ width: `${Math.min(100, (essayLength / 100) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
              <button
                type="button"
                onClick={() => {
                  setExecutingTask(null);
                  setEssayPoliceWarning(null);
                }}
                className="rounded-lg border border-border bg-canvas px-4 py-2 text-xs font-semibold text-ink hover:bg-surface-subtle transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmExecute}
                disabled={!isEssayValid}
                className="rounded-lg bg-accent px-5 py-2 text-xs font-semibold text-white transition-all hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                Complete Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
