import React from 'react';
import { useClockSession, useReading } from './ClockSession.jsx';
import { SECOND, alarmOffset, formatClockTime, snoozeRange } from './clockTime.js';
import styles from './Clock.module.css';

function SnoozeControl({ alarm, onSnooze }) {
  const now = useReading(Date.now, SECOND);
  const range = snoozeRange(now, alarm.latestAt);

  if (!range) {
    return <p className={styles.help}>No snooze fits before the last possible ring time.</p>;
  }

  const rangeText = range.min === range.max ? range.min : range.min + '–' + range.max;

  return (
    <button type="button" className={styles.button} onClick={onSnooze}>
      Snooze ({rangeText} min)
    </button>
  );
}

export default function ClockAlerts() {
  const { alarm, stopAlarm, snooze, timer, resetTimer, preview, stopPreview } = useClockSession();
  const ringing = alarm?.status === 'ringing';
  const missed = alarm?.status === 'missed';
  const timerDone = timer?.status === 'complete';
  const previewRinging = preview?.status === 'ringing';
  const previewMissed = preview?.status === 'missed';
  const alarmTiming = ringing ? alarmOffset(alarm.targetAt, alarm.rangAt) : '';
  const actualAlarmTime = ringing ? formatClockTime(alarm.rangAt) : '';
  const previewTiming = previewRinging ? alarmOffset(preview.targetAt, preview.rangAt, SECOND) : '';

  return (
    <>
      <div className="sr-only" role="status" aria-atomic="true">
        {ringing && ('Alarm rang at ' + actualAlarmTime + '. ' + alarmTiming + '. ')}
        {missed && 'Alarm missed. '}
        {timerDone && 'Timer complete. '}
        {previewRinging && ('Alarm preview ringing. ' + previewTiming + '.')}
        {previewMissed && 'Alarm preview missed.'}
      </div>
      {(ringing || missed || timerDone || previewRinging || previewMissed) && (
        <aside
          className={ringing ? styles.modalStack : styles.alertStack}
          aria-label="Clock alerts"
        >
          {(ringing || missed) && (
            <section className={styles.alert} aria-label="Alarm">
              <div className={styles.alertHeading}>
                <h2>{ringing ? 'Alarm ringing' : 'Alarm missed'}</h2>
                {missed && <span>Set for {formatClockTime(alarm.targetAt)}</span>}
              </div>
              {ringing ? (
                <>
                  <div className={styles.alarmResult}>
                    <time className={styles.alarmTime} dateTime={new Date(alarm.rangAt).toISOString()}>
                      {actualAlarmTime}
                    </time>
                    <strong>{alarmTiming}</strong>
                  </div>
                  <p className={styles.note}>
                    {alarm.note || (alarm.rangAt < alarm.targetAt ? 'bit early sry' : 'oh ur still here')}
                  </p>
                  <div className={styles.actions}>
                    <button type="button" className={styles.primaryButton} onClick={stopAlarm}>
                      Stop alarm
                    </button>
                    <SnoozeControl alarm={alarm} onSnooze={snooze} />
                  </div>
                </>
              ) : (
                <>
                  <p className={styles.help}>The tab missed the selected ring window.</p>
                  <button type="button" className={styles.button} onClick={stopAlarm}>
                    Dismiss missed alarm
                  </button>
                </>
              )}
            </section>
          )}

          {timerDone && (
            <section className={styles.alert} aria-label="Timer">
              <div className={styles.alertHeading}>
                <h2>Timer complete</h2>
                <span>00:00</span>
              </div>
              <button type="button" className={styles.primaryButton} onClick={resetTimer}>
                Stop timer alert
              </button>
            </section>
          )}

          {(previewRinging || previewMissed) && (
            <section className={styles.alert} aria-label="Alarm preview">
              <div className={styles.alertHeading}>
                <h2>Alarm preview</h2>
                <span>{previewRinging ? previewTiming : 'Window missed'}</span>
              </div>
              {previewRinging && (
                <p className={styles.note}>{preview.rangAt < preview.targetAt ? 'too soon?' : 'made it. kinda'}</p>
              )}
              <button type="button" className={styles.button} onClick={stopPreview}>
                {previewRinging ? 'Stop preview' : 'Dismiss missed preview'}
              </button>
            </section>
          )}
        </aside>
      )}
    </>
  );
}
