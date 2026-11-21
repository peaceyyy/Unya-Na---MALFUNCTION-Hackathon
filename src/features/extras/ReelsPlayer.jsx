import React, { useCallback, useEffect, useRef, useState } from 'react';
import styles from './ReelsPlayer.module.css';
import { announceReel, announceReelsStopped } from './reelsBus';

// Plays Instagram reels from the local reels server (reels-server/app.py) and moves on to
// the next one every REEL_SECONDS, whatever the reel's own length: shorter reels loop until
// the time is up and longer ones are cut off.

const API = '/reels-api/api/reels'; // the Vite dev server forwards this to http://127.0.0.1:8765
export const REEL_SECONDS = 15;
const BATCH = 8; // reels asked for at a time
const FETCH_WHEN_LEFT = 3; // ask for more when this few are left
const MAX_PLAY_ERRORS = 3; // give up after this many reels in a row fail to play

async function fetchFeed() {
  let response;
  try {
    response = await fetch(`${API}/feed?count=${BATCH}`);
  } catch {
    throw { kind: 'offline' };
  }
  let body = null;
  try {
    body = await response.json();
  } catch {
    // not JSON
  }
  // With nothing listening on the port the Vite proxy answers 500/502/504 with no JSON body.
  if (!response.ok && !body?.reason) throw { kind: 'offline' };
  if (!response.ok) throw { kind: body.reason, message: body.message };
  return body.items || [];
}

function Control({ label, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-md transition-colors hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
    >
      {children}
    </button>
  );
}

const icon = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.4,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

