/**
 * A blank AI Chat: it says what Reframe is, offers a grounding exercise, and
 * its header is only Exit and Get help.
 */
import React from 'react';
import {Alert, Text} from 'react-native';
import ReactTestRenderer, {ReactTestInstance} from 'react-test-renderer';

import ChatEntryScreen from '../src/screens/ChatEntryScreen';
import {chooseConversation, createEntry, EntryState, getEntry} from '../src/api/entries';

jest.mock('../src/api/entries', () => ({
  ...jest.requireActual('../src/api/entries'),
  createEntry: jest.fn(),
  getEntry: jest.fn(),
  chooseConversation: jest.fn(),
}));

const chatState = (conversation_status: EntryState['conversation_status']): EntryState => ({
  id: 'c1', journal_type: 'chat', status: 'in_progress', started_at: '', completed_at: null,
  conversation_status, crisis_tier: null, support_note: null, pending_notice: null,
  pending_resume: false, parent_entry_id: null, next_capture: null, crisis_event: null, referral: false,
  messages: [
    {id: 'm1', role: 'user', kind: 'chat', value_id: null, content: 'hi', sequence: 1, created_at: ''},
    {id: 'm2', role: 'ai', kind: 'chat', value_id: null, content: 'Hello.', sequence: 2, created_at: ''},
  ],
});

const flatten = (c: any): string =>
  Array.isArray(c) ? c.map(flatten).join('') : c == null || c === false ? '' : String(c);
const allText = (root: ReactTestInstance) => root.findAllByType(Text).map(t => flatten(t.props.children));
const byLabel = (root: ReactTestInstance, label: string) =>
  root.findAll(n => n.props.accessibilityLabel === label && typeof n.props.onPress === 'function')[0];

async function openBlank(onOpenCalm = jest.fn(), onExit = jest.fn()) {
  let root!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    root = ReactTestRenderer.create(
      <ChatEntryScreen journalType="chat" onExit={onExit} onOpenCalm={onOpenCalm} />,
    );
  });
  return root.root;
}

beforeEach(() => jest.clearAllMocks());

test('says plainly that Reframe is not a therapist, and nothing is created until a message', async () => {
  const root = await openBlank();
  expect(allText(root).join(' ')).toContain('not a therapist');
  expect(createEntry).not.toHaveBeenCalled();
});

test('the header is only Exit and Get help, no ready-made messages, and Exit leaves', async () => {
  const onExit = jest.fn();
  const root = await openBlank(jest.fn(), onExit);
  const text = allText(root);
  expect(text).toEqual(expect.arrayContaining(['Exit', 'Get help']));
  for (const gone of ['New chat', 'Past chats', 'AI Chat', "I'm feeling anxious"]) {
    expect(text).not.toContain(gone);
  }
  expect(byLabel(root, 'Quick exit')).toBeUndefined();

  const exit = root.findAll(n => typeof n.props.onPress === 'function' && allText(n).join('') === 'Exit')[0];
  await ReactTestRenderer.act(async () => exit.props.onPress());
  expect(onExit).toHaveBeenCalled();
  expect(createEntry).not.toHaveBeenCalled();
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

async function openActive(onNewChat = jest.fn()) {
  jest.mocked(getEntry).mockResolvedValueOnce(chatState('active'));
  jest.mocked(chooseConversation).mockResolvedValue(chatState('closed'));
  let root!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    root = ReactTestRenderer.create(
      <ChatEntryScreen journalType="chat" entryId="c1" onExit={jest.fn()} onNewChat={onNewChat} />,
    );
  });
  return root.root;
}
const pressText = (root: ReactTestInstance, label: string) =>
  root.findAll(n => typeof n.props.onPress === 'function' && allText(n).join('') === label)[0];

test('a chat under way offers New chat and End & save under the composer, not in the header', async () => {
  const root = await openActive();
  const text = allText(root);
  expect(text).toEqual(expect.arrayContaining(['Exit', 'Get help', 'New chat', 'End & save']));
});

test('New chat ends this chat (kept in History) and opens a blank one', async () => {
  const onNewChat = jest.fn();
  const root = await openActive(onNewChat);
  await ReactTestRenderer.act(async () => pressText(root, 'New chat').props.onPress());
  expect(chooseConversation).toHaveBeenCalledWith('c1', 'end');
  expect(onNewChat).toHaveBeenCalled();
});

test('End & save asks first, then closes the chat and says it is saved', async () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  const root = await openActive();
  await ReactTestRenderer.act(async () => pressText(root, 'End & save').props.onPress());
  expect(chooseConversation).not.toHaveBeenCalled();
  const buttons = alert.mock.calls[0][2]!;
  await ReactTestRenderer.act(async () => buttons[1].onPress!());
  expect(chooseConversation).toHaveBeenCalledWith('c1', 'end');
  expect(allText(root).join(' ')).toContain('This chat is saved in History.');
  expect(allText(root)).toContain('Start a new chat');
  alert.mockRestore();
});
