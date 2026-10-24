/**
 * The check-in deck (DeckScreen): one card on screen, the next decided by the
 * server's next_capture. Native animation can only be confirmed on a device;
 * this covers what JavaScript decides — which card, and in what order.
 */
import React from 'react';
import {Text, TextInput} from 'react-native';
import ReactTestRenderer, {ReactTestInstance} from 'react-test-renderer';

import {Modal} from 'react-native';

import DeckScreen from '../src/screens/DeckScreen';
import {
  acknowledgeCrisis,
  askPerspective,
  createEntry,
  deleteEntry,
  EntryState,
  reviseCapture,
  submitCapture,
} from '../src/api/entries';
import {getLibrary} from '../src/api/libraries';

jest.mock('../src/api/entries', () => ({
  ...jest.requireActual('../src/api/entries'),
  createEntry: jest.fn(),
  submitCapture: jest.fn(),
  deleteEntry: jest.fn(),
  reviseCapture: jest.fn(),
  askPerspective: jest.fn(),
  acknowledgeCrisis: jest.fn(async () => ({})),
}));
// The resources screen loads its helplines; the tests only need it to open.
jest.mock('../src/api/crisis', () => ({
  ...jest.requireActual('../src/api/crisis'),
  getCrisisResources: jest.fn(() => new Promise(() => {})),
}));
jest.mock('../src/api/libraries', () => ({
  ...jest.requireActual('../src/api/libraries'),
  getLibrary: jest.fn(),
}));
jest.mock('../src/specs/NativeMindDocReminders', () => ({
  __esModule: true,
  default: {markDone: jest.fn(async () => {})},
}));
const mockReminders = jest.requireMock('../src/specs/NativeMindDocReminders').default;

const flatten = (c: any): string =>
  Array.isArray(c) ? c.map(flatten).join('') : c == null || c === false ? '' : String(c);
const allText = (root: ReactTestInstance) =>
  root.findAllByType(Text).map(t => flatten(t.props.children));
const textOf = (n: ReactTestInstance) =>
  n.findAllByType(Text).map(t => flatten(t.props.children)).join(' ');
const pressable = (root: ReactTestInstance, label: string) =>
  root.find(n => typeof n.props.onPress === 'function' && textOf(n).includes(label));
const press = async (node: ReactTestInstance) => {
  await ReactTestRenderer.act(async () => node.props.onPress());
};

function entry(
  next: EntryState['next_capture'],
  messages: EntryState['messages'] = [],
  over: Partial<EntryState> = {},
): EntryState {
  return {
    id: 'e1', journal_type: 'check_in', status: 'in_progress', started_at: '', completed_at: null,
    conversation_status: null, crisis_tier: null, support_note: null, pending_notice: null,
    pending_resume: false, parent_entry_id: null, next_capture: next, messages,
    crisis_event: null, referral: false, ...over,
  };
}

const prompt = (valueId: string, content: string, id = 'p1') => ({
  id, role: 'ai' as const, kind: 'capture_prompt' as const, value_id: valueId, content,
  sequence: 1, created_at: '',
});
const answer = (valueId: string, content: string, id = 'a1') => ({
  id, role: 'user' as const, kind: 'capture_answer' as const, value_id: valueId, content,
  sequence: 2, created_at: '',
});

const moodStep = entry(
  {value_id: 'mood', control: 'scale', required: true, library: null,
   scale: [{value: 1, label: 'Very low'}, {value: 5, label: 'Very good'}],
   max_length: null, repeatable: false, prefer_valence: null},
  [prompt('mood', 'How are you feeling right now?')],
);

const noteStep = entry(
  {value_id: 'trigger_note', control: 'free_text', required: false, library: null, scale: null,
   max_length: 2000, repeatable: false, prefer_valence: null},
  [prompt('mood', 'How are you feeling right now?'),
   answer('mood', '5 — Very good'),
   prompt('trigger_note', "Anything else you'd like to put down?", 'p2')],
);

