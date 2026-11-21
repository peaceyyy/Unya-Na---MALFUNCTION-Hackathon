import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import {
  MINUTE,
  alarmOptions,
  chooseAlarm,
  createPreview,
  resolveAlarm,
  snoozeAlarm,
  stopwatchElapsed,
} from './clockTime.js';

const ClockSession = createContext(null);
const initialStopwatch = { elapsedMs: 0, startedAt: null, laps: [] };

function useDeadline(scheduled, setState, resolve) {
  useEffect(() => {
    if (!scheduled) return;
    let timeout;

    function check() {
      window.clearTimeout(timeout);
      const now = Date.now();

      if (now >= scheduled.dueAt) {
        setState((current) => current === scheduled ? resolve(current, now) : current);
        return;
      }

      timeout = window.setTimeout(check, Math.min(scheduled.dueAt - now, MINUTE));
    }

    function checkWhenVisible() {
      if (document.visibilityState === 'visible') check();
    }

    check();
    document.addEventListener('visibilitychange', checkWhenVisible);
    return () => {
      window.clearTimeout(timeout);
      document.removeEventListener('visibilitychange', checkWhenVisible);
    };
  }, [scheduled, setState, resolve]);
}

function playBuiltInChime(context) {
  const notes = [
    { frequency: 659.25, at: 0 },
    { frequency: 783.99, at: 0.28 },
    { frequency: 659.25, at: 0.68 },
  ];
  const voices = notes.map(({ frequency, at }) => {
    const tone = context.createOscillator();
    const gain = context.createGain();
    const start = context.currentTime + at;
    const finish = start + 0.34;

    tone.type = 'sine';
    tone.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.001, start);
    gain.gain.exponentialRampToValueAtTime(0.34, start + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.001, finish);
    tone.connect(gain);
    gain.connect(context.destination);
    tone.start(start);
    tone.stop(finish);

    return { tone, gain };
  });

  return () => {
    for (const { tone, gain } of voices) {
      try { tone.stop(); } catch {}
      tone.disconnect();
      gain.disconnect();
    }
  };
}

function playRingtone(context, buffer, { loop = false, preview = false } = {}) {
  if (context?.state !== 'running') return () => {};
  if (!buffer) return playBuiltInChime(context);

  const source = context.createBufferSource();
  const volume = context.createGain();
  source.buffer = buffer;
  source.loop = loop;
  volume.gain.setValueAtTime(0.85, context.currentTime);
  source.connect(volume);
  volume.connect(context.destination);
  source.start();

  if (preview) {
    source.stop(context.currentTime + Math.min(buffer.duration, 5));
  }

  return () => {
    try { source.stop(); } catch {}
    source.disconnect();
    volume.disconnect();
  };
}

function useChime(audible) {
  const audio = useRef(null);
  const ringtone = useRef(null);
  const ringtoneRequest = useRef(null);
  const [soundMessage, setSoundMessage] = useState('');

  async function prepare() {
    try {
      const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextConstructor) throw new Error('Audio is unavailable in this browser.');
      audio.current ??= new AudioContextConstructor();
      if (audio.current.state !== 'running') await audio.current.resume();
      if (audio.current.state !== 'running') throw new Error('Sound is blocked by the browser.');

      if (!ringtone.current) {
        ringtoneRequest.current ??= fetch('/audio/alarm_ringtone.mp3')
          .then((response) => {
            if (!response.ok) throw new Error('Ringtone file could not be loaded.');
            return response.arrayBuffer();
          })
          .then((data) => audio.current.decodeAudioData(data))
          .then((buffer) => { ringtone.current = buffer; return buffer; })
          .catch(() => null);
        await ringtoneRequest.current;
      }

      setSoundMessage(ringtone.current
        ? 'Custom ringtone is ready.'
        : 'Custom ringtone could not load. Using the built-in chime.');
      return audio.current;
    } catch {
      setSoundMessage('Sound is unavailable. The on-screen alarm will still appear.');
      return null;
    }
  }

  function testSound() {
    void prepare().then((context) => {
      if (!context) return;
      playRingtone(context, ringtone.current, { preview: true });
      setSoundMessage(ringtone.current ? 'Ringtone preview played.' : 'Built-in chime played.');
    });
  }

  useEffect(() => {
    if (!audible) return;

    let stop;
    let repeat;
    let cancelled = false;

    async function ring() {
      const context = await prepare();
      if (!context || cancelled) return;

      stop = playRingtone(context, ringtone.current, { loop: Boolean(ringtone.current) });
      if (!ringtone.current) {
        repeat = window.setInterval(() => {
          stop?.();
          stop = playBuiltInChime(context);
        }, 1800);
      }
    }

    void ring();
    return () => {
      cancelled = true;
      window.clearInterval(repeat);
      stop?.();
    };
  }, [audible]);

  useEffect(() => () => {
    const context = audio.current;
    audio.current = null;
    ringtone.current = null;
    ringtoneRequest.current = null;
    if (context && context.state !== 'closed') void context.close().catch(() => {});
  }, []);

  return { prepare, testSound, soundMessage };
}

