/**
 * The Thought Journal's record: a quick one step by step, every step kept as a
 * draft (on the phone too, so offline loses nothing), a crisis word met with a
 * gentle stop and her choice, fixed questions when no model answers, a
 * check-in's feelings ticked, the trauma variant's shorter path, and the
 * change shown at the end.
 */
import React from 'react';
import {Modal, Text, TextInput} from 'react-native';
import ReactTestRenderer, {ReactTestInstance} from 'react-test-renderer';

import RecordFlow, {stepsFor} from '../src/thought/screens/RecordFlow';
import {EMPTY, askQuestion, getPrefill, saveRecord} from '../src/thought/api';
import {localDrafts, keepDraft} from '../src/thought/storage';
import {NetworkError} from '../src/api/client';
import {getLibrary} from '../src/api/libraries';
import {HELPERS} from '../src/thought/content';

// The quick record walks every step; on a busy machine that outlasts jest's 5 seconds.
jest.setTimeout(30000);

jest.mock('../src/thought/api', () => ({
  ...jest.requireActual('../src/thought/api'),
  saveRecord: jest.fn(),
  getPrefill: jest.fn(async () => []),
  askQuestion: jest.fn(async () => null),
  suggestTraps: jest.fn(async () => null),
  setFavorite: jest.fn(),
  editRecord: jest.fn(),
}));
jest.mock('../src/api/libraries', () => ({
  ...jest.requireActual('../src/api/libraries'),
  getLibrary: jest.fn(),
}));
jest.mock('../src/api/crisis', () => ({
  ...jest.requireActual('../src/api/crisis'),
  getCrisisResources: jest.fn(() => new Promise(() => {})),
}));

const flatten = (c: any): string =>
  Array.isArray(c) ? c.map(flatten).join('') : c == null || c === false ? '' : String(c);
const text = (root: ReactTestInstance) => root.findAllByType(Text).map(t => flatten(t.props.children)).join(' ');
const byLabel = (root: ReactTestInstance, label: string) =>
  root.findAll(n => typeof n.props.onPress === 'function' && n.props.accessibilityLabel === label)[0];
const byText = (root: ReactTestInstance, label: string) =>
  root.findAll(n => typeof n.props.onPress === 'function' && text(n) === label)[0];
const press = async (node: ReactTestInstance) => ReactTestRenderer.act(async () => node.props.onPress());
const write = async (root: ReactTestInstance, value: string, index = 0) =>
  ReactTestRenderer.act(async () => root.findAllByType(TextInput)[index].props.onChangeText(value));

const LIBRARIES: Record<string, any> = {
  feelings: {categories: [{id: 'worried', name: 'Worried', valence: 'negative', items: [
    {id: 'nervous', name: 'Nervous'}, {id: 'worried', name: 'Worried'}]}]},
  thought_situation_tags: {categories: [{id: 's', name: '', items: [{id: 'work', name: 'Work'}]}]},
  thinking_traps: {categories: [{id: 't', name: '', items: [{id: 'mind_reading', name: 'Mind reading', example: 'She must be upset.'}]}]},
};

const saved = (over = {}) => ({
  record: {id: 'r1', client_id: 'c1', status: 'in_progress', is_favorite: false},
  crisis_event: null,
  gentle: false,
  pattern: null,
  ...over,
});

async function render(props: Partial<React.ComponentProps<typeof RecordFlow>> = {}) {
  let tree!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(
      <RecordFlow clientId="c1" mode="quick" content={EMPTY} asksEvidenceFor situationRequired onClose={jest.fn()}
        onDone={jest.fn()} {...props} />,
    );
  });
  return tree.root;
}

beforeEach(() => {
  jest.clearAllMocks();
  (getLibrary as jest.Mock).mockImplementation(async (name: string) => LIBRARIES[name]);
});

test('a quick record: each step kept as a draft, then finished, with the change shown', async () => {
  (saveRecord as jest.Mock).mockResolvedValue(saved());
  const root = await render();
  expect(byText(root, 'Next').props.disabled).toBe(true);
  await write(root, 'My manager went quiet');
  await press(byLabel(root, 'Work'));
  await press(byText(root, 'Next'));
  expect((saveRecord as jest.Mock).mock.calls[0][2]).toMatchObject({complete: false, mode: 'quick'});

  await press(byLabel(root, 'Nervous'));
  await press(byLabel(root, 'Nervous at the time: 80 out of 100'));
  await press(byText(root, 'Next'));
  await write(root, 'She thinks my work is bad');
  await press(byText(root, 'Next'));
  await press(byLabel(root, 'Belief in the thought: 80 percent'));
  await press(byText(root, 'Next'));
  await write(root, 'She may be tired');
  await press(byText(root, 'Next'));
  await press(byLabel(root, 'Belief in the first thought now: 40 percent'));
  await press(byLabel(root, 'Nervous now: 50 out of 100'));
  (saveRecord as jest.Mock).mockResolvedValue(saved({record: {id: 'r1', status: 'completed', is_favorite: false}}));
  await press(byText(root, 'Finish'));

  const [clientId, content, options] = (saveRecord as jest.Mock).mock.calls.at(-1);
  expect(clientId).toBe('c1');
  expect(options).toMatchObject({complete: true});
  expect(content).toMatchObject({situation: 'My manager went quiet', situation_tags: ['work'],
    automatic_thought: 'She thinks my work is bad', belief_before: 80, belief_after: 40, balanced_thought: 'She may be tired',
    emotions: [{feeling: 'nervous', before: 80, after: 50}]});
  expect(text(root)).toContain('Belief 80% → 40%');
  expect(text(root)).toContain('Nervous 80 → 50');
  // Finished on the server: the phone's draft goes.
  expect((await localDrafts()).map(d => d.clientId)).not.toContain('c1');
});

