import React, { useState, useEffect, useRef } from 'react';
import { playAirhorn } from '../common/soundEffects';

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

  // Execution verification modal state
  const [executingTask, setExecutingTask] = useState(null);
  const [reflectionEssay, setReflectionEssay] = useState('');

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

      // Trigger airhorn when inactive for 5 seconds
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

  // Add task through form
  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;

    const newTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      text: newTaskText.trim(),
      quadrant: selectedQuadrant,
      deleteCount: 0,
    };

    setTasks((prev) => [newTask, ...prev]);
    setNewTaskText('');
    showNotice(`Task added to ${getQuadrantName(selectedQuadrant)}.`);
  };

  // Move task to another quadrant
  const handleMoveTask = (taskId, targetQuadrant) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, quadrant: targetQuadrant } : t))
    );
    showNotice(`Task moved to ${getQuadrantName(targetQuadrant)}.`);
  };

  // Open confirmation prompt modal when clicking Execute
  const handleStartExecute = (task) => {
    setExecutingTask(task);
    setReflectionEssay('');
  };

  // Confirm execution after 100-character reflection essay
  const handleConfirmExecute = (e) => {
    e.preventDefault();
    if (!executingTask || reflectionEssay.trim().length < 100) return;

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
  };

  /**
   * DELETE ACTION:
   * Rule: Deleting tasks pops them out to another category (NEVER to 'Do First').
   * If you spam delete the task, it doubles!
   */
  const handleDeleteTask = (taskId) => {
    const now = Date.now();
    const lastTime = lastDeleteTimeRef.current[taskId] || 0;
    const isSpam = now - lastTime < 1400; // Clicked within 1.4s = spamming delete!
    lastDeleteTimeRef.current[taskId] = now;

    setTasks((prev) => {
      const target = prev.find((t) => t.id === taskId);
      if (!target) return prev;

      // Select a target category from NON_URGENT_QUADRANTS that is different from current quadrant
      const candidates = NON_URGENT_QUADRANTS.filter((q) => q !== target.quadrant);
      const nextQuadrant =
        candidates[Math.floor(Math.random() * candidates.length)] || 'schedule';

      const newDeleteCount = (target.deleteCount || 0) + 1;

      // If user spam-clicks delete (or attempts to delete multiple times), double the task!
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

      // Normal single delete: pops out and shifts to a non-urgent quadrant
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
  const isEssayValid = essayLength >= 100;

  return (
    <div className="flex flex-col gap-5 w-full">
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
                urgentTasks.map((t) => (
                  <div
                    key={t.id}
                    className="flex flex-col gap-1.5 rounded-xl border border-border bg-canvas p-3 text-xs shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-ink leading-snug">{t.text}</span>
                      <button
                        type="button"
                        onClick={() => handleStartExecute(t)}
                        className="inline-flex shrink-0 items-center gap-1 rounded-md bg-accent px-2 py-0.5 text-[11px] font-semibold text-white hover:bg-accent-hover transition-colors"
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
                        className="rounded px-1.5 py-0.5 text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
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
                        className="rounded px-1.5 py-0.5 text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
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
                        className="rounded px-1.5 py-0.5 text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
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
                        className="rounded px-1.5 py-0.5 text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
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

      {/* CONFIRMATION PROMPT MODAL: REFLECTION ESSAY (MINIMUM 100 CHARACTERS) */}
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
                onChange={(e) => setReflectionEssay(e.target.value)}
                placeholder="Write what you learned from doing this task..."
                className="w-full resize-none rounded-xl border border-border bg-canvas p-3 text-xs text-ink placeholder:text-ink-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent leading-relaxed"
              />

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
                    {isEssayValid ? 'You can submit now' : `${100 - essayLength} more needed`}
                  </span>
                </div>

                <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
                  <div
                    className={`h-full transition-all duration-200 ${isEssayValid ? 'bg-emerald-500' : 'bg-accent'
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
                onClick={() => setExecutingTask(null)}
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
