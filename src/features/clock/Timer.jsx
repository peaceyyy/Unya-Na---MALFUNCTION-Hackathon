import React, { useState } from 'react';
import { useClockSession, useReading } from './ClockSession.jsx';
import { SECOND, formatDuration, hourglassPhase, sandProgress, timerReadoutRemaining } from './clockTime.js';
import styles from './Clock.module.css';

function Hourglass({ progress, moving, phase }) {
  return (
    <div
      className={styles.hourglass}
      data-phase={phase}
      style={{ '--sand-top': 1 - progress, '--sand-bottom': progress }}
      aria-hidden="true"
    >
      <div className={styles.glassTop}><span /></div>
      {moving && <div className={styles.sandStream} />}
      <div className={styles.glassBottom}><span /></div>
    </div>
  );
}

export default function Timer({ active }) {
  const { timer, startTimer, pauseTimer, resumeTimer, resetTimer } = useClockSession();
  const savedSeconds = (timer?.durationMs ?? 10 * SECOND) / SECOND;
  const [minutes, setMinutes] = useState(() => String(Math.floor(savedSeconds / 60)));
  const [seconds, setSeconds] = useState(() => String(savedSeconds % 60));
  const running = timer?.status === 'running';
  const paused = timer?.status === 'paused';
  const now = useReading(Date.now, 80, active && running);
  const total = Number(minutes) * 60 + Number(seconds);
  const valid = minutes !== '' && seconds !== '' && Number.isInteger(Number(minutes))
    && Number(minutes) >= 0 && Number(minutes) <= 99 && Number.isInteger(Number(seconds))
    && Number(seconds) >= 0 && Number(seconds) <= 59 && total > 0;

  const remaining = running
    ? Math.max(0, Math.min(timer.durationMs, timer.dueAt - now))
    : timer?.remainingMs ?? (valid ? total * SECOND : 0);
  const phase = timer ? hourglassPhase(timer.durationMs, remaining) : 'draining';
  const progress = timer ? sandProgress(timer.durationMs, remaining, phase) : 0;
  const displayedRemaining = timer
    ? timerReadoutRemaining(timer.durationMs, remaining, phase)
    : remaining;

  function submit(event) {
    event.preventDefault();
    if (running) pauseTimer();
    else if (paused) resumeTimer();
    else if (valid) startTimer(total * SECOND);
  }

  return (
    <div className={styles.instrument}>
      <div className={styles.timerStage}>
        <Hourglass
          progress={progress}
          moving={running && remaining > 0}
          phase={phase}
        />
        <output className={styles.readout} aria-live="off" aria-label="Timer display">
          {formatDuration(Math.ceil(displayedRemaining / SECOND))}
        </output>
        <p className={styles.help} role="status">
          {running ? 'Running' : paused ? 'Paused' : timer ? 'Complete' : 'Ready'}
        </p>
      </div>

      <form className={styles.form} onSubmit={submit}>
        <fieldset className={styles.durationFields} disabled={running || paused}>
          <legend>Timer duration</legend>
          <label className={styles.field}>
            Minutes
            <input
              type="number"
              inputMode="numeric"
              className={styles.input}
              min="0"
              max="99"
              step="1"
              required
              value={minutes}
              onChange={(event) => setMinutes(event.target.value)}
            />
          </label>
          <label className={styles.field}>
            Seconds
            <input
              type="number"
              inputMode="numeric"
              className={styles.input}
              min="0"
              max="59"
              step="1"
              required
              value={seconds}
              onChange={(event) => setSeconds(event.target.value)}
            />
          </label>
        </fieldset>

        {!valid && !running && !paused && (
          <p className={styles.help}>Enter a time between 00:01 and 99:59.</p>
        )}
        <div className={styles.actions}>
          <button type="submit" className={styles.primaryButton} disabled={!running && !paused && !valid}>
            {running ? 'Pause' : paused ? 'Resume' : 'Start timer'}
          </button>
          <button type="button" className={styles.button} disabled={!timer} onClick={resetTimer}>
            Reset
          </button>
        </div>
      </form>
    </div>
  );
}
