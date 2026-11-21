import React, { useState } from 'react';
import { useClockSession, useReading } from './ClockSession.jsx';
import {
  SECOND,
  alarmOptions,
  formatClockDay,
  formatClockOffset,
  formatClockTime,
} from './clockTime.js';
import styles from './Clock.module.css';

export default function Alarm({ active }) {
  const { alarm, armAlarm, testSound, soundMessage, stopAlarm, preview, tryAlarm, stopPreview } = useClockSession();
  const [time, setTime] = useState('07:00');
  const [day, setDay] = useState('tomorrow');
  const [note, setNote] = useState('');
  const [repeatChoice, setRepeatChoice] = useState(0);
  const [error, setError] = useState('');
  const now = useReading(Date.now, SECOND, active);
  const options = alarmOptions(time, day, repeatChoice, now);
  const armed = alarm?.status === 'armed';
  const ringing = alarm?.status === 'ringing';
  const locked = armed || ringing;

  function submit(event) {
    event.preventDefault();
    setError(armAlarm(time, day, repeatChoice, note));
  }

  return (
    <>
      <form className={styles.form} onSubmit={submit}>
        {!locked && <div className={styles.formTop}>
          <label className={styles.field}>
            Alarm time
            <input
              type="time"
              required
              className={styles.input}
              value={time}
              onChange={(event) => {
                setTime(event.target.value);
                setRepeatChoice(0);
                setError('');
              }}
            />
          </label>
          <label className={styles.field}>
            Day
            <select
              className={styles.input}
              value={day}
              onChange={(event) => {
                setDay(event.target.value);
                setRepeatChoice(0);
                setError('');
              }}
            >
              <option value="today">Today</option>
              <option value="tomorrow">Tomorrow</option>
            </select>
          </label>
          <label className={styles.field}>
            <span>Note <span className={styles.optional}>(optional)</span></span>
            <input
              type="text"
              className={styles.input}
              maxLength={60}
              value={note}
              placeholder="meeting i think"
              onChange={(event) => setNote(event.target.value)}
            />
          </label>
        </div>}

        {!locked && options.repeatedTimes.length > 1 && (
          <label className={styles.field}>
            This time occurs twice
            <select
              className={styles.input}
              value={repeatChoice}
              onChange={(event) => {
                setRepeatChoice(Number(event.target.value));
                setError('');
              }}
            >
              {options.repeatedTimes.map((timestamp, index) => (
                <option key={timestamp} value={index}>
                  {index === 0 ? 'First' : 'Second'} · {formatClockOffset(timestamp)}
                </option>
              ))}
            </select>
          </label>
        )}

        {error ? <p role="alert" className={styles.help}>{error}</p>
          : !locked && options.issue && <p className={styles.help}>{options.issue}</p>}

        <p className={styles.help} role="status">
          {armed && (
            (alarm.snoozed ? 'Snoozed. ' : 'Armed. ')
            + formatClockDay(alarm.targetAt) + ' at ' + formatClockTime(alarm.targetAt) + '.'
          )}
          {ringing && 'Alarm ringing. Use Stop alarm or Snooze in the clock alert.'}
          {alarm?.status === 'missed' && 'The previous alarm missed its ring window.'}
        </p>

        <div className={styles.actions}>
          {!ringing && (
            <button
              type={armed ? 'button' : 'submit'}
              className={armed ? styles.button : styles.primaryButton}
              onClick={armed ? stopAlarm : undefined}
              disabled={!armed && !options.windows.length}
            >
              {armed ? 'Cancel alarm' : 'Set alarm'}
            </button>
          )}
          <p className={styles.help}>Keep this browser tab open for alerts.</p>
        </div>
      </form>

      <details className={styles.demo}>
        <summary>Alarm demo <span>Try a short alarm preview</span></summary>
        <div className={styles.preview}>
          <div>
            <h2>Try the alarm</h2>
            <p className={styles.help} role="status">
              {preview?.status === 'armed' ? 'Preview armed. It rings in about 5 or 12 seconds.'
                : preview?.status === 'ringing' ? 'The preview is ringing.'
                : preview?.status === 'missed' ? 'The preview missed its ring window.'
                : 'An eight-second alarm that might be three seconds early or four seconds late.'}
            </p>
            <p className={styles.help} role="status">{soundMessage}</p>
          </div>
          <div className={styles.demoActions}>
            <button type="button" className={styles.button} onClick={testSound}>Test sound</button>
            {preview ? (
              <button type="button" className={styles.button} onClick={stopPreview}>
                {preview.status === 'armed' ? 'Cancel preview' : 'Clear preview'}
              </button>
            ) : (
              <button type="button" className={styles.primaryButton} onClick={tryAlarm}>Try alarm</button>
            )}
          </div>
        </div>
      </details>
    </>
  );
}
