/**
 * Unproductive OS // Cursed Autocorrect Suggestions & Hostile Typing Rules
 * For procrastinators, by procrastinators.
 */

export const CURSED_SUGGESTION_MAP = {
  work: 'procrastinate vigorously',
  working: 'staring blankly at the screen',
  study: 'scroll endless short videos',
  studying: 'taking a 4-hour microbreak',
  deadline: 'vague future suggestion',
  deadlines: 'optional milestones',
  task: 'side quest of zero urgency',
  tasks: 'existential dread items',
  important: 'entirely skippable',
  urgent: 'unya na (eventually)',
  urgently: 'ugma na lang unta',
  focus: 'daydream about snacks',
  focused: 'distracted by Wikipedia rabbit holes',
  meeting: 'email that could have stayed unwritten',
  project: 'indefinitely postponed ambition',
  finish: 'abandon with pride',
  finished: 'half-baked and handed in',
  start: 'delay until tomorrow morning',
  today: 'ugma na (someday)',
  now: 'right after this YouTube video',
  later: 'much, much later',
  help: 'hopelessness',
  busy: 'pretending to type loudly',
  productive: 'unproductive and thriving',
  productivity: 'a myth invented by alarm clocks',
  plan: 'wildly unrealistic wish',
  plans: 'pre-cancelled arrangements',
  write: 'stare into the blinking cursor void',
  writing: 'procrastinating in serif font',
  clean: 'relocate the mess to another room',
  code: 'copy-paste from Stack Overflow without reading',
  test: 'push directly to production and pray',
  bug: 'undocumented comedic feature',
  fix: 'break three unrelated systems',
  sleep: 'revenge bedtime scrolling',
  tired: 'terminally unmotivated',
  coffee: 'liquid panic with sugar',
  exercise: 'thinking about stretching',
  email: 'unread notification #4,821',
  homework: 'group project sacrifice',
  notes: 'hieroglyphics you will never re-read',
  exam: 'luck-based evaluation event',
  grade: 'arbitrary number generator',
  fail: 'character building opportunity',
  pass: 'miraculous statistical anomaly',
  idea: 'delusion of grandeur',
  problem: 'someone else\'s responsibility',
  solution: 'ignoring it until it disappears',
  boss: 'sans in a blue hoodie',
  cat: 'sovereign furry ruler',
  rest: 'the highest biological imperative',
};

/**
 * Returns a witty suggestion for a given word.
 * The core rule: The user can SEE this suggestion, but CAN NEVER CHOOSE IT.
 */
export function getAutocorrectSuggestion(rawWord) {
  if (!rawWord || typeof rawWord !== 'string') return null;
  const clean = rawWord.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!clean || clean.length < 2) return null;

  // 1. Direct dictionary match
  if (CURSED_SUGGESTION_MAP[clean]) {
    return {
      original: rawWord,
      suggestion: CURSED_SUGGESTION_MAP[clean],
      reason: 'Procrastination Lexicon',
    };
  }

  // 2. Playful morphological suggestions for other words
  if (clean.endsWith('ing')) {
    return {
      original: rawWord,
      suggestion: clean.slice(0, -3) + 'ing-unya-na',
      reason: 'Delay Suffix Added',
    };
  }
  if (clean.endsWith('ed')) {
    return {
      original: rawWord,
      suggestion: 'un-' + clean + '-again',
      reason: 'Regret Prefix Injected',
    };
  }
  if (clean.length > 8) {
    return {
      original: rawWord,
      suggestion: clean.slice(0, 5) + '... (too long, resting)',
      reason: 'Syllable Fatigue',
    };
  }

  // 3. Fallback whimsical suggestions
  const suffixes = ['-ish', '-adjacent', ' (allegedly)', ' (tomorrow)', ' (needs nap)'];
  const suffix = suffixes[clean.length % suffixes.length];
  return {
    original: rawWord,
    suggestion: rawWord + suffix,
    reason: 'Creative Autocorrect',
  };
}

/**
 * Actively enforces lowercase after periods (e.g. ". " or ".\n")
 * Even if user holds Shift or Caps Lock, first character after a period is forced lowercase.
 */
export function shouldEnforceLowercaseAfterPeriod(textBeforeCursor) {
  if (!textBeforeCursor || typeof textBeforeCursor !== 'string') return false;
  return /\.\s+$/.test(textBeforeCursor);
}
