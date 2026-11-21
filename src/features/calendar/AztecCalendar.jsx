import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './AztecCalendar.module.css';

const SIGNS = [
  ['Crocodile', 'Cipactli'], ['Wind', 'Ehecatl'], ['House', 'Calli'], ['Lizard', 'Cuetzpalin'],
  ['Serpent', 'Coatl'], ['Death', 'Miquiztli'], ['Deer', 'Mazatl'], ['Rabbit', 'Tochtli'],
  ['Water', 'Atl'], ['Dog', 'Itzcuintli'], ['Monkey', 'Ozomatli'], ['Grass', 'Malinalli'],
  ['Reed', 'Acatl'], ['Jaguar', 'Ocelotl'], ['Eagle', 'Cuauhtli'], ['Vulture', 'Cozcacuauhtli'],
  ['Movement', 'Ollin'], ['Flint Knife', 'Tecpatl'], ['Rain', 'Quiahuitl'], ['Flower', 'Xochitl'],
];
const NUMS = [
  'Ce', 'Ome', 'Yei', 'Nahui', 'Macuilli', 'Chicuace', 'Chicome', 'Chicuei', 'Chiconahui',
  'Mahtlactli', 'Mahtlactli-once', 'Mahtlactli-omome', 'Mahtlactli-omei',
];
const MONTHS = [
  'Atlcahualo', 'Tlacaxipehualiztli', 'Tozoztontli', 'Huey Tozoztli', 'Toxcatl', 'Etzalcualiztli',
  'Tecuilhuitontli', 'Huey Tecuilhuitl', 'Tlaxochimaco', 'Xocotl Huetzi', 'Ochpaniztli', 'Teotleco',
  'Tepeilhuitl', 'Quecholli', 'Panquetzaliztli', 'Atemoztli', 'Tititl', 'Izcalli', 'Nemontemi',
];
const DIRS = ['East', 'North', 'West', 'South'];

// Whole days from 1970-01-01 back to 1 Serpent (Caso correlation).
const ANCHOR = 163760;
const NOTES_KEY = 'unproductive_aztec_notes';
const SIGN_STEP = 360 / 20;
const NUM_STEP = 360 / 13;

const mod = (a, n) => ((a % n) + n) % n;

function todayCount() {
  const t = new Date();
  return Math.round(Date.UTC(t.getFullYear(), t.getMonth(), t.getDate()) / 864e5);
}

function aztec(n) {
  const delta = n + ANCHOR;
  const num = mod(delta, 13) + 1;
  const sign = mod(delta + 4, 20);
  let pos = 1;
  for (let p = 0; p < 260; p += 1) {
    if (p % 13 === num - 1 && p % 20 === sign) {
      pos = p + 1;
      break;
    }
  }
  const doy = mod(181 + delta, 365);
  return {
    num,
    sign,
    pos,
    trecena: mod(sign - (num - 1), 20),
    dir: sign % 4,
    month: Math.floor(doy / 20),
    mday: (doy % 20) + 1,
  };
}

// Move one sign and/or one number. The wheels are independent, so the day that
// carries the new pairing can be anywhere in the next (or previous) 260 days.
function stepDays(dSign, dNum) {
  const forward = dSign > 0 || dNum > 0;
  for (let k = 1; k <= 260; k += 1) {
    const d = forward ? k : -k;
    if (mod(d, 20) === mod(dSign, 20) && mod(d, 13) === mod(dNum, 13)) return d;
  }
  return 0;
}

// Nahuatl numerals are base 20 (pohualli = a score).
const UNITS = [
  '', 'ce', 'ome', 'yei', 'nahui', 'macuilli', 'chicuace', 'chicome', 'chicuei', 'chiconahui',
  'mahtlactli', 'mahtlactli once', 'mahtlactli omome', 'mahtlactli omei', 'mahtlactli onnahui',
  'caxtolli', 'caxtolli once', 'caxtolli omome', 'caxtolli omei', 'caxtolli onnahui',
];
const SCORE_STEMS = ['', 'cem', 'om', 'ye', 'nauh', 'macuil', 'chicuace', 'chicom', 'chicuei', 'chiconauh', 'mahtlac'];

function nahuatlNumber(n) {
  if (n === 0) return 'axcan';
  const scores = Math.floor(n / 20);
  const rest = n % 20;
  if (scores === 0) return UNITS[rest];
  const stem = scores <= 10 ? SCORE_STEMS[scores] : UNITS[scores];
  const head = `${stem}${scores <= 10 ? '' : ' '}pohualli`;
  return rest ? `${head} ihuan ${UNITS[rest]}` : head;
}

function daysToChristmas(todayN) {
  const year = new Date(todayN * 864e5).getUTCFullYear();
  let xmas = Math.round(Date.UTC(year, 11, 25) / 864e5);
  if (xmas < todayN) xmas = Math.round(Date.UTC(year + 1, 11, 25) / 864e5);
  return { days: xmas - todayN, xmas };
}

