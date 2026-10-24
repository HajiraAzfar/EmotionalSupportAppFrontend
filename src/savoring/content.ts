// The Saving Journal's words, in one place.
// DRAFT_NOT_CLINICALLY_APPROVED: every line here is for the clinical advisor
// to review (tone: warm, never pressing, low ratings accepted, no "should").

import type {MomentType} from './api';

export const TITLE = 'Saving Journal';

export const TYPES: {id: MomentType; chip: string; label: string}[] = [
  {id: 'moment', chip: 'Just happened', label: 'Something good that just happened'},
  {id: 'reminisce', chip: 'Remember', label: 'A good moment from before'},
  {id: 'anticipate', chip: 'Look forward to', label: 'Something you look forward to'},
];

export const HOME = {
  intro: 'Notice something good, and stay with it a little. A few moments, really felt, matter more than many.',
  start: 'Savor a moment',
  recent: 'Your last moments',
  history: 'All your moments',
  insights: 'Your patterns',
  settings: 'Settings',
};

export const CAPTURE = {
  what: {
    moment: 'What happened?',
    reminisce: 'What are you remembering?',
    anticipate: 'What are you looking forward to?',
  } as Record<MomentType, string>,
  whatHint: 'A few words is enough. Small things count.',
  whatPlaceholder: 'A cup of chai on the roof…',
  noIdeas: 'Not sure what to write?',
  who: 'Who was there?',
  where: 'Where?',
  tagPlaceholder: 'Optional',
  when: 'When is it?',
  moodBefore: {
    moment: 'Just before this, how were you feeling?',
    reminisce: 'Right now, before you go back to it, how are you feeling?',
    anticipate: 'Right now, how are you feeling?',
  } as Record<MomentType, string>,
  emotions: 'Which good feelings are here, even a little?',
  emotionsHint: 'Tap any that fit, then how strong each is. None at all is fine too.',
  moodAfter: 'And now, how are you feeling?',
  moodAfterOptional: 'How are you feeling now? (optional)',
  techniques: 'Did you do any of these?',
  whyGood: 'What made it good?',
  souvenir: 'A souvenir line: one sentence to keep it by',
  souvenirPlaceholder: 'The steam, and her laugh.',
  expected: 'How good do you expect it to be?',
  optional: 'Optional',
  next: 'Next',
  skip: 'Skip',
  save: 'Save',
  saving: 'Saving…',
  goDeeper: 'Want to go deeper this time? It takes about two minutes.',
  goDeeperYes: 'Go deeper',
  goDeeperNo: 'Keep it quick',
};

// When an anticipated moment is: days from the day it is saved.
export const WHEN: {label: string; days: number}[] = [
  {label: 'Later today', days: 0},
  {label: 'Tomorrow', days: 1},
  {label: 'In 2–3 days', days: 3},
  {label: 'Next week', days: 7},
  {label: 'In a few weeks', days: 21},
];

// For when nothing comes to mind.
export const SMALL_MOMENTS = [
  'A warm drink',
  'Sunlight for a moment',
  'A kind message from someone',
  'A good meal',
  'A quiet minute',
  'Something that made me smile',
];

export const PAUSE = {
  title: 'Stay with it for a moment',
  hint: 'Three slow breaths. Let the moment be here.',
  prompts: [
    'What do you see, hear or feel right now?',
    'Who or what made this possible?',
    'What part did you play?',
    'What would you like to remember about this?',
  ],
  notePlaceholder: 'A word or two, if you like',
  breatheIn: 'Breathe in',
  breatheOut: 'Breathe out',
  done: 'Continue',
  skip: 'Skip the pause',
};

export const DONE = {
  title: 'Kept.',
  mood: 'Your mood',
  favorite: 'Keep as a favourite',
  favorited: 'A favourite',
  another: 'Add another',
  finish: 'Done',
};

export const CAP_MESSAGE = "You've captured 3 good moments today. Come back tomorrow for more.";

export const SUPPORT = {
  break:
    "Some days nothing feels very good, and that's okay. A short break might help, or a message to someone you trust.",
  reachOut:
    'Things seem heavy lately. Talking to someone could help: a person you trust, or a professional. Support is here whenever you want it.',
  resources: 'See support options',
};