const finishTimer = (timer) => ({ ...timer, status: 'complete', remainingMs: 0 });

export function ClockProvider({ children }) {
  const [alarm, setAlarm] = useState(null);
  const [preview, setPreview] = useState(null);
  const [timer, setTimer] = useState(null);
  const [stopwatch, setStopwatch] = useState(initialStopwatch);

  useDeadline(alarm?.status === 'armed' ? alarm : null, setAlarm, resolveAlarm);
  useDeadline(preview?.status === 'armed' ? preview : null, setPreview, resolveAlarm);
  useDeadline(timer?.status === 'running' ? timer : null, setTimer, finishTimer);

  const audible = alarm?.status === 'ringing' ? 'alarm'
    : timer?.status === 'complete' ? 'timer'
    : preview?.status === 'ringing' ? 'preview' : null;
  const { prepare: prepareAudio, testSound, soundMessage } = useChime(audible);

  function armAlarm(time, day, repeatChoice, note) {
    const options = alarmOptions(time, day, repeatChoice, Date.now());
    if (options.issue) return options.issue;

    const next = chooseAlarm(options, note);
    prepareAudio();
    setAlarm((current) => (
      current?.status === 'armed' || current?.status === 'ringing' ? current : next
    ));
    return '';
  }

  function snooze() {
    const now = Date.now();
    const random = Math.random();
    setAlarm((current) => current?.status === 'ringing'
      ? snoozeAlarm(current, now, () => random)
      : current);
  }

  function tryAlarm() {
    prepareAudio();
    const next = createPreview(Date.now());
    setPreview((current) => current ?? next);
  }

  function startTimer(durationMs) {
    if (!Number.isInteger(durationMs) || durationMs < 1000 || durationMs >= 100 * MINUTE) return;

    prepareAudio();
    const dueAt = Date.now() + durationMs;
    setTimer({ status: 'running', durationMs, remainingMs: durationMs, dueAt });
  }

  function pauseTimer() {
    const now = Date.now();
    setTimer((current) => {
      if (current?.status !== 'running') return current;
      if (now >= current.dueAt) return finishTimer(current);
      return {
        ...current,
        status: 'paused',
        remainingMs: Math.min(current.durationMs, current.dueAt - now),
        dueAt: null,
      };
    });
  }

  function resumeTimer() {
    prepareAudio();
    const now = Date.now();
    setTimer((current) => current?.status === 'paused'
      ? { ...current, status: 'running', dueAt: now + current.remainingMs }
      : current);
  }

  function toggleStopwatch() {
    const now = performance.now();
    setStopwatch((current) => current.startedAt === null
      ? { ...current, startedAt: now }
      : { ...current, elapsedMs: stopwatchElapsed(current, now), startedAt: null });
  }

  function recordLap() {
    const now = performance.now();
    setStopwatch((current) => {
      if (current.startedAt === null) return current;
      const elapsedMs = stopwatchElapsed(current, now);
      const previous = current.laps.at(-1)?.elapsedMs ?? 0;
      return {
        ...current,
        laps: [...current.laps, { elapsedMs, splitMs: elapsedMs - previous }],
      };
    });
  }

  return (
    <ClockSession.Provider value={{
      alarm,
      armAlarm,
      testSound,
      soundMessage,
      stopAlarm: () => setAlarm(null),
      snooze,
      preview,
      tryAlarm,
      stopPreview: () => setPreview(null),
      timer,
      startTimer,
      pauseTimer,
      resumeTimer,
      resetTimer: () => setTimer(null),
      stopwatch,
      toggleStopwatch,
      recordLap,
      resetStopwatch: () => setStopwatch(initialStopwatch),
    }}>
      {children}
    </ClockSession.Provider>
  );
}

export function useClockSession() {
  return useContext(ClockSession);
}

export function useReading(read, interval, active = true) {
  const [value, setValue] = useState(read);

  useEffect(() => {
    if (!active) return;

    const update = () => setValue(read());
    update();
    const timer = window.setInterval(update, interval);
    document.addEventListener('visibilitychange', update);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', update);
    };
  }, [read, interval, active]);

  return value;
}