async function render(journalType: 'check_in' | 'savouring' | 'thought' = 'check_in') {
  let tree!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(
      <DeckScreen journalType={journalType} onExit={jest.fn()} onContinueInThread={jest.fn()} />,
    );
  });
  return tree;
}

beforeEach(() => {
  jest.clearAllMocks();
  (getLibrary as jest.Mock).mockResolvedValue({categories: [], total: 0, extendable: false});
});

test('opens on the first card and shows only that question', async () => {
  (createEntry as jest.Mock).mockResolvedValue(moodStep);
  const tree = await render();
  const text = allText(tree.root);

  expect(createEntry).toHaveBeenCalledWith('check_in');
  expect(text).toContain('How are you feeling right now?');
  // The next question is not on screen yet: that is the whole point of a deck.
  expect(text.join(' ')).not.toContain("Anything else you'd like to put down?");
});

test('answering one card moves to the one the server sends next', async () => {
  (createEntry as jest.Mock).mockResolvedValue(moodStep);
  (submitCapture as jest.Mock).mockResolvedValue(noteStep);
  const tree = await render();

  await press(pressable(tree.root, 'Very good'));

  expect(submitCapture).toHaveBeenCalledWith('e1', 'mood', 5, false);
  expect(allText(tree.root)).toContain("Anything else you'd like to put down?");
});

test('nothing on a card has to be answered, and skipping is not a button', async () => {
  (createEntry as jest.Mock).mockResolvedValue(noteStep);
  (submitCapture as jest.Mock).mockResolvedValue(noteStep);
  const tree = await render();

  const text = allText(tree.root).join(' ').toLowerCase();
  expect(text).not.toContain('skip');

  // Continue with an empty note records a skip without ever saying the word.
  await press(pressable(tree.root, 'Continue'));
  expect(submitCapture).toHaveBeenCalledWith('e1', 'trigger_note', null, true);
});

test('fixed crisis content gets its own card, ahead of the next question', async () => {
  (createEntry as jest.Mock).mockResolvedValue(
    entry(
      {value_id: 'thinking_traps', control: 'multi_select', required: false,
       library: 'thinking_traps', scale: null, max_length: null, repeatable: false,
       prefer_valence: null},
      [prompt('thinking_traps', 'Did any of these fit?'),
       {id: 'c1', role: 'ai', kind: 'crisis', value_id: null,
        content: "You don't have to carry this alone.", sequence: 3, created_at: ''}],
      {crisis_tier: 'danger'},
    ),
  );
  const tree = await render();
  const text = allText(tree.root).join(' ');

  expect(text).toContain("You don't have to carry this alone.");
  // It is not something to scroll past: the question waits behind it.
  expect(text).not.toContain('Did any of these fit?');
});

test('the last card reads back what was saved, and never claims to save it again', async () => {
  (createEntry as jest.Mock).mockResolvedValue(
    entry(null,
      [answer('mood', '2 — Low'),
       answer('feelings', 'Tired', 'a2'),
       {id: 'c', role: 'ai', kind: 'closing', value_id: null,
        content: 'Thanks for taking the time.', sequence: 9, created_at: ''}],
      {status: 'completed', conversation_status: 'offered'}),
  );
  const tree = await render();
  const text = allText(tree.root);

  expect(text).toContain('2 — Low');
  expect(text).toContain('Tired');
  expect(text).toContain('Thanks for taking the time.');
  expect(text.join(' ')).toContain('Already saved');
  // Check-in offers a reflection; it happens in the thread, not here.
  expect(text.join(' ')).toContain('Talk it through with Echo');
});

test('leaving an untouched entry removes it', async () => {
  (createEntry as jest.Mock).mockResolvedValue(moodStep);
  (deleteEntry as jest.Mock).mockResolvedValue(null);
  const onExit = jest.fn();
  let tree!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(
      <DeckScreen journalType="check_in" onExit={onExit} onContinueInThread={jest.fn()} />,
    );
  });

  await press(pressable(tree.root, 'Leave'));

  expect(deleteEntry).toHaveBeenCalledWith('e1');
  expect(onExit).toHaveBeenCalled();
});

