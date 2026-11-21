import React, { useState } from 'react';
import { useClockSession, useReading } from './ClockSession.jsx';
import { formatStopwatch, stopwatchElapsed } from './clockTime.js';
import styles from './Clock.module.css';

const readPerformanceTime = () => performance.now();

function RaceTrack({ run }) {
  return (
    <div className={styles.trackStage} aria-hidden="true">
      <div className={styles.trackOuter} />
      <div className={styles.trackInner} />
      <div className={styles.trackMark} />
      <div className={styles.finishLine} />
      <div key={run} className={styles.car} data-racing={run > 0}>
        <span />
      </div>
    </div>
  );
}

function StopwatchControls({ stopwatch, toggleStopwatch, recordLap, resetStopwatch }) {
  const [run, setRun] = useState(0);
  const running = stopwatch.startedAt !== null;
  const now = useReading(readPerformanceTime, 32, running);
  const elapsed = stopwatchElapsed(stopwatch, now);
  const canReset = running || stopwatch.elapsedMs > 0 || stopwatch.laps.length > 0;

  function lap() {
    recordLap();
    setRun((previous) => previous + 1);
  }

  function reset() {
    resetStopwatch();
    setRun(0);
  }

  return (
    <div className={styles.raceInstrument}>
      <RaceTrack run={run} />
      <output className={styles.readout} aria-live="off" aria-label="Elapsed time">
        {formatStopwatch(elapsed)}
      </output>
      <div className={styles.actions}>
        <button type="button" className={styles.primaryButton} onClick={toggleStopwatch}>
          {running ? 'Pause' : canReset ? 'Resume' : 'Start stopwatch'}
        </button>
        <button type="button" className={styles.button} disabled={!running} onClick={lap}>
          Lap
        </button>
        <button type="button" className={styles.button} disabled={!canReset} onClick={reset}>
          Reset
        </button>
      </div>
    </div>
  );
}

export default function Stopwatch({ active }) {
  const { stopwatch, toggleStopwatch, recordLap, resetStopwatch } = useClockSession();
  const lastLap = stopwatch.laps.at(-1);

  return (
    <div className={styles.instrument}>
      {active && (
        <StopwatchControls
          stopwatch={stopwatch}
          toggleStopwatch={toggleStopwatch}
          recordLap={recordLap}
          resetStopwatch={resetStopwatch}
        />
      )}
      <div className={styles.lapList}>
        <h2>Laps</h2>
        <p className="sr-only" role="status">
          {lastLap && ('Lap ' + stopwatch.laps.length + ', split ' + formatStopwatch(lastLap.splitMs))}
        </p>
        {stopwatch.laps.length === 0 ? (
          <p className={styles.help}>Press Lap while the stopwatch is running to record a split.</p>
        ) : (
          <ol>
            {stopwatch.laps.map((lap, index) => (
              <li key={index}>
                <strong>Lap {index + 1}</strong>
                <span>Split {formatStopwatch(lap.splitMs)}</span>
                <span>Total {formatStopwatch(lap.elapsedMs)}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
