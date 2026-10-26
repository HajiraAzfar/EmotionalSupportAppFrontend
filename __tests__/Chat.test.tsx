/**
 * A blank AI Chat: it says what Reframe is, offers a grounding exercise, and
 * its header is only Exit and Get help.
 */
import React from 'react';
import {Text} from 'react-native';
import ReactTestRenderer, {ReactTestInstance} from 'react-test-renderer';

import ChatEntryScreen from '../src/screens/ChatEntryScreen';
import {createEntry} from '../src/api/entries';

jest.mock('../src/api/entries', () => ({
  ...jest.requireActual('../src/api/entries'),
  createEntry: jest.fn(),
}));

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
