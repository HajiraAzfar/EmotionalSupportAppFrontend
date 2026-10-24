// The Thought Journal's words, in one place.
// DRAFT_NOT_CLINICALLY_APPROVED: every line here is for the clinical advisor
// to review (tone: curious and gentle; a thought is never called wrong or
// irrational; no advice, no labels).

export const TITLE = 'Thought Journal';

export const HOME = {
  intro: 'When a thought keeps stinging, slow it down: what happened, what you felt, and how else it could be seen.',
  quick: 'Quick record',
  quickHint: 'About 3 minutes',
  full: 'Full record',
  fullHint: 'About 8 minutes, with the evidence',
  continue: 'Continue where you left off',
  recent: 'Your last records',
  history: 'All your records',
  insights: 'Your patterns',
};

export const STEPS = {
  situation: {
    title: 'What was happening when the thought showed up?',
    hint: 'Just the facts: where you were, what was going on.',
    placeholder: 'In the meeting, my manager went quiet…',
    tags: 'What was it about?',
  },
  emotions: {
    title: 'What did you feel in that moment?',
    hint: 'Pick any, then how strong each was, 0 to 100.',
    strength: (name: string) => `How strong was ${name.toLowerCase()}?`,
  },
  thought: {
    title: 'What was the thought, in the words it came in?',
    hint: 'Write it the way it sounded in your head.',
    placeholder: 'She thinks my work is bad.',
    second: 'Was there a second thought with it? (optional)',
  },
  belief: {
    title: 'How much do you believe that thought right now?',
    hint: 'However strongly is fine. This is just a starting point.',
  },
  traps: {
    title: 'Could any of these thinking patterns be part of it?',
    hint: 'Optional. Most thoughts have none or one or two. Tap to see an example.',
    suggest: 'Suggest patterns that might fit',
    suggested: 'These might fit. Keep only the ones that feel right to you.',
    noSuggestion: 'No suggestion just now. Have a look through the list.',
  },
  evidenceFor: {
    title: 'What makes the thought feel true?',
    hint: 'Facts you could point to, not just the feeling.',
  },
  evidenceAgainst: {
    title: "Is there anything that doesn't quite fit the thought?",
    hint: 'Anything, however small.',
  },
  balanced: {
    title: 'Knowing all that, how would you put it now?',
    hint: 'Believable beats merely positive. It can include what is hard.',
    placeholder: 'She may be tired, and the report went well last week.',
  },
  rerate: {
    title: 'How do things sit now?',
    original: 'How much do you believe the first thought now?',
    balanced: 'How much do you believe the new way of putting it?',
    feelings: 'And how strong is each feeling now?',
  },
  next: {
    title: 'Is there one small next step you would like to take?',
    hint: 'Optional. Something doable, or nothing at all.',
    placeholder: 'Ask her on Monday how the report landed.',
  },
};

// Fixed helper questions for the evidence: shown always, and the answer to
// "Help me think" whenever the model is not there.
export const HELPERS = {
  for: [
    'What happened that makes this thought feel true?',
    'Would someone else who saw it see it the same way?',
    'Is this a fact, or a feeling about a fact?',
  ],
  against: [
    'What would you say to a friend in this situation?',
    'Has there been a time when this was not true?',
    'What might you be leaving out because it does not fit?',
    'How might you see this in a week, or a year?',
  ],
  helpMe: 'Help me think',
};

export const DONE = {
  title: 'Done. That took care.',
  belief: (before: number, after: number) => `Belief ${before}% → ${after}%`,
  feeling: (name: string, before: number, after: number) => `${name} ${before} → ${after}`,
  favorite: 'Keep as a favourite',
  favorited: 'A favourite',
  savoring: 'Hold on to something good too? (Saving Journal)',
  finish: 'Done',
};

export const GENTLE = {
  daily:
    "That's a lot of hard thoughts in one day. A break might help: a few slow breaths, a short walk, or a word with someone you trust.",
  grounding: 'Try a grounding exercise',
  pattern: (tag: string, trap: string) =>
    `Thoughts about "${tag}" with "${trap}" have come back a few times and still feel heavy. Going over the same exercise again may not be what helps most now; talking it through with a professional could.`,
  resources: 'See support options',
};

export const CRISIS = {
  continue: 'Continue the record',
  stop: 'Stop for now (it is saved)',
};

export const HISTORY = {
  title: 'Your records',
  favorites: 'Favourites',
  empty: 'No records here yet.',
  edited: 'Edited later',
};

export const RECORD = {
  edit: 'Edit',
  remove: 'Delete',
  removeTitle: 'Delete this record?',
  removeBody: 'It will be gone for good.',
  keep: 'Keep it',
  editLater: 'Edits more than a day after finishing are marked as edited.',
};

export const INSIGHTS = {
  title: 'Your patterns',
  periods: [
    {label: '30 days', days: 30},
    {label: '3 months', days: 90},
    {label: 'A year', days: 365},
  ],
  completed: 'Finished records',
  rate: 'Of those started, finished',
  belief: 'Belief drop, on average',
  emotion: 'Feelings eased, on average',
  balanced: 'Balanced thoughts, believed',
  waiting: 'Shows from 5 records with ratings',
  traps: 'Thinking patterns you noticed',
  tags: 'What the situations were about',
  reframes: 'Reframes that helped most',
  linked: 'Opened from a hard check-in',
  patterns: 'What stood out',
  disclaimer: 'Patterns in what you wrote, not a diagnosis.',
};

// As in the Saving Journal: facts only, and a reset is a new start.
export const STREAK = {
  current: (n: number) => (n === 1 ? '1 day in a row with a record' : `${n} days in a row with a record`),
  fresh: (total: number) =>
    total ? `New start today. You've worked through thoughts on ${total} ${total === 1 ? 'day' : 'days'} so far.` : 'Your first record is waiting.',
  best: (n: number) => `Best: ${n} ${n === 1 ? 'day' : 'days'}`,
};

export const OFFLINE = {
  saved: "Saved on this phone. It will be finished when you're back online.",
};
