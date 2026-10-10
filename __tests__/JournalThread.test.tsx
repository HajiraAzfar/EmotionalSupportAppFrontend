/**
 * The shared journal thread (ChatEntryScreen) on the Phase B engine.
 * Native rendering can only be confirmed on a device; this covers what JavaScript decides.
 */
import React from 'react';
import {Text} from 'react-native';
import ReactTestRenderer, {ReactTestInstance} from 'react-test-renderer';

import ChatEntryScreen from '../src/screens/ChatEntryScreen';
import {createEntry, EntryState, submitCapture} from '../src/api/entries';
import {getLibrary} from '../src/api/libraries';
import {NetworkError} from '../src/api/client';

jest.mock('../src/api/entries', () => ({
  ...jest.requireActual('../src/api/entries'),
  createEntry: jest.fn(),
  submitCapture: jest.fn(),
}));
jest.mock('../src/api/libraries', () => ({
  ...jest.requireActual('../src/api/libraries'),
  getLibrary: jest.fn(),
}));

// The real libraries the server serves.
const LIB_DIR = '../../emotional-support-backend/app/content/libraries/';
const LIBRARIES: Record<string, any> = {
  triggers: require(LIB_DIR + 'triggers.json'),
  feelings: require(LIB_DIR + 'feelings.json'),
  thinking_traps: require(LIB_DIR + 'thinking_traps.json'),
};
function libraryFor(name: string) {
  const raw = LIBRARIES[name];
  const categories = raw.categories ?? [{id: name, name: '', items: raw.items}];
  return {categories, total: categories.reduce((n: number, c: any) => n + c.items.length, 0), extendable: name !== 'thinking_traps'};
}

function state(next: EntryState['next_capture'], messages: EntryState['messages'] = []): EntryState {
  return {
    id: 'e1', journal_type: 'check_in', status: 'in_progress', started_at: '', completed_at: null,
    conversation_status: null, crisis_tier: null, support_note: null, pending_notice: null,
    pending_resume: false, parent_entry_id: null, next_capture: next, messages, crisis_event: null, referral: false,
  };
}
const listStep = (library: string) => state({
  value_id: library, control: 'multi_select', required: false, library, scale: null,
  max_length: null, repeatable: false, prefer_valence: null,
}, [{id: 'm1', role: 'ai', kind: 'capture_prompt', value_id: library, content: 'Pick any that fit.', sequence: 1, created_at: ''}]);
const textStep = state({
  value_id: 'trigger_note', control: 'free_text', required: false, library: null, scale: null,
  max_length: 2000, repeatable: false, prefer_valence: null,
}, [{id: 'm1', role: 'ai', kind: 'capture_prompt', value_id: 'trigger_note', content: 'Say a little more?', sequence: 1, created_at: ''}]);

const flatten = (c: any): string => (Array.isArray(c) ? c.map(flatten).join('') : c == null || c === false ? '' : String(c));
const textOf = (n: ReactTestInstance) => n.findAllByType(Text).map(t => flatten(t.props.children)).join('');
const allText = (root: ReactTestInstance) => root.findAllByType(Text).map(t => flatten(t.props.children));
const LEAKS = /\bskip|skipped|trigger|\bsoft\b|prominent|debugger|network request failed|expected value/i;
const flush = () => ReactTestRenderer.act(async () => {
  await new Promise<void>(r => setTimeout(r, 0));
});

async function open(first: EntryState) {
  jest.mocked(createEntry).mockResolvedValueOnce(first);
  let r: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    r = ReactTestRenderer.create(<ChatEntryScreen journalType="check_in" onExit={jest.fn()} />);
  });
  await flush();
  await flush();
  return r!.root;
}
const pressables = (root: ReactTestInstance, label: string | RegExp) =>
  root.findAll(n => typeof n.props.onPress === 'function' && (typeof label === 'string' ? textOf(n) === label : label.test(textOf(n))));
async function press(node: ReactTestInstance) {
  await ReactTestRenderer.act(async () => node.props.onPress());
  await flush();
}
const chips = (root: ReactTestInstance) =>
  root.findAll(n => n.props.accessibilityRole === 'checkbox' && typeof n.props.onPress === 'function');

beforeEach(() => {
  jest.mocked(getLibrary).mockImplementation(async (name: string) => libraryFor(name));
  jest.mocked(submitCapture).mockReset();
});

test.each(['triggers', 'feelings', 'thinking_traps'])('%s: every item tappable twice, every "+N more", Continue always on screen', async library => {
  const root = await open(listStep(library));
  while (pressables(root, /^\+\d+ more$/).length) {
    await press(pressables(root, /^\+\d+ more$/)[0]);
  }
  const labels = [...new Set(chips(root).map(n => n.props.accessibilityLabel as string))];
  expect(labels.length).toBe(libraryFor(library).total);
  for (const label of labels) {
    await ReactTestRenderer.act(async () => chips(root).find(n => n.props.accessibilityLabel === label)!.props.onPress());
  }
  expect(allText(root)).toContain(`Continue (${labels.length} selected)`);
  for (const label of labels) {
    await ReactTestRenderer.act(async () => chips(root).find(n => n.props.accessibilityLabel === label)!.props.onPress());
  }
  expect(allText(root)).toContain('Continue');
  expect(allText(root).join(' ')).not.toMatch(LEAKS);
});

test('a list step continues empty with one tap; no Skip anywhere', async () => {
  jest.mocked(submitCapture).mockResolvedValueOnce(textStep);
  const root = await open(listStep('triggers'));
  expect(allText(root).join(' ')).not.toMatch(LEAKS);
  await press(pressables(root, 'Continue')[0]);
  expect(jest.mocked(submitCapture).mock.calls[0].slice(1, 3)).toEqual(['triggers', []]);
});

test('an optional text step offers Continue (not Skip) and sends an empty answer', async () => {
  jest.mocked(submitCapture).mockResolvedValueOnce(listStep('thinking_traps'));
  const root = await open(textStep);
  expect(allText(root)).not.toContain('Skip');
  await press(pressables(root, 'Continue')[0]);
  expect(jest.mocked(submitCapture).mock.calls[0].slice(1, 4)).toEqual(['trigger_note', '', false]);
});

test('a failed send shows a calm line, and retry resends the same answer with the same client id', async () => {
  const root = await open(listStep('feelings'));
  await ReactTestRenderer.act(async () => chips(root)[0].props.onPress());
  jest.mocked(submitCapture).mockRejectedValueOnce(new NetworkError());
  await press(pressables(root, 'Continue (1 selected)')[0]);
  const text = allText(root).join(' ');
  expect(text).toContain("Couldn't send that.");
  expect(text).not.toMatch(LEAKS);

  jest.mocked(submitCapture).mockResolvedValueOnce(textStep);
  await press(pressables(root, 'Try again')[0]);
  const [first, second] = jest.mocked(submitCapture).mock.calls;
  expect(second).toEqual(first);
  expect(first[5]).toMatch(/^[0-9a-f-]{36}$/);
});