test('savouring runs the same deck with its own journal type', async () => {
  (createEntry as jest.Mock).mockResolvedValue(
    entry({value_id: 'event', control: 'free_text', required: true, library: null, scale: null,
           max_length: 2000, repeatable: false, prefer_valence: null},
      [prompt('event', 'What happened?')], {journal_type: 'savouring'}),
  );
  const tree = await render('savouring');

  expect(createEntry).toHaveBeenCalledWith('savouring');
  expect(allText(tree.root)).toContain('What happened?');
  expect(allText(tree.root)).toContain('Saving Journal');
});

test('the Saving Journal opens with its intro and offers starters while the answer is empty', async () => {
  (createEntry as jest.Mock).mockResolvedValue(
    entry({value_id: 'event', control: 'free_text', required: true, library: null, scale: null,
           max_length: 2000, repeatable: false, prefer_valence: null},
      [prompt('event', 'What happened?')], {journal_type: 'savouring'}),
  );
  const tree = await render('savouring');
  const starter = (label: string) =>
    tree.root.findAll(n => n.props.accessibilityLabel === `Start with: ${label}` && typeof n.props.onPress === 'function');

  expect(allText(tree.root)).toContain('Notice what made today a little better.');
  await press(starter('A small joy')[0]);
  // A starter begins the sentence; once there are words, the starters step aside.
  expect(tree.root.findByType(TextInput).props.value).toBe('A small joy: ');
  expect(starter('A kind moment')).toHaveLength(0);
});

test('the deck header keeps Get help one tap away, and the intro leaves after the first answer', async () => {
  (createEntry as jest.Mock).mockResolvedValue(moodStep);
  (submitCapture as jest.Mock).mockResolvedValue(noteStep);
  const tree = await render();

  expect(allText(tree.root)).toContain('Get help');
  expect(allText(tree.root)).toContain('Take a moment. Your feelings matter.');
  await press(pressable(tree.root, 'Very good'));
  expect(allText(tree.root)).not.toContain('Take a moment. Your feelings matter.');
});

// --- the thought record: ratings per feeling, going back, and a suggestion ---

const ratingStep = entry(
  {value_id: 'emotions_before', control: 'rating_set', required: false, library: null,
   scale: null, max_length: null, repeatable: false, prefer_valence: null,
   rates: {items: [{id: 'hurt', name: 'Hurt'}, {id: 'worried', name: 'Worried'}],
           min: 0, max: 100, carried: null},
   step: 5, total: 10},
  [prompt('feelings', 'What did you feel?'),
   answer('feelings', 'Hurt, Worried'),
   prompt('emotions_before', 'How strong was each one?', 'p2')],
  {journal_type: 'thought'},
);

const balancedStep = entry(
  {value_id: 'revised_thought', control: 'free_text', required: false, library: null,
   scale: null, max_length: 2000, repeatable: false, prefer_valence: null, voice: true,
   step: 9, total: 10},
  [prompt('automatic_thought', 'What went through your mind?'),
   answer('automatic_thought', 'woh mujhse naraz hai'),
   prompt('revised_thought', 'How would you put it now?', 'p2')],
  {journal_type: 'thought'},
);

test('a rating is asked per feeling she named, in words as well as numbers', async () => {
  (createEntry as jest.Mock).mockResolvedValue(ratingStep);
  (submitCapture as jest.Mock).mockResolvedValue(entry(null, [], {status: 'completed'}));
  const tree = await render('thought');
  const text = allText(tree.root);

  expect(text).toContain('Hurt');
  expect(text).toContain('Worried');

  // Each stop says what it means; a bare 0-100 number does not.
  await press(tree.root.find(n => n.props.accessibilityLabel === 'Hurt: Quite strong'));
  expect(allText(tree.root)).toContain('Quite strong');
  await press(pressable(tree.root, 'Continue'));
  // Eleven stops across 0-100: "quite strong" is the seventh, so 60. Only the
  // feeling she rated is sent — the other stays unrated, which is allowed.
  expect(submitCapture).toHaveBeenCalledWith('e1', 'emotions_before', {hurt: 60}, false);
});

