/**
 * A blank AI Chat: it says what Echo is, offers ways to begin (a starter is
 * sent as the user's own first message), and offers a grounding exercise.
 */
import React from 'react';
import {Text} from 'react-native';
import ReactTestRenderer, {ReactTestInstance} from 'react-test-renderer';

import ChatEntryScreen from '../src/screens/ChatEntryScreen';
import {createEntry, EntryState, sendMessage} from '../src/api/entries';

jest.mock('../src/api/entries', () => ({
  ...jest.requireActual('../src/api/entries'),
  createEntry: jest.fn(),
  sendMessage: jest.fn(),
}));

const flatten = (c: any): string =>
  Array.isArray(c) ? c.map(flatten).join('') : c == null || c === false ? '' : String(c);
const allText = (root: ReactTestInstance) => root.findAllByType(Text).map(t => flatten(t.props.children));
const byLabel = (root: ReactTestInstance, label: string) =>
  root.findAll(n => n.props.accessibilityLabel === label && typeof n.props.onPress === 'function')[0];

const chat = (over: Partial<EntryState> = {}): EntryState => ({
  id: 'c1', journal_type: 'chat', status: 'in_progress', started_at: '', completed_at: null,
  conversation_status: 'active', crisis_tier: null, support_note: null, pending_notice: null,
  pending_resume: false, parent_entry_id: null, next_capture: null, messages: [],
  crisis_event: null, referral: false, ...over,
});

async function openBlank(onOpenCalm = jest.fn()) {
  let root!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    root = ReactTestRenderer.create(
      <ChatEntryScreen journalType="chat" onExit={jest.fn()} onOpenCalm={onOpenCalm} />,
    );
  });
  return root.root;
}

beforeEach(() => jest.clearAllMocks());

test('says plainly that Echo is not a therapist, and nothing is created until a message', async () => {
  const root = await openBlank();
  expect(allText(root).join(' ')).toContain('not a therapist');
  expect(createEntry).not.toHaveBeenCalled();
});

test('a starter is sent as the first message', async () => {
  (createEntry as jest.Mock).mockResolvedValue(chat());
  (sendMessage as jest.Mock).mockResolvedValue(chat());
  const root = await openBlank();

  await ReactTestRenderer.act(async () => byLabel(root, "Say: I'm feeling anxious").props.onPress());
  expect(createEntry).toHaveBeenCalledWith('chat');
  expect(sendMessage).toHaveBeenCalledWith('c1', "I'm feeling anxious");
});

test('offers a grounding exercise before the first message', async () => {
  const onOpenCalm = jest.fn();
  const root = await openBlank(onOpenCalm);
  const grounding = root.findAll(
    n => typeof n.props.onPress === 'function' && allText(n).includes('Try a grounding exercise first'),
  )[0];
  await ReactTestRenderer.act(async () => grounding.props.onPress());
  expect(onOpenCalm).toHaveBeenCalled();
});
