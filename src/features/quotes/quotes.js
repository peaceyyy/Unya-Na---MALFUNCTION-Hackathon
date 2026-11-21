export const DEMOTIVATIONAL_QUOTES = [
  {
    text: 'You miss 100% of the deadlines you procrastinate on. Keep it up.',
    attribution: 'Your academic adviser, probably',
  },
  {
    text: 'Why do today what you can panic over at 11:57 PM tomorrow?',
    attribution: 'Canvas submission log',
  },
  {
    text: 'Your groupmates have not opened the Google Doc either. You are in good company.',
    attribution: 'Seen by 4 people at 2:14 AM',
  },
  {
    text: 'Unya na lang. The syllabus is more of a gentle suggestion anyway.',
    attribution: 'Every 3rd year student',
  },
  {
    text: 'If it was meant to be submitted on time, you would have started last week.',
    attribution: 'Ancient campus proverb',
  },
  {
    text: 'Rest now. You did one whole paragraph of the RRL today.',
    attribution: 'Your inner thesis defender',
  },
  {
    text: 'A 15-minute power nap is just a 3-hour sleep with better branding.',
    attribution: '4:00 PM alarm, snoozed 9 times',
  },
  {
    text: 'Do not rush greatness. Or mediocre work. Honestly, do not rush anything.',
    attribution: 'Department of Bare Minimum',
  },
  {
    text: 'You do not need motivation. You need 45 minutes left before the portal closes.',
    attribution: 'Adrenaline, your real project manager',
  },
  {
    text: 'Kapoy man gud. And that is a peer-reviewed scientific reason.',
    attribution: 'Citation needed (2026)',
  },
  {
    text: 'Reading the instructions carefully only reveals how much work you have to avoid.',
    attribution: 'Rubric skimming committee',
  },
  {
    text: 'Close 30 browser tabs and you might accidentally feel productive. Better leave them open.',
    attribution: 'Your laptop fan at 98% CPU',
  },
  {
    text: 'Believe in yourself. Nobody else believes you will finish before Monday.',
    attribution: 'Group chat silence',
  },
  {
    text: 'Ugma na puhon. Tomorrow you is much stronger, wiser, and definitely more awake.',
    attribution: 'Tonight you, lying again',
  },
  {
    text: 'Every big project starts with reorganizing your Notion template for four hours.',
    attribution: 'Aesthetic over output',
  },
  {
    text: 'You cannot fail a quiz if you forget the quiz exists until after class.',
    attribution: 'Blissful ignorance weekly',
  },
  {
    text: 'Hard work pays off later. Laziness pays off immediately.',
    attribution: 'Intro to Economics, misunderstood',
  },
  {
    text: 'If you stare at the blank document long enough, it becomes a staring contest you can win.',
    attribution: 'Google Docs cursor',
  },
  {
    text: 'Maybe the real thesis was the iced coffees we bought along the way.',
    attribution: 'Empty wallet, empty Chapter 2',
  },
  {
    text: 'Way lumba. Unless the deadline is at 11:59 PM, in which case good luck.',
    attribution: 'Submission portal clock',
  },
  {
    text: 'You already opened the laptop. That counts as 40% of the assignment.',
    attribution: 'Self-graded rubric',
  },
  {
    text: 'Never give up on your dreams. Keep sleeping.',
    attribution: '7:30 AM lecture attendance sheet',
  },
  {
    text: 'When the going gets tough, check your phone for 20 minutes to reset your mindset.',
    attribution: 'Focus strategy that never works',
  },
  {
    text: 'Passing is passing. Nobody asks for your GPA at the karaoke bar.',
    attribution: 'Senior who barely graduated',
  },
  {
    text: 'Pahuway sa. The deadline will still be there waiting for you when you wake up.',
    attribution: 'Unbothered scheduling guide',
  },
  {
    text: 'Just don’t do it.',
    attribution: 'Nikey',
  },
  {
    text: 'Think tomorrow.',
    attribution: 'Steve Sloth',
  },
  {
    text: 'Doing nothing is always possible.',
    attribution: 'Adidawdle',
  },
  {
    text: 'Move slow and preserve your peace.',
    attribution: 'Mark Slumberberg',
  },
  {
    text: 'Why fly when you can lie down?',
    attribution: 'Bed Bull',
  },
  {
    text: 'Never do today what you can conveniently postpone until tomorrow.',
    attribution: 'Benjamin Slanklin',
  },
  {
    text: 'Veni, vidi, dormivi. (I came, I saw, I took a nap.)',
    attribution: 'Julius Snoozer',
  },
  {
    text: 'Genius is one percent intention, ninety-nine percent hesitation.',
    attribution: 'Thomas Bed-ison',
  },
  {
    text: 'If you are going through hell, find a comfortable spot and set up camp.',
    attribution: 'Winston Couch-chill',
  },
  {
    text: 'Give me six hours to chop down a tree, and I will spend five hours reconsidering if the tree really needs to be chopped down.',
    attribution: 'Abraham Lie-down',
  },
  {
    text: 'It does not matter how slowly you go, stopping altogether is also fine.',
    attribution: 'Comfort-cius',
  },
  {
    text: 'Do not. Trying requires effort.',
    attribution: 'Yo-dawdle',
  },
  {
    text: 'While they grind, you slumber.',
    attribution: 'Gary Zeeeee',
  },
  {
    text: 'Carpe somnum. Seize the sleep.',
    attribution: 'Snore-ace',
  },
  {
    text: 'The early bird gets exhausted by 10:00 AM. The late bird enjoys brunch.',
    attribution: 'Proverbial Slacker',
  },
  {
    text: 'The best way out is a sudden U-turn back to bed.',
    attribution: 'Robert Freeze-up',
  },
];

export function getDailyQuoteIndex(date = new Date()) {
  const key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return hash % DEMOTIVATIONAL_QUOTES.length;
}
