/**
 * The Exposure Journal: a quick repeat from plan to review, a break that is
 * never a failure, a step set aside, the timer with anxiety notes, a crisis
 * word met gently, a planned exposure's reminder that goes once it is done, a
 * source's feelings ticked, the screening note shown once, and the ladder's
 * order and removal.
 */
import React from 'react';
import {Modal, Text, TextInput} from 'react-native';
import ReactTestRenderer, {ReactTestInstance} from 'react-test-renderer';

import ExposureFlow from '../src/exposure/screens/ExposureFlow';
import ExposureModule from '../src/exposure/ExposureModule';
import LadderScreen from '../src/exposure/screens/LadderScreen';
import {EMPTY, Ladder, getHeatmap, getHome, getPrefill, removeStep, reorderSteps, saveExposure} from '../src/exposure/api';
import {getLibrary} from '../src/api/libraries';

jest.setTimeout(30000);

jest.mock('../src/exposure/api', () => ({
  ...jest.requireActual('../src/exposure/api'),
  saveExposure: jest.fn(),
  getPrefill: jest.fn(async () => []),
  getHome: jest.fn(),
  getHeatmap: jest.fn(),
  reorderSteps: jest.fn(),
  removeStep: jest.fn(),
  addStep: jest.fn(),
  updateStep: jest.fn(),
  updateLadder: jest.fn(),
}));
jest.mock('../src/api/libraries', () => ({
  ...jest.requireActual('../src/api/libraries'),
  getLibrary: jest.fn(),
}));
jest.mock('../src/api/crisis', () => ({
  ...jest.requireActual('../src/api/crisis'),
  getCrisisResources: jest.fn(() => new Promise(() => {})),
}));
jest.mock('../src/specs/NativeMindDocReminders', () => ({
  __esModule: true,
  default: {scheduleOnce: jest.fn(async () => {}), cancelOnce: jest.fn(async () => {}), markDone: jest.fn(async () => {})},
}));
const mockNative = jest.requireMock('../src/specs/NativeMindDocReminders').default;

const flatten = (c: any): string =>
  Array.isArray(c) ? c.map(flatten).join('') : c == null || c === false ? '' : String(c);
const text = (root: ReactTestInstance) => root.findAllByType(Text).map(t => flatten(t.props.children)).join(' ');
const byLabel = (root: ReactTestInstance, label: string) =>
  root.findAll(n => typeof n.props.onPress === 'function' && n.props.accessibilityLabel === label)[0];
const byText = (root: ReactTestInstance, label: string) =>
  root.findAll(n => typeof n.props.onPress === 'function' && text(n) === label)[0];
const press = async (node: ReactTestInstance) => ReactTestRenderer.act(async () => node.props.onPress());
const write = async (root: ReactTestInstance, value: string) =>
  ReactTestRenderer.act(async () => root.findAllByType(TextInput)[0].props.onChangeText(value));

const LADDERS: Ladder[] = [{
  id: 'l1', fear_name: 'Speaking up', archived: false, tags: [],
  steps: [
    {id: 's1', description: 'Say good morning', expected_suds: 20, sort_order: 0, archived: false, attempts: 0, completed: 0, last_peak: null, suggested_start: false},
    {id: 's2', description: 'Ask a question', expected_suds: 40, sort_order: 1, archived: false, attempts: 1, completed: 1, last_peak: 50, suggested_start: true},
  ],
}];

const saved = (status: string, over = {}) => ({
  record: {id: 'x1', client_id: 'c1', status, is_favorite: false},
  crisis_event: null, gentle: false, pattern: null, ...over,
});

async function render(props: Partial<React.ComponentProps<typeof ExposureFlow>> = {}) {
  let tree!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(
      <ExposureFlow clientId="c1" mode="quick" content={EMPTY} status="draft" ladders={LADDERS} onClose={jest.fn()}
        onDone={jest.fn()} onOpenLadders={jest.fn()} {...props} />,
    );
  });
  return tree.root;
}