function pol(r, deg) {
  const a = ((deg - 90) * Math.PI) / 180;
  return [r * Math.cos(a), r * Math.sin(a)];
}

function wedge(r1, r2, a1, a2) {
  const [x1, y1] = pol(r2, a1);
  const [x2, y2] = pol(r2, a2);
  const [x3, y3] = pol(r1, a2);
  const [x4, y4] = pol(r1, a1);
  return `M${x1} ${y1}A${r2} ${r2} 0 0 1 ${x2} ${y2}L${x3} ${y3}A${r1} ${r1} 0 0 0 ${x4} ${y4}Z`;
}

function loadNotes() {
  try {
    return JSON.parse(localStorage.getItem(NOTES_KEY) || '{}');
  } catch {
    return {};
  }
}

// Same motion as the original wheel: a long ease-out turn (see .ring in the
// stylesheet) that always takes the shortest way round.
function useRingTurn(outerRef, innerRef, outerTarget, innerTarget) {
  const angles = useRef({ outer: 0, inner: 0 });

  useEffect(() => {
    const turn = (cur, target) => cur + (mod(target - cur + 180, 360) - 180);
    angles.current.outer = turn(angles.current.outer, outerTarget);
    angles.current.inner = turn(angles.current.inner, innerTarget);
    if (outerRef.current) outerRef.current.style.transform = `rotate(${angles.current.outer}deg)`;
    if (innerRef.current) innerRef.current.style.transform = `rotate(${angles.current.inner}deg)`;
  }, [outerTarget, innerTarget, outerRef, innerRef]);
}

function Key({ children }) {
  return (
    <kbd className="inline-flex h-6 min-w-6 items-center justify-center rounded-md border border-border-strong bg-surface-subtle px-1.5 text-xs font-semibold text-ink">
      {children}
    </kbd>
  );
}