test('rating nothing is a skip, and the word never appears', async () => {
  (createEntry as jest.Mock).mockResolvedValue(ratingStep);
  (submitCapture as jest.Mock).mockResolvedValue(entry(null, [], {status: 'completed'}));
  const tree = await render('thought');

  expect(allText(tree.root).join(' ').toLowerCase()).not.toContain('skip');
  await press(pressable(tree.root, 'Continue'));
  expect(submitCapture).toHaveBeenCalledWith('e1', 'emotions_before', null, true);
});

test('the second rating starts from the first, so she adjusts rather than starts over', async () => {
  (createEntry as jest.Mock).mockResolvedValue(
    entry({...ratingStep.next_capture!, value_id: 'emotions_after',
           rates: {items: [{id: 'hurt', name: 'Hurt'}], min: 0, max: 100, carried: {hurt: 80}}},
      [prompt('emotions_after', 'And how do they sit now?')], {journal_type: 'thought'}),
  );
  (submitCapture as jest.Mock).mockResolvedValue(entry(null, [], {status: 'completed'}));
  const tree = await render('thought');

  expect(allText(tree.root)).toContain('Very strong');
  await press(pressable(tree.root, 'Continue'));
  expect(submitCapture).toHaveBeenCalledWith('e1', 'emotions_after', {hurt: 80}, false);
});

test('the step count shown is the server count, never the app guessing', async () => {
  (createEntry as jest.Mock).mockResolvedValue(balancedStep);
  const tree = await render('thought');
  expect(allText(tree.root).join(' ')).toContain('Step 9 of 10');
});

// The thought step on its own, so a session can answer it and then go back to
// it — which is the only way an answer has a control to be reopened with.
const thoughtStep = entry(
  {value_id: 'automatic_thought', control: 'free_text', required: true, library: null,
   scale: null, max_length: 2000, repeatable: false, prefer_valence: null, voice: true,
   step: 3, total: 10},
  [prompt('automatic_thought', 'What went through your mind?')],
  {journal_type: 'thought'},
);

test('Back opens the last answer for changing, and saves it as a revision', async () => {
  (createEntry as jest.Mock).mockResolvedValue(thoughtStep);
  (submitCapture as jest.Mock).mockResolvedValue(balancedStep);
  (reviseCapture as jest.Mock).mockResolvedValue(balancedStep);
  const tree = await render('thought');

  const first = tree.root.findAllByType(TextInput)[0];
  await ReactTestRenderer.act(async () => first.props.onChangeText('woh mujhse naraz hai'));
  await press(pressable(tree.root, 'Continue'));
  expect(submitCapture).toHaveBeenCalledWith('e1', 'automatic_thought', 'woh mujhse naraz hai', false);

  // It was asked and answered in this session, so its card can be reopened.
  await press(pressable(tree.root, 'Back'));
  const changing = allText(tree.root).join(' ');
  expect(changing).toContain('CHANGING');
  expect(changing).toContain('What went through your mind?');
  // Her own words are what she comes back to, not an empty box.
  expect(tree.root.findAllByType(TextInput)[0].props.value).toBe('woh mujhse naraz hai');

  const again = tree.root.findAllByType(TextInput)[0];
  await ReactTestRenderer.act(async () => again.props.onChangeText('shayad woh busy thi'));
  await press(pressable(tree.root, 'Continue'));

  expect(reviseCapture).toHaveBeenCalledWith('e1', 'automatic_thought', 'shayad woh busy thi', false);
  // The forward-only submit is not how a change is saved.
  expect(submitCapture).toHaveBeenCalledTimes(1);
});

test('cancelling a change leaves the answer as it was', async () => {
  (createEntry as jest.Mock).mockResolvedValue(thoughtStep);
  (submitCapture as jest.Mock).mockResolvedValue(balancedStep);
  const tree = await render('thought');

  const input = tree.root.findAllByType(TextInput)[0];
  await ReactTestRenderer.act(async () => input.props.onChangeText('pehla jawab'));
  await press(pressable(tree.root, 'Continue'));
  await press(pressable(tree.root, 'Back'));
  await press(pressable(tree.root, 'Cancel'));

  expect(reviseCapture).not.toHaveBeenCalled();
  expect(allText(tree.root).join(' ')).toContain('How would you put it now?');
});

