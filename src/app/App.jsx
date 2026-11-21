import React, { useState, useEffect } from 'react';
import DashboardLayout from './layout/DashboardLayout';

export default function App() {
  // -------------------------------------------------------------
  // 1. Overview & Posture
  // -------------------------------------------------------------
  const [postponeMessage, setPostponeMessage] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'short',
          day: 'numeric',
        })
      );
    };
    updateTime();
  }, []);

  const handlePostponeAll = () => {
    setPostponeMessage(true);
    setTimeout(() => setPostponeMessage(false), 3000);
  };

  // -------------------------------------------------------------
  // 2. The Later List (Deferral Queue)
  // -------------------------------------------------------------
  const [tasks, setTasks] = useState([
    {
      id: 1,
      title: 'Review Q4 budget spreadsheet',
      due: 'Next week maybe',
      completed: false,
    },
    {
      id: 2,
      title: 'Respond to 14-person email thread',
      due: 'When ready',
      completed: false,
    },
    {
      id: 3,
      title: 'Fix minor CSS bug on staging',
      due: 'Eventually',
      completed: false,
    },
    {
      id: 4,
      title: 'Draft quarterly self-assessment',
      due: 'Ugma puhon',
      completed: false,
    },
  ]);
  const [newTaskText, setNewTaskText] = useState('');
  const [confirmTask, setConfirmTask] = useState(null);

  const delayTask = (id) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, due: 'Pushed +1 day' } : t))
    );
  };

  const handleCheckboxClick = (task) => {
    setConfirmTask(task);
  };

  const markDoneAnyway = () => {
    if (confirmTask) {
      setTasks((prev) =>
        prev.map((t) => (t.id === confirmTask.id ? { ...t, completed: true } : t))
      );
      setConfirmTask(null);
    }
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    setTasks((prev) => [
      ...prev,
      {
        id: Date.now(),
        title: newTaskText.trim(),
        due: 'Later',
        completed: false,
      },
    ]);
    setNewTaskText('');
  };

  // -------------------------------------------------------------
  // 3. Protected Break Timer
  // -------------------------------------------------------------
  const [secondsLeft, setSecondsLeft] = useState(3000); // 50:00
  const [timerRunning, setTimerRunning] = useState(false);
  const [ambientSound, setAmbientSound] = useState('Off');

  useEffect(() => {
    if (!timerRunning) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning]);

  const formatTimer = (totalSecs) => {
    const m = Math.floor(totalSecs / 60).toString().padStart(2, '0');
    const s = (totalSecs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const addTime = (mins) => {
    setSecondsLeft((prev) => prev + mins * 60);
  };

  // -------------------------------------------------------------
  // 4. Bisaya Wisdom & Scratchpad
  // -------------------------------------------------------------
  const proverbs = [
    {
      quote: 'Unya na lang na, dili bitaw na mangluod.',
      translation: 'Leave it for later; it won’t get its feelings hurt.',
      context: 'On urgent-sounding tasks that can comfortably wait.',
    },
    {
      quote: 'Way lumba sa lubong, chill sa ta.',
      translation: 'There is no race to the grave; let’s take it easy.',
      context: 'On artificial deadlines and workplace rush.',
    },
    {
      quote: 'Ugma na puhon, tawo ra ta kapoyon sab.',
      translation: 'Tomorrow hopefully; we are only human, we get tired too.',
      context: 'On recognizing when the day is done.',
    },
    {
      quote: 'Pahuway sad panagsa.',
      translation: 'Rest once in a while.',
      context: 'The simplest and best piece of advice.',
    },
  ];

  const [proverbIndex, setProverbIndex] = useState(0);
  const nextProverb = () => {
    setProverbIndex((prev) => (prev + 1) % proverbs.length);
  };

  const [notes, setNotes] = useState(
    'Ideas for later:\n- Think about redesigning that component\n- Maybe look into that new framework next week\n- Remember to drink some water'
  );

  return (
    <DashboardLayout>
      {/* ============================================================== */}
      {/* STATION 1: The Overview (Pace & Horizon)                       */}
      {/* ============================================================== */}
      <section className="flex h-full min-w-[360px] max-w-[400px] flex-col justify-between border-r border-slate-200/80 bg-white p-8 shrink-0">
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#1752F0]" />
              <span className="text-xs font-semibold text-[#1752F0]">
                {currentTime || 'Today'}
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 mt-2">
              Unya na.
            </h1>
            <p className="text-sm text-slate-500 mt-1 leading-relaxed">
              Take your time. Nothing truly needs to happen right this second.
            </p>
          </div>

          {/* Clean Metric Cards */}
          <div className="space-y-2.5">
            <div className="rounded-xl border border-slate-200/90 bg-slate-50/50 p-4">
              <span className="text-xs font-medium text-slate-500">
                Queued for later
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-slate-900">
                  {tasks.filter((t) => !t.completed).length} items
                </span>
                <span className="text-xs text-slate-500">safely deferred</span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200/90 bg-slate-50/50 p-4">
              <span className="text-xs font-medium text-slate-500">
                Current mode
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-base font-semibold text-slate-800">
                  Unbothered
                </span>
                <span className="text-xs font-medium text-[#1752F0] bg-[#1752F0]/10 px-2 py-0.5 rounded-md">
                  Optimal
                </span>
              </div>
            </div>
          </div>

          {/* Master Postpone Action */}
          <div>
            <button
              type="button"
              onClick={handlePostponeAll}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#1752F0] px-4 py-3 text-xs font-semibold text-white hover:bg-[#1242c7] active:scale-98 transition-all cursor-pointer shadow-xs"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>Push everything to tomorrow</span>
            </button>

            {postponeMessage && (
              <div className="mt-2.5 rounded-lg bg-emerald-50 border border-emerald-200 p-2.5 text-xs font-medium text-emerald-800 text-center animate-in fade-in">
                ✓ All items postponed to tomorrow puhon.
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 pt-4 border-t border-slate-100">
          <span>Scroll horizontally for more</span>
          <svg className="w-4 h-4 text-[#1752F0]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </div>
      </section>

      {/* ============================================================== */}
      {/* STATION 2: The Later List (Task Deferral Queue)                 */}
      {/* ============================================================== */}
      <section className="flex h-full min-w-[460px] max-w-[500px] flex-col justify-between border-r border-slate-200/80 bg-white p-8 shrink-0">
        <div className="space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-baseline justify-between">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900">
                The Later List
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Tasks waiting patiently for inspiration.
              </p>
            </div>
            <span className="text-xs font-medium text-slate-400">
              {tasks.filter((t) => !t.completed).length} pending
            </span>
          </div>

          {/* Task List */}
          {tasks.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 rounded-xl border border-slate-200/90 bg-slate-50/50">
              No pending tasks. Everything has been successfully postponed.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 rounded-xl border border-slate-200/90 overflow-hidden">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={`flex items-center justify-between p-3.5 transition-colors ${
                    task.completed ? 'bg-slate-50/60 opacity-50' : 'hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-3">
                    <button
                      type="button"
                      onClick={() => handleCheckboxClick(task)}
                      aria-label={task.completed ? "Mark task incomplete" : "Complete task"}
                      className={`h-4 w-4 rounded border flex items-center justify-center transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1752F0] ${
                        task.completed
                          ? 'bg-[#1752F0] border-[#1752F0] text-white'
                          : 'border-slate-300 bg-white hover:border-[#1752F0]'
                      }`}
                    >
                      {task.completed && (
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                    <span
                      className={`text-xs font-medium truncate ${
                        task.completed ? 'line-through text-slate-400' : 'text-slate-800'
                      }`}
                    >
                      {task.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] text-slate-500 font-medium">
                      {task.due}
                    </span>
                    {!task.completed && (
                      <button
                        type="button"
                        onClick={() => delayTask(task.id)}
                        aria-label={`Delay ${task.title} by one day`}
                        className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-600 hover:border-[#1752F0] hover:text-[#1752F0] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1752F0]"
                        title="Postpone by 1 day"
                      >
                        +1d
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Confirmation Prompt when user clicks a task */}
          {confirmTask && (
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 space-y-2.5 animate-in fade-in">
              <p className="text-xs text-slate-700">
                Are you sure you want to do <strong>&ldquo;{confirmTask.title}&rdquo;</strong> right now? It is totally fine to leave it for later.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmTask(null)}
                  className="rounded-lg bg-[#1752F0] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1242c7] cursor-pointer"
                >
                  Save for later
                </button>
                <button
                  type="button"
                  onClick={markDoneAnyway}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Mark done anyway
                </button>
              </div>
            </div>
          )}

          {/* Add Task Form */}
          <form onSubmit={handleAddTask} className="flex gap-2 pt-1">
            <input
              type="text"
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              aria-label="New task to postpone"
              placeholder="Add something to do later..."
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#1752F0] focus:bg-white transition-all focus-visible:ring-1 focus-visible:ring-[#1752F0]"
            />
            <button
              type="submit"
              aria-label="Add task to list"
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1752F0]"
            >
              Add
            </button>
          </form>
        </div>

        <p className="text-[11px] text-slate-400 pt-3 border-t border-slate-100">
          Procrastination is just prioritization with extra self-care.
        </p>
      </section>

      {/* ============================================================== */}
      {/* STATION 3: Protected Break (Calm Timer)                        */}
      {/* ============================================================== */}
      <section className="flex h-full min-w-[380px] max-w-[420px] flex-col justify-between border-r border-slate-200/80 bg-white p-8 shrink-0">
        <div className="space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-lg font-bold tracking-tight text-slate-900">
              Protected Break
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Dedicated time for doing nothing in particular.
            </p>
          </div>

          {/* Minimalist Tabular Timer */}
          <div className="rounded-2xl border border-slate-200/90 bg-slate-50/40 p-6 text-center space-y-4">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">
              {timerRunning ? 'Break in progress' : 'Break paused'}
            </span>

            <div className="font-mono text-5xl font-bold tracking-tight text-slate-900 tnum">
              {formatTimer(secondsLeft)}
            </div>

            <div className="flex gap-2 justify-center pt-2">
              <button
                type="button"
                onClick={() => setTimerRunning((prev) => !prev)}
                className="flex-1 rounded-xl bg-[#1752F0] py-2.5 text-xs font-semibold text-white hover:bg-[#1242c7] active:scale-98 transition-all cursor-pointer shadow-xs"
              >
                {timerRunning ? 'Pause' : 'Start Break'}
              </button>
              <button
                type="button"
                onClick={() => addTime(15)}
                className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 active:scale-98 transition-all cursor-pointer"
              >
                +15m
              </button>
            </div>
          </div>

          {/* Ambient Background Audio Selector */}
          <div className="rounded-xl border border-slate-200/90 p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Ambient sound</span>
              <span className="text-[#1752F0] font-medium">{ambientSound}</span>
            </div>
            <div className="grid grid-cols-4 gap-1">
              {['Off', 'Rain', 'Café', 'Waves'].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setAmbientSound(s)}
                  className={`py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                    ambientSound === s
                      ? 'bg-[#1752F0] text-white'
                      : 'bg-slate-100/70 text-slate-600 hover:bg-slate-200/70'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 pt-3 border-t border-slate-100">
          The timer will not judge you if you let it run indefinitely.
        </p>
      </section>

      {/* ============================================================== */}
      {/* STATION 4: Wisdom & Scratchpad                                 */}
      {/* ============================================================== */}
      <section className="flex h-full min-w-[420px] max-w-[460px] flex-col justify-between border-r border-slate-200/80 bg-white p-8 shrink-0">
        <div className="space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-baseline justify-between">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900">
                Unya Na Wisdom
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Visayan philosophy on rest and patience.
              </p>
            </div>
            <button
              type="button"
              onClick={nextProverb}
              aria-label="Show next Visayan proverb"
              className="text-xs font-semibold text-[#1752F0] hover:underline cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#1752F0]"
            >
              Next proverb
            </button>
          </div>

          {/* Proverb Card */}
          <div className="rounded-xl border border-slate-200/90 bg-slate-50/50 p-4 space-y-2">
            <blockquote className="text-sm font-semibold text-slate-800 leading-snug italic border-l-2 border-[#1752F0] pl-3">
              &ldquo;{proverbs[proverbIndex].quote}&rdquo;
            </blockquote>
            <p className="text-xs text-slate-600 pl-3">
              {proverbs[proverbIndex].translation}
            </p>
            <p className="text-[11px] text-slate-400 pl-3">
              {proverbs[proverbIndex].context}
            </p>
          </div>

          {/* Quick Scratchpad */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="scratchpad-notes" className="font-semibold text-slate-700">
                Scratchpad
              </label>
              <span className="text-slate-400 text-[11px]">Auto-saved</span>
            </div>
            <textarea
              id="scratchpad-notes"
              rows={5}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              aria-label="Scratchpad notes"
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/30 p-3 text-xs text-slate-800 outline-none focus:border-[#1752F0] focus:bg-white leading-relaxed transition-all focus-visible:ring-1 focus-visible:ring-[#1752F0]"
            />
          </div>
        </div>

        <p className="text-[11px] text-slate-400 pt-3 border-t border-slate-100">
          Unya Na: for when tomorrow is good enough.
        </p>
      </section>

      {/* ============================================================== */}
      {/* STATION 5: The End of the Line                                 */}
      {/* ============================================================== */}
      <section className="flex h-full min-w-[300px] items-center justify-center p-8 shrink-0 text-center">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 space-y-3 max-w-xs">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-[#1752F0]/10 text-[#1752F0] font-bold">
            ✓
          </div>
          <h3 className="text-sm font-bold text-slate-900">
            End of the line
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            You reached the end without doing any work. Well done.
          </p>
          <div className="text-xs font-semibold text-[#1752F0] pt-1">
            ← Scroll back whenever you like
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
}
