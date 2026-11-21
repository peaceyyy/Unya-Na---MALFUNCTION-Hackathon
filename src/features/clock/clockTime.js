export const SECOND = 1000;
export const MINUTE = 60 * SECOND;

const alarmBands = [
  { kind: 'Early', first: -2, last: -1 },
  { kind: 'Late', first: 1, last: 2 },
];

const clockFormat = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });
const dayFormat = new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
const offsetFormat = new Intl.DateTimeFormat(undefined, {
  hour: 'numeric', minute: '2-digit', timeZoneName: 'shortOffset',
});

export const formatClockTime = (timestamp) => clockFormat.format(timestamp);
export const formatClockDay = (timestamp) => dayFormat.format(timestamp);
export const formatClockOffset = (timestamp) => offsetFormat.format(timestamp);

export function formatAlarmWindow(times, targetAt) {
  const first = times[0];
  const last = times.at(-1);
  const target = new Date(targetAt);
  const endpoints = [new Date(first), new Date(last)];
  const showDate = endpoints.some((time) => time.toDateString() !== target.toDateString());
  const showOffset = endpoints.some((time) => time.getTimezoneOffset() !== target.getTimezoneOffset());

  function format(timestamp) {
    const date = showDate ? formatClockDay(timestamp) + ' ' : '';
    return date + (showOffset ? formatClockOffset(timestamp) : formatClockTime(timestamp));
  }

  return first === last ? format(first) : format(first) + ' to ' + format(last);
}

function sameLocalMinute(first, second) {
  return first.toDateString() === second.toDateString()
    && first.getHours() === second.getHours()
    && first.getMinutes() === second.getMinutes();
}

export function alarmOptions(time, day, hourChoice, now) {
  const parts = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time);
  const empty = { windows: [], repeatedTimes: [], targetAt: null };

  if (!parts) return { ...empty, issue: 'Enter an alarm time.' };

  const localTime = new Date(now);
  if (day === 'tomorrow') localTime.setDate(localTime.getDate() + 1);
  const selectedDate = localTime.toDateString();
  const hours = Number(parts[1]);
  const minutes = Number(parts[2]);
  localTime.setHours(hours, minutes, 0, 0);

  if (localTime.getHours() !== hours || localTime.getMinutes() !== minutes
      || localTime.toDateString() !== selectedDate) {
    return { ...empty, issue: 'That time is skipped by a clock change. Choose another time.' };
  }

  const initialAt = localTime.getTime();
  const nextDay = new Date(initialAt);
  nextDay.setDate(nextDay.getDate() + 1);
  const offsetChange = nextDay.getTimezoneOffset() - localTime.getTimezoneOffset();
  const repeatedAt = initialAt + offsetChange * MINUTE;
  const repeatedTimes = offsetChange > 0 && sameLocalMinute(localTime, new Date(repeatedAt))
    ? [initialAt, repeatedAt]
    : [];
  const targetAt = repeatedTimes[hourChoice] ?? initialAt;

  const windows = alarmBands.flatMap(({ kind, first, last }) => {
    const times = [];
    for (let offset = first; offset <= last; offset += 1) {
      const timestamp = targetAt + offset * MINUTE;
      if (timestamp > now) times.push(timestamp);
    }

    return times.length ? [{ kind, times, cutoffAt: targetAt + (last + 1) * MINUTE }] : [];
  });

  return {
    targetAt,
    repeatedTimes,
    windows,
    issue: windows.length ? '' : 'Those ring windows have passed. Choose a later time or select Tomorrow.',
  };
}

export function chooseAlarm(options, note, random = Math.random) {
  const { targetAt, windows } = options;
  if (!windows.length) return null;

  const window = windows[Math.floor(random() * windows.length)];
  const dueAt = window.times[Math.floor(random() * window.times.length)];

  return {
    status: 'armed',
    targetAt,
    dueAt,
    cutoffAt: window.cutoffAt,
    latestAt: windows.at(-1).cutoffAt,
    windows,
    note: note.trim(),
  };
}

export function createPreview(now, random = Math.random) {
  const targetAt = now + 8 * SECOND;
  const dueAt = targetAt + (random() < 0.5 ? -3 : 4) * SECOND;
  return {
    status: 'armed',
    targetAt,
    dueAt,
    cutoffAt: dueAt + 5 * SECOND,
  };
}

export function resolveAlarm(alarm, now) {
  return now < alarm.cutoffAt
    ? { ...alarm, status: 'ringing', rangAt: now }
    : { ...alarm, status: 'missed' };
}

export function snoozeRange(now, latestAt) {
  const max = Math.min(7, Math.floor((latestAt - now - 1) / MINUTE));
  return max >= 3 ? { min: 3, max } : null;
}

export function snoozeAlarm(alarm, now, random = Math.random) {
  const range = snoozeRange(now, alarm.latestAt);
  if (!range) return alarm;

  const delay = range.min + Math.floor(random() * (range.max - range.min + 1));
  return {
    ...alarm,
    status: 'armed',
    dueAt: now + delay * MINUTE,
    cutoffAt: alarm.latestAt,
    snoozed: true,
    snoozeTimes: [now + range.min * MINUTE, now + range.max * MINUTE],
    rangAt: null,
  };
}

export function alarmOffset(targetAt, rangAt, unit = MINUTE) {
  const difference = rangAt - targetAt;
  const amount = Math.round(Math.abs(difference) / unit);
  if (amount === 0) return 'On time';

  const label = unit === SECOND ? 'sec' : 'min';
  return amount + ' ' + label + (difference < 0 ? ' early' : ' late');
}

export function formatDuration(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
}

export function formatStopwatch(milliseconds) {
  const seconds = Math.floor(milliseconds / SECOND);
  const hundredths = Math.floor((milliseconds % SECOND) / 10);
  return formatDuration(seconds) + '.' + String(hundredths).padStart(2, '0');
}

export function stopwatchElapsed(stopwatch, now) {
  return stopwatch.elapsedMs
    + (stopwatch.startedAt === null ? 0 : Math.max(0, now - stopwatch.startedAt));
}

const reversalStartMs = 6000;
const refillAtMs = 4000;
const finalDrainMs = 2300;

export function hourglassPhase(duration, remaining) {
  if (remaining <= 0) return 'complete';
  if (duration < 8000 || remaining > reversalStartMs) return 'draining';
  return remaining > refillAtMs ? 'reversing' : 'refilled';
}

export function sandProgress(duration, remaining, phase = hourglassPhase(duration, remaining)) {
  const normalProgress = 1 - Math.min(1, Math.max(0, remaining / duration));
  if (phase === 'draining' || phase === 'complete') return normalProgress;

  const reversalStart = 1 - reversalStartMs / duration;
  const refillPoint = Math.max(0, reversalStart - 0.32);
  if (phase === 'reversing') {
    const reversal = (reversalStartMs - remaining) / (reversalStartMs - refillAtMs);
    return reversalStart + (refillPoint - reversalStart) * reversal;
  }
  if (remaining >= finalDrainMs) return refillPoint;

  return refillPoint + (1 - refillPoint) * ((finalDrainMs - remaining) / finalDrainMs);
}

export function timerReadoutRemaining(duration, remaining, phase = hourglassPhase(duration, remaining)) {
  if (phase === 'draining') return remaining;
  return duration * (1 - sandProgress(duration, remaining, phase));
}
