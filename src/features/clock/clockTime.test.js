import { expect, test } from 'bun:test';
import {
  alarmOptions,
  chooseAlarm,
  hourglassPhase,
  resolveAlarm,
  sandProgress,
  snoozeRange,
  stopwatchElapsed,
} from './clockTime.js';

const minute = 60_000;
const local = (hour, minutes) => new Date(2026, 0, 14, hour, minutes).getTime();

test('samples a one-to-two-minute early or late window for a 7 AM alarm', () => {
  const options = alarmOptions('07:00', 'today', 0, local(6, 0));

  expect(chooseAlarm(options, '', () => 0).dueAt).toBe(local(6, 58));
  expect(chooseAlarm(options, '', () => 0.99).dueAt).toBe(local(7, 2));
});

test('offers only future alarm candidates', () => {
  const options = alarmOptions('07:00', 'today', 0, local(7, 1));

  expect(options.windows.map(({ kind, times }) => [kind, times[0]])).toEqual([
    ['Late', local(7, 2)],
  ]);
});

test('marks an alarm as missed when its sampled window closes', () => {
  const alarm = chooseAlarm(alarmOptions('07:00', 'today', 0, local(6, 0)), '', () => 0);

  expect(resolveAlarm(alarm, local(6, 58) + 30_000).status).toBe('ringing');
  expect(resolveAlarm(alarm, local(7, 0)).status).toBe('missed');
});

test('snooze only offers whole minutes that fit before the cutoff', () => {
  const cutoff = local(7, 19);

  expect(snoozeRange(local(7, 15), cutoff)).toEqual({ min: 3, max: 3 });
  expect(snoozeRange(local(7, 16), cutoff)).toBeNull();
});

test('the sand reverses briefly before finishing at the timer deadline', () => {
  expect(sandProgress(minute, 4500)).toBeLessThan(sandProgress(minute, 6000));
  expect(sandProgress(minute, 0)).toBe(1);
  expect(sandProgress(3000, 1500)).toBe(0.5);
});

test('the still hourglass changes only at the drain, refill, and finish cues', () => {
  const duration = 10_000;
  const samples = [10_000, 8000, 5900, 4300, 4000, 1000, 0];

  expect(samples.map((remaining) => hourglassPhase(duration, remaining))).toEqual([
    'draining', 'draining', 'reversing', 'reversing', 'refilled', 'refilled', 'complete',
  ]);
  expect(hourglassPhase(3000, 1000)).toBe('draining');
});

test('elapsed stopwatch time includes earlier runs and excludes a paused gap', () => {
  expect(stopwatchElapsed({ elapsedMs: 1200, startedAt: null }, 9000)).toBe(1200);
  expect(stopwatchElapsed({ elapsedMs: 1200, startedAt: 9000 }, 9250)).toBe(1450);
});