export const STREAK = {
  current: (n: number) => (n === 1 ? '1 good-moment day in a row' : `${n} good-moment days in a row`),
  best: (n: number) => `Best: ${n} ${n === 1 ? 'day' : 'days'}`,
  total: (n: number) => `${n} good-moment ${n === 1 ? 'day' : 'days'} in all`,
  fresh: (total: number) =>
    total ? `New start today. You've had ${total} good-moment ${total === 1 ? 'day' : 'days'} so far.` : 'Your first good moment is waiting.',
  grace: 'A dotted day is a rest day: the streak keeps going.',
  less: 'Less',
  more: 'More',
  year: 'View full year',
};

export const MEMORY = {
  title: 'Memory lane',
  hint: 'A few good moments from before, to enjoy again.',
};

export const FOLLOW_UP = {
  title: 'How was it really?',
  expected: (n: number) => `You expected ${n}/10.`,
  save: 'Save',
};

export const HISTORY = {
  title: 'Your moments',
  all: 'All',
  favorites: 'Favourites',
  empty: 'No moments here yet.',
  thisWeek: 'This week',
  lastWeek: 'Last week',
};

export const ENTRY = {
  edit: 'Edit',
  remove: 'Delete',
  removeTitle: 'Delete this moment?',
  removeBody: 'It will be gone for good.',
  keep: 'Keep it',
  expectedActual: (expected: number, actual: number) => `Expected ${expected}/10, really ${actual}/10`,
};

export const INSIGHTS = {
  title: 'Your patterns',
  periods: [
    {label: '30 days', days: 30},
    {label: '3 months', days: 90},
    {label: 'A year', days: 365},
  ],
  days: 'Days with a moment',
  perDay: 'Moments on those days',
  lift: 'Mood lift, on average',
  liftNone: 'Add a mood before and after to see this',
  emotions: 'Feelings you named',
  categories: 'What the moments were about',
  people: 'Who was there',
  places: 'Where',
  timeOfDay: 'When you savored',
  techniques: 'What went with a bigger lift',
  techniquesHint: 'Each listed once used at least three times.',
  anticipation: 'Looking forward, and how it was',
  weeks: 'Savoring days beside check-in mood',
  weeksHint: 'Side by side, as a pattern. Neither causes the other.',
  highlights: 'Highlights',
  patterns: 'What stood out',
  export: 'Export as a CSV',
  disclaimer: 'Self-reported data, not a diagnosis.',
};

export const EXPORT = {
  title: 'Export your moments',
  body: 'A CSV file with one row per moment: the day, the kind, your feelings and ratings, and the techniques you used.',
  notes: 'Include my written notes',
  notesHint: 'What happened, who and where, and your lines. Off unless you turn it on.',
  disclaimer: 'Self-reported data, not a diagnosis.',
  button: 'Export CSV',
  saved: (name: string) => `Saved to your Downloads as ${name}.`,
};

export const SETTINGS = {
  title: 'Saving Journal settings',
  reminder: 'A gentle reminder',
  reminderHint: 'Off unless you turn it on. Your evening check-in already asks about a good moment.',
  reminderOff: 'Off',
  reminderAt: (time: string) => `Every day at ${time}`,
  mode: 'Start with',
  modes: [
    {id: 'auto', label: 'Quick at first', hint: 'Quick for your first three, then a deeper one is offered'},
    {id: 'quick', label: 'Always quick', hint: 'About 30 seconds'},
    {id: 'full', label: 'Always deeper', hint: 'About two minutes, with a pause to savor'},
  ] as const,
};

export const OFFLINE = {
  saved: "Saved on this phone. It will be added when you're back online.",
  pending: (n: number) => (n === 1 ? '1 moment waiting to be added' : `${n} moments waiting to be added`),
  conflictCap: (day: string) => `A moment from ${day} could not be added: that day already has three.`,
  conflictWindow: (day: string) => `A moment from ${day} could not be added: it is more than a day old now.`,
  toToday: 'Add it to today',
  letGo: 'Let it go',
};