const statuses = () => (saveExposure as jest.Mock).mock.calls.map(call => call[2].status);

beforeEach(() => {
  jest.clearAllMocks();
  (getLibrary as jest.Mock).mockImplementation(async (name: string) => ({
    categories: [{id: 'c', name: '', items: name === 'safety_behaviours'
      ? [{id: 'eye_contact', name: 'Avoiding eye contact'}] : [{id: 'nervous', name: 'Nervous'}]}],
  }));
  (saveExposure as jest.Mock).mockImplementation(async (_id: string, _c: unknown, o: {status: string}) => saved(o.status));
});

test('a quick repeat: pick the step, predict, then how it went', async () => {
  const root = await render();
  await press(byLabel(root, 'Ask a question, expected 40, a good place to start'));
  await press(byText(root, 'Next'));
  await write(root, 'Everyone will stare');
  await press(byText(root, 'Next'));
  await press(byLabel(root, 'Expected anxiety: 70 out of 100'));
  await press(byText(root, 'Next'));
  expect(text(root)).toContain('Did you do it?');
  await press(byLabel(root, 'Yes'));
  await press(byText(root, 'Next'));
  await press(byLabel(root, 'Peak anxiety: 50 out of 100'));
  await press(byLabel(root, 'Anxiety at the end: 20 out of 100'));
  await press(byText(root, 'Next'));
  await press(byLabel(root, 'No'));
  await press(byText(root, 'Save'));

  expect(statuses()).toEqual(['draft', 'draft', 'draft', 'planned', 'planned', 'completed']);
  const [, content] = (saveExposure as jest.Mock).mock.calls.at(-1);
  expect(content).toMatchObject({ladder_item_id: 's2', feared_outcome: 'Everyone will stare', predicted_anxiety: 70,
    anxiety_peak: 50, anxiety_end: 20, outcome_occurred: 'no'});
  expect(text(root)).toContain('You did it. That took courage.');
  expect(text(root)).toContain('You expected 70; the peak was 50.');
});

test('a break keeps what is there and is never called a failure', async () => {
  const root = await render();
  await press(byLabel(root, 'Ask a question, expected 40, a good place to start'));
  await press(byText(root, 'Pause / I need a break'));
  expect(statuses().at(-1)).toBe('draft');
  expect(text(root)).toContain("Saved. Come back whenever you like; nothing is lost.");
  expect(text(root)).not.toMatch(/fail|gave up|quit/i);
});

test('a step set aside is saved as skipped, kindly', async () => {
  const root = await render({status: 'planned', phase: 'review', content: {...EMPTY, ladder_item_id: 's2', feared_outcome: 'x'}});
  await press(byLabel(root, 'Not this time'));
  await press(byText(root, 'Save'));
  expect(statuses().at(-1)).toBe('skipped');
  expect(text(root)).toContain("Not this time, and that's okay.");
  expect(text(root)).not.toMatch(/fail/i);
});

test('doing it: the timer, an anxiety note, and the review starts from it', async () => {
  const root = await render({mode: 'full', status: 'planned', phase: 'review',
    content: {...EMPTY, ladder_item_id: 's2', feared_outcome: 'x', predicted_anxiety: 60}});
  await press(byText(root, 'Not yet? Start it now, with a timer'));
  expect(text(root)).toContain('You are doing it');
  expect(text(root)).toContain("There's no need to wait for the anxiety to fall.");
  await press(byText(root, 'Note how anxious I am'));
  await press(byLabel(root, 'How anxious right now?: 60 out of 100'));
  await press(byText(root, 'Finish'));
  expect(text(root)).toContain('Did you do it?');
  await press(byLabel(root, 'Yes'));
  await press(byText(root, 'Next'));
  expect(byLabel(root, 'Peak anxiety: 60 out of 100').props.accessibilityState.checked).toBe(true);
});

