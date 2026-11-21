import AztecCalendar from '../features/calendar/AztecCalendar';
import AutocorrectNotepad from '../features/notepad/AutocorrectNotepad';
import Clock from '../features/clock/Clock.jsx';
import BinaryCalculator from '../features/extras/BinaryCalculator';
import ReversePomodoro from '../features/pomodoro/ReversePomodoro';
import ReverseEisenhower from '../features/tasks/ReverseEisenhower';

// Central launcher registry for Unya na home screen cards.
// Teammates implement their components in src/features/* on their branches;
// once merged, import the component here and assign it to `component`.

export const APP_REGISTRY = [
  {
    id: 'aztec-calendar',
    title: 'Calendar',
    tagline: 'Plan ahead and keep track of important dates.',
    featurePath: 'src/features/calendar/AztecCalendar.jsx',
    component: AztecCalendar,
  },
  {
    id: 'autocorrect-notepad',
    title: 'Notepad',
    tagline: 'Write and format notes in a text editor.',
    featurePath: 'src/features/notepad/AutocorrectNotepad.jsx',
    component: AutocorrectNotepad,
  },

  {
    id: 'reverse-eisenhower',
    title: 'Eisenhower Matrix',
    tagline: 'Prioritize tasks by importance and urgency.',
    featurePath: 'src/features/tasks/ReverseEisenhower.jsx',
    component: ReverseEisenhower,
  },
  {
    id: 'reverse-pomodoro',
    title: 'Pomodoro Timer',
    tagline: 'Set timed focus sessions and breaks.',
    featurePath: 'src/features/pomodoro/ReversePomodoro.jsx',
    component: ReversePomodoro,
  },
  {
    id: 'binary-calculator',
    title: 'Calculator',
    tagline: 'Perform arithmetic.',
    featurePath: 'src/features/extras/BinaryCalculator.jsx',
    component: BinaryCalculator,
  },
  {
    id: 'delayed-alarm',
    title: 'Clock',
    tagline: 'Set alarms and use the timer or stopwatch.',
    featurePath: 'src/features/clock/Clock.jsx',
    component: Clock,
  },
];

export function getAppById(id) {
  return APP_REGISTRY.find((app) => app.id === id) || null;
}
