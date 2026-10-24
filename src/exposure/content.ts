// The Exposure Journal's words, in one place. Fixed, no AI (v1).
// DRAFT_NOT_CLINICALLY_APPROVED: every line here is for the clinical advisor
// to review (tone: steady and kind; stopping, pausing or doing part of a step
// is never a failure; no pressure to wait for anxiety to fall).

export const TITLE = 'Exposure Journal';

export const SCREENING = {
  title: 'Before you start',
  body:
    'Exposure is for fears that are bigger than the actual danger: a phone call, a lift, speaking up. It is not for situations that are truly unsafe, and it is not for going back over a traumatic event.',
  professional:
    'Because of what you shared, it may help to do exposures with a professional alongside you. You can still continue here whenever you choose.',
  pace: 'Go at your own pace. You can pause or stop at any point, and that is never a failure.',
  ok: 'I understand, continue',
};

export const HOME = {
  intro: 'Face a fear a step at a time: predict what will happen, try a step, and see what actually did.',
  week: 'Three to five planned steps a week is plenty.',
  plan: 'Plan an exposure',
  quick: 'Repeat a step (quick)',
  ladders: 'Your fear ladders',
  newLadder: 'Build a fear ladder',
  planned: 'Planned',
  drafts: 'Continue where you left off',
  recent: 'Your last exposures',
  history: 'All your exposures',
  insights: 'Your patterns',
  export: 'Export your data',
};

export const LADDER = {
  title: 'Fear ladder',
  name: 'What is the fear?',
  namePlaceholder: 'Speaking up at work',
  tags: 'What is it about?',
  steps: 'Steps, from easier to harder',
  stepsHint: '5 to 10 steps is a good ladder. Rate how anxious each would make you, 0 to 100.',
  stepPlaceholder: 'Ask one question in a meeting',
  add: 'Add a step',
  sort: 'Sort by anxiety',
  up: 'Move up',
  down: 'Move down',
  remove: 'Remove',
  save: 'Save the ladder',
  start: 'A good place to start: a step around 30 to 50.',
  online: 'Ladders can be changed when you are online.',
  expected: (n: number) => `Expected ${n}`,
};

export const PLAN = {
  step: 'Which step will you try?',
  noLadder: 'Build a ladder first, then pick a step from it.',
  fear: 'What are you afraid will happen?',
  fearHint: 'Be specific: what exactly, and how bad.',
  likelihood: 'How likely is it to happen, 0 to 100%?',
  severity: 'If it did happen, how bad would it be?',
  anxiety: 'How anxious do you expect to feel at the peak?',
  safety: 'Which of these will you try to drop this time?',
  safetyHint: 'Optional. Doing the step without them is how you learn most.',
  goal: 'What would you like to find out?',
  goalPlaceholder: 'Whether anyone actually reacts the way I fear.',
  when: 'When will you do it?',
  now: 'Now',
  reminder: 'Remind me then',
  times: [
    {label: 'This evening', days: 0, hour: 18},
    {label: 'Tomorrow morning', days: 1, hour: 9},
    {label: 'Tomorrow evening', days: 1, hour: 18},
    {label: 'In two days', days: 2, hour: 9},
  ],
  savePlan: 'Save the plan',
  start: 'Start now',
};

export const DURING = {
  title: 'You are doing it',
  hint: "Stay with it as long as you choose. There's no need to wait for the anxiety to fall.",
  check: 'How anxious right now?',
  checkButton: 'Note how anxious I am',
  pause: 'Pause',
  resume: 'Carry on',
  grounding: 'Grounding',
  finish: 'Finish',
};

export const REVIEW = {
  did: 'Did you do it?',
  startNow: 'Not yet? Start it now, with a timer',
  didOptions: [
    {id: 'completed', label: 'Yes'},
    {id: 'partial', label: 'Partly'},
    {id: 'skipped', label: 'Not this time'},
  ] as const,
  peak: 'How anxious did you get at the peak?',
  end: 'And by the end?',
  happened: 'What actually happened?',
  occurred: 'Did what you feared happen?',
  occurredOptions: [
    {id: 'no', label: 'No'},
    {id: 'partly', label: 'Partly'},
    {id: 'yes', label: 'Yes'},
  ] as const,
  compare: 'You predicted, and what was',
  used: 'Did any safety behaviours creep in?',
  usedHint: 'That is very common. Noticing them is part of the work.',
  learning: 'What did you learn, or what surprised you?',
  next: 'What next?',
  nextOptions: [
    {id: 'repeat', label: 'Repeat this step'},
    {id: 'move_up', label: 'Move up the ladder'},
    {id: 'variation', label: 'Try a variation'},
  ] as const,
  save: 'Save',
};

export const DONE = {
  completed: 'You did it. That took courage.',
  partial: 'You did part of it. That counts, and it is how ladders get climbed.',
  skipped: "Not this time, and that's okay. The plan is still yours to come back to.",
  planned: 'Your plan is saved.',
  likely: (predicted: number, occurred: string) => `You predicted ${predicted}% likely. It ${occurred}.`,
  anxiety: (predicted: number, peak: number) => `You expected ${predicted}; the peak was ${peak}.`,
  savoring: 'Hold on to something good too? (Saving Journal)',
  finish: 'Done',
};

export const OCCURRED = {yes: 'happened', partly: 'partly happened', no: "didn't happen"};

export const BREAK = {
  button: 'Pause / I need a break',
  saved: "Saved. Come back whenever you like; nothing is lost.",
};

export const GENTLE = {
  daily: "Two exposures in one day is a lot. Give yourself some rest; there's no rush.",
  pattern: (step: string) =>
    `"${step}" has been tried a few times over some weeks without the prediction or the peak coming down. Talking it through with a professional could help you find what fits next.`,
  resources: 'See support options',
};

export const CRISIS = {
  continue: 'Continue',
  stop: 'Stop for now (it is saved)',
};

export const INSIGHTS = {
  title: 'Your patterns',
  periods: [
    {label: '30 days', days: 30},
    {label: '3 months', days: 90},
    {label: 'A year', days: 365},
  ],
  done: 'Done fully or in part',
  partial: 'Done in part',
  skipped: 'Set aside',
  steps: 'Steps tried / completed',
  highest: 'Highest step completed',
  likelihood: 'Predicted, and how often it happened',
  anxiety: 'Predicted, peak and end anxiety',
  waiting: 'Shows from 3 exposures',
  repeats: 'Steps you came back to',
  safety: 'Safety behaviours: planned to drop, and used',
  patterns: 'What stood out',
  disclaimer: 'Patterns in what you recorded, not a diagnosis.',
};

export const EXPORT = {
  title: 'Export your data',
  body: 'A file with your fear ladders and their steps, and every exposure: what you predicted, how anxious you got, and what happened.',
  notes: 'Include my written notes',
  notesHint: 'What you feared, what happened and what you learned, in your words. Off unless you turn it on.',
  disclaimer: 'Self-reported data, not a diagnosis.',
  button: 'Export',
  saved: (name: string) => `Saved to your Downloads as ${name}.`,
};

export const OFFLINE = {
  saved: "Saved on this phone. It will be sent when you're back online.",
};

export const STREAK = {
  current: (n: number) => (n === 1 ? '1 day in a row with a step' : `${n} days in a row with a step`),
  fresh: (total: number) =>
    total ? `New start today. You've practised on ${total} ${total === 1 ? 'day' : 'days'} so far.` : 'Your first step is waiting.',
  best: (n: number) => `Best: ${n} ${n === 1 ? 'day' : 'days'}`,
};