test('a crisis word stops gently and she chooses to go on', async () => {
  (saveExposure as jest.Mock).mockResolvedValue(
    saved('draft', {crisis_event: {tier: 'danger', text: 'Your safety matters most right now.', show_resources: true}}),
  );
  const root = await render();
  await press(byLabel(root, 'Ask a question, expected 40, a good place to start'));
  await press(byText(root, 'Next'));
  expect(root.findAllByType(Modal).find(m => m.props.transparent)!.props.visible).toBe(true);
  await press(byText(root, 'Continue'));
  expect(root.findAllByType(Modal).find(m => m.props.transparent)!.props.visible).toBe(false);
});

test('a planned exposure gets one reminder, and it goes once the plan is done', async () => {
  const future = '2099-01-01T09:00';
  const root = await render({mode: 'full', step: 7, content: {...EMPTY, ladder_item_id: 's2', feared_outcome: 'x', scheduled_for: future}});
  await press(byLabel(root, 'Remind me then'));
  await press(byText(root, 'Save the plan'));
  expect(mockNative.scheduleOnce).toHaveBeenCalledWith('c1', new Date(2099, 0, 1, 9, 0).getTime());
  expect(text(root)).toContain('Your plan is saved.');

  // Later the same plan is done: its reminder has nothing left to wait for.
  const done = await render({mode: 'quick', status: 'planned', phase: 'review',
    content: {...EMPTY, ladder_item_id: 's2', feared_outcome: 'x', scheduled_for: future}});
  await press(byLabel(done, 'Yes'));
  await press(byText(done, 'Next'));
  await press(byText(done, 'Next'));
  await press(byText(done, 'Save'));
  expect(mockNative.cancelOnce).toHaveBeenCalledWith('c1');
});

test('planned from a check-in or thought record, its feelings start ticked', async () => {
  (getPrefill as jest.Mock).mockResolvedValue(['nervous']);
  const root = await render({sourceEntryId: 'src'});
  await press(byLabel(root, 'Ask a question, expected 40, a good place to start'));
  await press(byText(root, 'Next'));
  expect(byLabel(root, 'Nervous').props.accessibilityState.checked).toBe(true);
});

test('the screening note comes before the first exposure, once', async () => {
  (getHome as jest.Mock).mockResolvedValue({drafts: [], planned: [], recent: [], total_done: 0, today_done: 0, gentle: false,
    pattern: null, suggest_professional: true, ladders: LADDERS});
  (getHeatmap as jest.Mock).mockResolvedValue({days: [], streak: {current: 0, best: 0, total_days: 0, today_counted: false}});
  let tree!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(<ExposureModule onExit={jest.fn()} />);
  });
  await press(byText(tree.root, 'Plan an exposure'));
  expect(text(tree.root)).toContain('Exposure is for fears that are bigger than the actual danger');
  expect(text(tree.root)).toContain('it may help to do exposures with a professional');
  await press(byText(tree.root, 'I understand, continue'));
  expect(text(tree.root)).toContain('Which step will you try?');
  await press(byLabel(tree.root, 'Back'));
  await press(byText(tree.root, 'Plan an exposure'));
  expect(text(tree.root)).toContain('Which step will you try?');
});

test('a ladder: steps move up and down, and one can be removed', async () => {
  (reorderSteps as jest.Mock).mockResolvedValue({ladders: LADDERS});
  (removeStep as jest.Mock).mockResolvedValue({outcome: 'archived', ladders: LADDERS});
  let tree!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(<LadderScreen ladder={LADDERS[0]} onBack={jest.fn()} onSaved={jest.fn()} />);
  });
  await press(byText(tree.root, 'Move down'));
  expect(reorderSteps).toHaveBeenCalledWith('l1', ['s2', 's1']);
  await press(tree.root.findAll(n => typeof n.props.onPress === 'function' && text(n) === 'Remove')[1]);
  expect(removeStep).toHaveBeenCalledWith('l1', 's2');
});