test('offline, a step is kept on the phone and the record goes on', async () => {
  (saveRecord as jest.Mock).mockRejectedValue(new NetworkError());
  const root = await render({clientId: 'offline-1'});
  await write(root, 'Exam tomorrow');
  await press(byText(root, 'Next'));
  expect(text(root)).toContain('What did you feel in that moment?');
  const [draft] = (await localDrafts()).filter(d => d.clientId === 'offline-1');
  expect(draft).toMatchObject({step: 1, complete: false, content: expect.objectContaining({situation: 'Exam tomorrow'})});
});

test('a crisis word stops gently, shows support, and she chooses to go on', async () => {
  (saveRecord as jest.Mock).mockResolvedValue(
    saved({crisis_event: {tier: 'danger', text: 'Your safety matters most right now.', show_resources: true}}),
  );
  const root = await render();
  await write(root, 'Everything at home');
  await press(byText(root, 'Next'));
  const modal = root.findAllByType(Modal).find(m => m.props.transparent)!;
  expect(modal.props.visible).toBe(true);
  expect(text(root)).toContain('Your safety matters most right now.');
  await press(byText(root, 'Continue the record'));
  expect(root.findAllByType(Modal).find(m => m.props.transparent)!.props.visible).toBe(false);
  expect(text(root)).toContain('What did you feel in that moment?');
});

test('with no model, "Help me think" asks one of the fixed questions', async () => {
  (saveRecord as jest.Mock).mockResolvedValue(saved());
  const root = await render({mode: 'full', step: 5, content: {...EMPTY, situation: 'x', automatic_thought: 'y'}, recordId: 'r1'});
  expect(text(root)).toContain('What makes the thought feel true?');
  await press(byText(root, 'Help me think'));
  expect(askQuestion).toHaveBeenCalledWith('r1', 'for');
  expect(text(root)).toContain(HELPERS.for[0]);
});

test("opened from a check-in, its feelings start ticked", async () => {
  (getPrefill as jest.Mock).mockResolvedValue(['worried']);
  (saveRecord as jest.Mock).mockResolvedValue(saved());
  const root = await render({sourceEntryId: 'ci'});
  await write(root, 'Exam');
  await press(byText(root, 'Next'));
  expect(byLabel(root, 'Worried').props.accessibilityState.checked).toBe(true);
});

test('the trauma variant leaves out "what makes it feel true"', () => {
  expect(stepsFor('full', false)).not.toContain('evidenceFor');
  expect(stepsFor('full', true)).toContain('evidenceFor');
  expect(stepsFor('quick', true)).toEqual(['situation', 'emotions', 'thought', 'belief', 'balanced', 'rerate']);
});

test('the step bar groups every record into four stages', async () => {
  const stage = (root: ReactTestInstance) => root.findAll(n => /^Step \d of 4$/.test(n.props.accessibilityLabel ?? ''))[0].props.accessibilityLabel;
  expect(stage(await render())).toBe('Step 1 of 4');
  expect(stage(await render({step: 4}))).toBe('Step 3 of 4');
  expect(stage(await render({mode: 'full', step: 9}))).toBe('Step 4 of 4');
});

test('the third record of a day ends with a kind word, not a block', async () => {
  (saveRecord as jest.Mock).mockResolvedValue(saved({gentle: true, record: {id: 'r1', status: 'completed', is_favorite: false}}));
  const root = await render({step: 5, content: {...EMPTY, situation: 'x', automatic_thought: 'y'}});
  await press(byText(root, 'Finish'));
  expect(text(root)).toContain("That's a lot of hard thoughts in one day.");
});

test('drafts older than a week are let go', async () => {
  await keepDraft({clientId: 'old', content: EMPTY, mode: 'quick', step: 0, sourceEntryId: null, complete: false});
  const week = 8 * 86400000;
  expect((await localDrafts(Date.now() + week)).map(d => d.clientId)).not.toContain('old');
});
