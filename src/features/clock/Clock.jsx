import React, { useEffect, useId, useRef, useState } from 'react';
import Alarm from './Alarm.jsx';
import Timer from './Timer.jsx';
import Stopwatch from './Stopwatch.jsx';
import { useReading } from './ClockSession.jsx';
import { SECOND, formatClockDay } from './clockTime.js';
import styles from './Clock.module.css';

const modules = [
  { label: 'Alarm', View: Alarm },
  { label: 'Timer', View: Timer },
  { label: 'Stopwatch', View: Stopwatch },
];

const timeFormat = new Intl.DateTimeFormat(undefined, {
  hour: 'numeric', minute: '2-digit', second: '2-digit',
});

function LocalClock() {
  const now = useReading(Date.now, SECOND);

  return (
    <div className={styles.face}>
      <div className={styles.faceLabel}>
        <span>Local time</span>
        <span>{formatClockDay(now)}</span>
      </div>
      <time className={styles.wallTime} dateTime={new Date(now).toISOString()}>
        {timeFormat.format(now)}
      </time>
    </div>
  );
}

export default function Clock() {
  const [selected, setSelected] = useState(0);
  const tabs = useRef([]);
  const id = useId();

  useEffect(() => {
    const appTitle = document.title;
    document.title = 'Clock · Unya Na';
    return () => { document.title = appTitle; };
  }, []);

  function moveBetweenTabs(event, index) {
    let next;

    switch (event.key) {
      case 'ArrowRight':
        next = (index + 1) % modules.length;
        break;
      case 'ArrowLeft':
        next = (index - 1 + modules.length) % modules.length;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = modules.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    setSelected(next);
    tabs.current[next]?.focus();
  }

  return (
    <div className={styles.clock}>
      <LocalClock />
      <div className={styles.tabs} role="tablist" aria-label="Clock tools">
        {modules.map(({ label }, index) => (
          <button
            key={label}
            ref={(button) => { tabs.current[index] = button; }}
            type="button"
            role="tab"
            className={styles.tab}
            id={id + '-tab-' + index}
            aria-selected={index === selected}
            aria-controls={id + '-panel-' + index}
            tabIndex={index === selected ? 0 : -1}
            onClick={() => setSelected(index)}
            onKeyDown={(event) => moveBetweenTabs(event, index)}
          >
            {label}
          </button>
        ))}
      </div>
      {modules.map(({ label, View }, index) => (
        <section
          key={label}
          className={styles.panel}
          id={id + '-panel-' + index}
          role="tabpanel"
          aria-labelledby={id + '-tab-' + index}
          hidden={index !== selected}
        >
          <View active={index === selected} />
        </section>
      ))}
    </div>
  );
}