test('the review offers a change per answer, and the first version is not shown twice', async () => {
  const reviewed = entry(null,
    [prompt('situation', 'What happened?'),
     answer('situation', 'msg dekha'),
     prompt('revised_thought', 'How would you put it now?', 'p2'),
     answer('revised_thought', 'pehli koshish', 'a2'),
     {...answer('revised_thought', 'dobara likha', 'a3'), sequence: 5}],
    {journal_type: 'thought', status: 'completed', conversation_status: 'offered'});
  (createEntry as jest.Mock).mockResolvedValue(reviewed);
  const tree = await render('thought');
  const text = allText(tree.root);

  expect(text).toContain('dobara likha');
  // Her earlier version stays in the thread, but the review reads the latest.
  expect(text).not.toContain('pehli koshish');
  // Nothing was asked in this session, so there is no control to reopen with
  // and no Change is offered that could not work.
  expect(text.join(' ')).not.toContain('Change');
});

test('another perspective is asked for, labelled as a suggestion, and never her answer', async () => {
  (createEntry as jest.Mock).mockResolvedValue(balancedStep);
  (askPerspective as jest.Mock).mockResolvedValue(
    entry(balancedStep.next_capture, [
      ...balancedStep.messages,
      {id: 's1', role: 'ai' as const, kind: 'perspective' as const, value_id: null,
       content: 'Ho sakta hai woh busy ho.', sequence: 6, created_at: ''},
    ], {journal_type: 'thought'}),
  );
  const tree = await render('thought');

  await press(pressable(tree.root, 'Help me explore another perspective'));
  expect(askPerspective).toHaveBeenCalledWith('e1');
  const text = allText(tree.root).join(' ');
  expect(text).toContain('Ho sakta hai woh busy ho.');
  expect(text).toContain("ECHO'S SUGGESTION");
  // It did not land in the box she writes her own answer in.
  expect(tree.root.findAllByType(TextInput)[0].props.value).toBe('');
});

test('a suggestion that cannot be written says so and leaves the entry alone', async () => {
  (createEntry as jest.Mock).mockResolvedValue(balancedStep);
  (askPerspective as jest.Mock).mockRejectedValue(new Error('503'));
  const tree = await render('thought');

  await press(pressable(tree.root, 'Help me explore another perspective'));
  const text = allText(tree.root).join(' ');
  expect(text).toContain("Couldn't think of another angle");
  expect(text).toContain('How would you put it now?');
});

// --- the three daily check-ins: pre-filled feelings, the safety question, cross-links ---

test('a journal opened from a check-in starts with its feelings ticked', async () => {
  (createEntry as jest.Mock).mockResolvedValue(
    entry({value_id: 'feelings', control: 'multi_select', required: false, library: 'feelings', scale: null,
           max_length: null, repeatable: false, prefer_valence: null, preselected: ['tired']},
      [prompt('feelings', 'Which feelings are here?')], {journal_type: 'thought'}),
  );
  (submitCapture as jest.Mock).mockResolvedValue(noteStep);
  let tree!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(
      <DeckScreen journalType="thought" sourceEntryId="c1" onExit={jest.fn()} onContinueInThread={jest.fn()} />,
    );
  });
  expect(createEntry).toHaveBeenCalledWith('thought', undefined, {slot: undefined, localDate: undefined, sourceEntryId: 'c1'});
  await press(pressable(tree.root, 'Continue'));
  expect(submitCapture).toHaveBeenCalledWith('e1', 'feelings', ['tired'], false);
});