export default function ReelsPlayer() {
  const [items, setItems] = useState([]);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState('loading'); // loading | playing | offline | error
  const [problem, setProblem] = useState('');
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);

  const videoRef = useRef(null);
  const itemsRef = useRef([]);
  const seen = useRef(new Set());
  const loadingMore = useRef(false);
  const alive = useRef(true);
  const playErrors = useRef(0);
  const remaining = useRef(REEL_SECONDS * 1000);
  const startedAt = useRef(0);

  const loadMore = useCallback(async () => {
    if (loadingMore.current) return;
    loadingMore.current = true;
    try {
      const fresh = (await fetchFeed()).filter((item) => !seen.current.has(item.id));
      if (!alive.current) return;
      fresh.forEach((item) => seen.current.add(item.id));
      itemsRef.current = [...itemsRef.current, ...fresh];
      setItems(itemsRef.current);
      if (itemsRef.current.length) setPhase('playing');
      else {
        setProblem('Instagram did not return any reels.');
        setPhase('error');
      }
    } catch (error) {
      if (!alive.current || itemsRef.current.length) return; // keep looping what we already have
      setProblem(error.message || '');
      setPhase(error.kind === 'offline' ? 'offline' : 'error');
    } finally {
      loadingMore.current = false;
    }
  }, []);

  const retry = useCallback(() => {
    playErrors.current = 0;
    setPhase('loading');
    loadMore();
  }, [loadMore]);

  const go = useCallback((step) => {
    const count = itemsRef.current.length;
    if (count) setIndex((i) => (i + step + count) % count);
  }, []);
  const next = useCallback(() => go(1), [go]);

  useEffect(() => {
    alive.current = true;
    loadMore();
    return () => {
      alive.current = false;
    };
  }, [loadMore]);

  // Keep a few reels ahead.
  useEffect(() => {
    if (phase === 'playing' && items.length - index <= FETCH_WHEN_LEFT) loadMore();
  }, [phase, items.length, index, loadMore]);

  // A new reel starts with a full 15 seconds. (Declared before the timer effect on purpose.)
  useEffect(() => {
    remaining.current = REEL_SECONDS * 1000;
  }, [index]);

  // The 15-second timer. Pausing keeps what is left, so resuming carries on from there.
  useEffect(() => {
    if (phase !== 'playing' || paused || !items.length) return undefined;
    startedAt.current = Date.now();
    const timer = setTimeout(next, remaining.current);
    return () => {
      clearTimeout(timer);
      remaining.current = Math.max(0, remaining.current - (Date.now() - startedAt.current));
    };
  }, [index, phase, paused, items.length, next]);

  const current = items[index];

  // Let the assistant know what is on screen (it comments on reels), and when nothing is.
  useEffect(() => {
    if (phase === 'playing' && current) {
      announceReel({
        id: current.id,
        user: current.user,
        caption: current.caption,
        alt: current.alt,
        sound: current.sound,
      });
    } else {
      announceReelsStopped();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id, phase]);
  useEffect(() => announceReelsStopped, []);

  // Start each reel. Sound first; if the browser refuses, fall back to muted.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || phase !== 'playing') return;
    video.muted = muted;
    if (paused) return;
    video.play().catch(() => {
      video.muted = true;
      setMuted(true);
      video.play().catch(() => {});
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id, phase]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (paused) video.pause();
    else video.play().catch(() => {});
  }, [paused]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted;
  }, [muted]);

  function onVideoError() {
    playErrors.current += 1;
    if (playErrors.current >= MAX_PLAY_ERRORS) {
      setProblem('Reels would not play. The reels server may have lost its Instagram login.');
      setPhase('error');
    } else {
      next();
    }
  }

  if (phase === 'loading') {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-900 text-xs text-white/80">
        Finding reels…
      </div>
    );
  }

  if (phase === 'offline' || phase === 'error') {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-slate-900 p-4 text-center text-xs leading-relaxed text-white/85">
        {phase === 'offline' ? (
          <>
            <p className="text-sm font-semibold text-white">The reels server is not running</p>
            <p>Start it in a terminal:</p>
            <code className="rounded bg-black/40 px-2 py-1 text-left text-[11px] text-sky-200">
              cd reels-server
              <br />
              python app.py
            </code>
          </>
        ) : (
          <>
            <p className="text-sm font-semibold text-white">No reels right now</p>
            <p>{problem || 'Something went wrong.'}</p>
          </>
        )}
        <button
          type="button"
          onClick={retry}
          className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 transition-colors hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
        >
          Try again
        </button>
      </div>
    );
  }

  const upcoming = items[(index + 1) % items.length];

  return (
    <div className="relative h-full w-full bg-black">
      <video
        key={current.id}
        ref={videoRef}
        src={`${API}/video/${current.id}`}
        loop
        playsInline
        preload="auto"
        onPlaying={() => {
          playErrors.current = 0;
        }}
        onError={onVideoError}
        className="h-full w-full object-cover"
        aria-label={`Reel by ${current.user || 'unknown'}`}
      />

      {/* Load the next reel in the background so the switch is instant. */}
      {upcoming && upcoming.id !== current.id && (
        <video key={`next-${upcoming.id}`} src={`${API}/video/${upcoming.id}`} preload="auto" muted className="hidden" aria-hidden="true" />
      )}

      {/* Who it is by and what it says */}
      <div className="pointer-events-none absolute inset-x-0 bottom-3 bg-gradient-to-t from-black/70 to-transparent px-3 pb-2 pt-8 text-white">
        {current.user && <p className="truncate text-xs font-semibold">@{current.user}</p>}
        {current.caption && <p className="line-clamp-2 text-[11px] leading-snug text-white/85">{current.caption}</p>}
      </div>

      {/* Controls appear on hover or keyboard focus */}
      <div className="absolute inset-x-0 bottom-10 flex items-center justify-center gap-2 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
        <Control label="Previous reel" onClick={() => go(-1)}>
          <svg className="h-4 w-4" viewBox="0 0 24 24" {...icon}><polyline points="15 18 9 12 15 6" /></svg>
        </Control>
        <Control label={paused ? 'Resume' : 'Pause'} onClick={() => setPaused((p) => !p)}>
          {paused ? (
            <svg className="h-4 w-4" viewBox="0 0 24 24" {...icon}><polygon points="7 4 19 12 7 20 7 4" /></svg>
          ) : (
            <svg className="h-4 w-4" viewBox="0 0 24 24" {...icon}><line x1="8" y1="5" x2="8" y2="19" /><line x1="16" y1="5" x2="16" y2="19" /></svg>
          )}
        </Control>
        <Control label="Next reel" onClick={next}>
          <svg className="h-4 w-4" viewBox="0 0 24 24" {...icon}><polyline points="9 18 15 12 9 6" /></svg>
        </Control>
        <Control label={muted ? 'Turn sound on' : 'Mute'} onClick={() => setMuted((m) => !m)}>
          {muted ? (
            <svg className="h-4 w-4" viewBox="0 0 24 24" {...icon}><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><line x1="22" y1="9" x2="16" y2="15" /><line x1="16" y1="9" x2="22" y2="15" /></svg>
          ) : (
            <svg className="h-4 w-4" viewBox="0 0 24 24" {...icon}><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.5 8.5a5 5 0 0 1 0 7" /></svg>
          )}
        </Control>
      </div>

      {/* Fills over the 15 seconds this reel gets */}
      <div className="absolute inset-x-0 bottom-0 h-1.5 bg-white/25" aria-hidden="true">
        <div
          key={current.id}
          className={styles.bar}
          style={{ animationDuration: `${REEL_SECONDS}s`, animationPlayState: paused ? 'paused' : 'running' }}
          data-reel-progress=""
        />
      </div>
    </div>
  );
}
