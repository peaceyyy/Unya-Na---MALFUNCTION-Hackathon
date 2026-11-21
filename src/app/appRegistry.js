import Clock from '../features/clock/Clock.jsx';

// Central launcher registry for Unya na home screen cards.
// Teammates implement their components in src/features/* on their branches;
// once merged, import the component here and assign it to `component`.

export const APP_REGISTRY = [
  {
    id: 'aztec-calendar',
    title: 'Calendar',
    tagline: 'Plan your deadlines in a 260-day sacred cycle.',
    category: 'Schedule',
    tone: 'indigo',
    featurePath: 'src/features/calendar/AztecCalendar.jsx',
    component: null,
  },
  {
    id: 'autocorrect-notepad',
    title: 'Notepad',
    tagline: 'A helpful editor that rewrites your notes for the worse.',
    category: 'Writing',
    tone: 'violet',
    featurePath: 'src/features/notepad/AutocorrectNotepad.jsx',
    component: null,
  },

  {
    id: 'reverse-eisenhower',
    title: 'Eisenhower Matrix',
    tagline: 'Prioritize the least urgent, least important work first.',
    category: 'Tasks',
    tone: 'indigo',
    featurePath: 'src/features/tasks/ReverseEisenhower.jsx',
    component: null,
  },
  {
    id: 'reverse-pomodoro',
    title: 'Pomodoro Timer',
    tagline: 'Long breaks, brief intervals of mild regret.',
    category: 'Focus',
    tone: 'violet',
    featurePath: 'src/features/pomodoro/ReversePomodoro.jsx',
    component: null,
  },
  {
    id: 'binary-calculator',
    title: 'Binary Calculator',
    tagline: 'Everyday arithmetic, strictly in ones and zeros.',
    category: 'Utility',
    tone: 'blue',
    featurePath: 'src/features/extras/BinaryCalculator.jsx',
    component: null,
  },
  {
    id: 'delayed-alarm',
    title: 'Clock',
    tagline: 'The clock is right. The alarm is early or late.',
    category: 'Time',
    tone: 'indigo',
    featurePath: 'src/features/clock/Clock.jsx',
    component: Clock,
  },
];

export function getAppById(id) {
  return APP_REGISTRY.find((app) => app.id === id) || null;
}