test('a positive safety answer opens the resources at once, and moving on is recorded', async () => {
  const phq9 = (id: string) => ({value_id: id, control: 'scale' as const, required: false, library: null,
    scale: [{value: 0, label: 'Not at all'}, {value: 1, label: 'Several days'},
            {value: 2, label: 'More than half the days'}, {value: 3, label: 'Nearly every day'}],
    max_length: null, repeatable: false, prefer_valence: null, fixed: true});
  (createEntry as jest.Mock).mockResolvedValue(entry(phq9('phq9_9'), [prompt('phq9_9', 'Thoughts that you would be better off dead or of hurting yourself in some way')]));
  (submitCapture as jest.Mock).mockResolvedValue(entry(phq9('gad7_1'),
    [{id: 'c9', role: 'ai', kind: 'crisis', value_id: null, content: "You don't have to carry this alone.", sequence: 3, created_at: ''},
     prompt('gad7_1', 'Feeling nervous, anxious or on edge', 'p2')],
    {crisis_tier: 'danger', crisis_event: {tier: 'danger', variant: 'full', text: "You don't have to carry this alone.", show_resources: true}}));
  let tree!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(
      <DeckScreen journalType="check_in" slot="evening" onExit={jest.fn()} onContinueInThread={jest.fn()} />,
    );
  });
  expect(allText(tree.root)).toContain('Evening check-in');
  // Choices with their own words: no numbers on them.
  expect(allText(tree.root)).toContain('Several days');
  await press(pressable(tree.root, 'Several days'));

  expect(tree.root.findAllByType(Modal).some(m => m.props.visible)).toBe(true);
  expect(allText(tree.root).join(' ')).toContain("You don't have to carry this alone.");
  expect(allText(tree.root).join(' ')).not.toContain('Feeling nervous');
  await press(pressable(tree.root, 'Continue'));
  expect(acknowledgeCrisis).toHaveBeenCalledWith('e1');
  expect(allText(tree.root).join(' ')).toContain('Feeling nervous');
});

test("an evening's Yes leads on to its journal, and the weekly answers are not read back", async () => {
  (createEntry as jest.Mock).mockResolvedValue(
    entry(null,
      [answer('mood', '3 — Okay'),
       answer('bothering_thoughts', '1 — Yes', 'a2'),
       answer('good_moment', '0 — No', 'a3'),
       answer('phq9_1', '1 — Several days', 'a4')],
      {status: 'completed', conversation_status: 'offered'}),
  );
  const onOpenJournal = jest.fn();
  let tree!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(
      <DeckScreen journalType="check_in" slot="evening" onExit={jest.fn()} onContinueInThread={jest.fn()}
        onOpenJournal={onOpenJournal} />,
    );
  });
  const text = allText(tree.root).join(' ');
  expect(text).toContain('Work through that thought (Thought Journal)');
  expect(text).not.toContain('Saving Journal)');
  expect(text).not.toContain('1 — Several days');
  expect(text).toContain("This week's questions are saved. No score is shown.");
  await press(pressable(tree.root, 'Work through that thought'));
  expect(onOpenJournal).toHaveBeenCalledWith('thought', 'e1');
});

test('a finished slot check-in is read back without a way to change it', async () => {
  (createEntry as jest.Mock).mockResolvedValue(
    entry(null, [answer('mood', '3 — Okay'), answer('intention', 'Rest a little', 'a2')],
      {status: 'completed', slot: 'morning', local_date: '2026-10-22', conversation_status: 'offered'}),
  );
  const tree = await render();
  const text = allText(tree.root).join(' ');
  expect(text).toContain('Rest a little');
  expect(text).toContain('Saved as you went, and kept as it is.');
  expect(text).not.toContain('Change');
});

test("a slot's reminder is quieted for its day only once the check-in is finished", async () => {
  const morning = {slot: 'morning' as const, local_date: '2026-10-22'};
  (createEntry as jest.Mock).mockResolvedValue({...moodStep, ...morning});
  (submitCapture as jest.Mock).mockResolvedValue(entry(null, [], {status: 'completed', ...morning}));
  let tree!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(
      <DeckScreen journalType="check_in" slot="morning" onExit={jest.fn()} onContinueInThread={jest.fn()} />,
    );
  });
  expect(mockReminders.markDone).not.toHaveBeenCalled();
  await press(pressable(tree.root, 'Very good'));
  expect(mockReminders.markDone).toHaveBeenCalledWith('morning', '2026-10-22');
});