function JoseMariChan({ todayN }) {
  const [open, setOpen] = useState(false);
  const { days, xmas } = daysToChristmas(todayN);
  const xa = aztec(xmas);
  return (
    <div className="relative -mb-6 -mr-6 shrink-0">
      {open && (
        <div
          role="status"
          className={`${styles.bubble} absolute bottom-full right-6 z-10 mb-3 w-64 rounded-2xl border border-border bg-surface p-4 shadow-lg`}
        >
          <p className="text-xs font-medium uppercase tracking-widest text-ink-muted">Until Christmas</p>
          <p className="mt-1 font-display text-2xl font-bold capitalize leading-tight text-ink">
            {nahuatlNumber(days)}
          </p>
          <p className="tnum text-sm text-ink-secondary">{days} {days === 1 ? 'day' : 'days'}</p>
          <p className="mt-3 border-t border-border pt-3 text-sm text-ink-secondary">
            Christmas falls on {xa.num} {SIGNS[xa.sign][0]},{' '}
            <span className="italic">{NUMS[xa.num - 1]} {SIGNS[xa.sign][1]}</span>.
          </p>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Jose Mari Chan: days until Christmas"
        className="relative block cursor-pointer overflow-hidden outline-none focus:outline-none focus-visible:outline-none"
        style={{ height: '190px', width: '68px' }}
      >
        <img
          src="/jose-mari-chan.png"
          alt=""
          draggable="false"
          className={`${styles.jose} absolute bottom-0 right-0 h-full w-auto max-w-none -scale-x-100 select-none`}
        />
      </button>
    </div>
  );
}

export default function AztecCalendar() {
  const [today] = useState(todayCount);
  const [day, setDay] = useState(today);
  const [notes, setNotes] = useState(loadNotes);
  const outerRef = useRef(null);
  const innerRef = useRef(null);

  const a = useMemo(() => aztec(day), [day]);

  useRingTurn(outerRef, innerRef, a.sign * SIGN_STEP, (a.num - 1) * NUM_STEP);

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest?.('textarea, input')) return;
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      let move = 0;
      if (e.key === 'ArrowRight') move = stepDays(1, 0);
      else if (e.key === 'ArrowLeft') move = stepDays(-1, 0);
      else if (e.key === 'ArrowUp') move = stepDays(0, 1);
      else if (e.key === 'ArrowDown') move = stepDays(0, -1);
      else return;
      e.preventDefault();
      setDay((d) => d + move);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
    } catch {
      // Notes just won't persist.
    }
  }, [notes]);

  // A note only unlocks once the day's Nahuatl name has been typed out.
  const [typed, setTyped] = useState({ day: null, text: '' });
  const [unlockedDay, setUnlockedDay] = useState(null);
  const unlocked = unlockedDay === day;
  const typedText = typed.day === day ? typed.text : '';
  const answer = `${NUMS[a.num - 1]} ${SIGNS[a.sign][1]}`;
  const normalise = (s) => s.toLowerCase().replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
  const onTyped = (text) => {
    setTyped({ day, text });
    if (normalise(text) === normalise(answer)) setUnlockedDay(day);
  };

  // Typing edits a draft; nothing is stored until Save is pressed.
  const [draft, setDraft] = useState({ day: null, text: '' });
  const saved = notes[day] || '';
  const note = draft.day === day ? draft.text : saved;
  const dirty = note !== saved;
  const saveNote = () =>
    setNotes((prev) => {
      const next = { ...prev };
      if (note.trim()) next[day] = note;
      else delete next[day];
      return next;
    });

  const monthDays = useMemo(() => {
    const first = day - (a.mday - 1);
    const length = a.month === 18 ? 5 : 20;
    return Array.from({ length }, (_, i) => ({ n: first + i, mday: i + 1, az: aztec(first + i) }));
  }, [day, a.mday, a.month]);

  const signName = `${a.num} ${SIGNS[a.sign][0]}`;
  const signNah = `${NUMS[a.num - 1]} ${SIGNS[a.sign][1]}`;
  const numRows = a.num > 7 ? [7, a.num - 7] : [a.num];

  return (
    <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <div className="flex flex-col items-center gap-4">
        <svg
          viewBox="-310 -325 620 640"
          className="h-auto w-full max-w-[560px] select-none"
          style={{ pointerEvents: 'none', maxHeight: 'calc(100vh - 260px)' }}
          role="img"
          aria-label={`Day wheel showing ${signName}`}
        >
          <circle r="298" className={styles.band} />

          <g ref={outerRef} className={styles.ring}>
            {SIGNS.map(([en, nah], i) => {
              const ang = -i * SIGN_STEP;
              return (
                <g key={en}>
                  <path
                    d={wedge(228, 292, ang - SIGN_STEP / 2, ang + SIGN_STEP / 2)}
                    className={`${styles.seg} ${styles[`d${i % 4}`]} ${i === a.sign ? styles.on : ''}`}
                  />
                  <g transform={`rotate(${ang})`}>
                    <text y="-276" className={styles.idx}>{i + 1}</text>
                    <text y="-258" className={styles.lbl} style={en.length > 8 ? { fontSize: 9.5 } : undefined}>
                      {en}
                    </text>
                    <text y="-242" className={styles.nah} style={nah.length > 10 ? { fontSize: 8.5 } : undefined}>
                      {nah}
                    </text>
                  </g>
                </g>
              );
            })}
          </g>

          <g ref={innerRef} className={styles.ring}>
            {Array.from({ length: 13 }, (_, n) => {
              const ang = -n * NUM_STEP;
              const count = n + 1;
              const rows = count > 7 ? [7, count - 7] : [count];
              const radii = [204, 186];
              return (
                <g key={n}>
                  <path
                    d={wedge(166, 220, ang - NUM_STEP / 2, ang + NUM_STEP / 2)}
                    className={`${styles.nseg} ${n === a.num - 1 ? styles.nOn : ''}`}
                  />
                  {rows.map((c, ri) => {
                    const r = radii[ri];
                    const step = ((8.6 / r) * 180) / Math.PI;
                    return Array.from({ length: c }, (_, k) => {
                      const [x, y] = pol(r, ang + (k - (c - 1) / 2) * step);
                      return <circle key={`${ri}-${k}`} cx={x} cy={y} r="3.2" className={styles.ndot} />;
                    });
                  })}
                </g>
              );
            })}
          </g>

          <circle r="158" className={styles.face} />
          <circle r="146" className={styles.band} />
          <path d="M-13 -318 L13 -318 L0 -296 Z" className={styles.pointer} />

          {numRows.map((c, ri) =>
            Array.from({ length: c }, (_, k) => (
              <circle key={`${ri}-${k}`} cx={(k - (c - 1) / 2) * 20} cy={-64 + ri * 20} r="7" className={styles.cNum} />
            )),
          )}
          <text y="12" className={styles.cSign} style={SIGNS[a.sign][0].length > 8 ? { fontSize: 28 } : undefined}>
            {SIGNS[a.sign][0]}
          </text>
          <text y="42" className={styles.cNah}>{signNah}</text>
          <text y="78" className={styles.cMeta}>DAY {a.pos} OF 260</text>
        </svg>

        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-ink-secondary">
          <span className="inline-flex items-center gap-2">
            <Key>←</Key><Key>→</Key> turn the signs
          </span>
          <span className="inline-flex items-center gap-2">
            <Key>↑</Key><Key>↓</Key> turn the numbers
          </span>
        </div>
        <button
          type="button"
          onClick={() => setDay(today)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-canvas transition-colors hover:bg-ink-secondary outline-none focus:outline-none focus-visible:outline-none"
        >
          Today
        </button>
        <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-ink-muted" aria-label="Direction colours">
          {DIRS.map((d, i) => (
            <li key={d} className="inline-flex items-center gap-1.5">
              <i className={`${styles.sw} ${styles[`s${i}`]}`} />
              {d}
            </li>
          ))}
        </ul>
      </div>

      <section className="relative flex flex-col gap-5 overflow-hidden rounded-2xl border border-border bg-surface p-6" aria-live="polite">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-ink-muted">Tonalpohualli</p>
          <h2 className="mt-1 font-display text-3xl font-bold leading-tight tracking-tight text-ink">{signName}</h2>
          <p className="text-base italic text-ink-secondary">{signNah}</p>
        </div>

        <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 text-sm">
          <dt className="text-ink-muted">Day of the count</dt>
          <dd className="tnum text-ink">{a.pos} of 260</dd>
          <dt className="text-ink-muted">Trecena</dt>
          <dd className="text-ink">1 {SIGNS[a.trecena][0]} (day {a.num} of 13)</dd>
          <dt className="text-ink-muted">Direction</dt>
          <dd className="inline-flex items-center gap-2 text-ink">
            <i className={`${styles.sw} ${styles[`s${a.dir}`]}`} />
            {DIRS[a.dir]}
          </dd>
          <dt className="text-ink-muted">Solar month</dt>
          <dd className="text-ink">
            {a.month === 18
              ? `Nemontemi, day ${a.mday} of 5`
              : `${MONTHS[a.month]}, day ${a.mday} of 20`}
          </dd>
        </dl>

        <div className="space-y-3">
          <div>
            <label htmlFor="aztec-name" className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-ink-muted">
              {unlocked ? 'Day name accepted' : 'Write the day name to unlock a note'}
            </label>
            <input
              id="aztec-name"
              type="text"
              value={unlocked ? answer : typedText}
              onChange={(e) => onTyped(e.target.value)}
              readOnly={unlocked}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              placeholder="Number and sign, in Nahuatl"
              className="w-full rounded-xl border border-border bg-canvas px-3.5 py-2.5 text-base text-ink placeholder:text-ink-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent read-only:text-accent"
            />
          </div>
          <div>
            <label htmlFor="aztec-note" className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-ink-muted">
              Note for this day
            </label>
            <textarea
              id="aztec-note"
              value={note}
              onChange={(e) => setDraft({ day, text: e.target.value })}
              disabled={!unlocked}
              data-gramm="false"
              data-gramm_editor="false"
              data-enable-grammarly="false"
              placeholder={unlocked ? 'Write a deadline here. Finding this day again is up to you.' : 'Locked until the day name above is written.'}
              className="h-36 w-full resize-none rounded-xl border border-border bg-canvas px-3.5 py-3 text-base leading-relaxed text-ink placeholder:text-ink-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60"
            />
          </div>
        </div>

        <div className="flex items-end justify-between gap-4">
          <button
            type="button"
            onClick={saveNote}
            disabled={!unlocked || !dirty}
            className="inline-flex items-center justify-center rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:bg-surface-subtle disabled:text-ink-muted"
          >
            {unlocked && !dirty && saved ? 'Saved' : 'Save note'}
          </button>
          <JoseMariChan todayN={today} />
        </div>
      </section>
      <section className="rounded-2xl border border-border bg-surface p-5 lg:col-span-2" aria-label="Solar month">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-2xl font-bold tracking-tight text-ink">{MONTHS[a.month]}</h2>
          <p className="text-xs font-medium uppercase tracking-widest text-ink-muted">
            {a.month === 18 ? 'The 5 empty days' : `Month ${a.month + 1} of 18 · 20 days`}
          </p>
        </div>
        <ol className="grid grid-cols-5 gap-1.5 sm:gap-2">
          {monthDays.map(({ n, mday, az }) => (
            <li
              key={n}
              aria-current={n === day ? 'date' : undefined}
              aria-label={`Day ${mday}, ${az.num} ${SIGNS[az.sign][0]}${notes[n] ? ', has a note' : ''}`}
              className={`${styles.cell} ${n === day ? styles.cellSel : ''} ${n === today ? styles.cellToday : ''}`}
            >
              <span className="tnum text-sm font-semibold text-ink sm:text-base">{mday}</span>
              <span className="flex min-w-0 items-center gap-1.5 text-xs text-ink-secondary">
                <i className={`${styles.sw} ${styles.swSm} ${styles[`s${az.dir}`]}`} />
                <span className="tnum">{az.num}</span>
                <span className="hidden truncate sm:inline">{SIGNS[az.sign][0]}</span>
              </span>
              {notes[n] && <span className={styles.pin} aria-hidden="true" />}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
