/**
 * Home: the four journal cards under the brand brief's names, the quick tools
 * and where they lead, and the week stated as a count, never as a streak.
 */
import React from 'react';
import {Text} from 'react-native';
import ReactTestRenderer, {ReactTestInstance} from 'react-test-renderer';

import HomeScreen from '../src/screens/HomeScreen';
import {listRecentDrafts} from '../src/api/entries';
import {getInsights} from '../src/api/insights';

jest.mock('../src/storage/tokens', () => ({getAccessToken: async () => 'token'}));
jest.mock('../src/api/entries', () => ({
  ...jest.requireActual('../src/api/entries'),
  listRecentDrafts: jest.fn(),
}));
jest.mock('../src/api/insights', () => ({
  ...jest.requireActual('../src/api/insights'),
  getInsights: jest.fn(),
}));

const flatten = (c: any): string =>
  Array.isArray(c) ? c.map(flatten).join('') : c == null || c === false ? '' : String(c);
const allText = (root: ReactTestInstance) => root.findAllByType(Text).map(t => flatten(t.props.children));
const byLabel = (root: ReactTestInstance, label: string) =>
  root.findAll(n => n.props.accessibilityLabel === label && typeof n.props.onPress === 'function')[0];

async function renderHome(daysThisWeek: number, name: string | null = null) {
  (listRecentDrafts as jest.Mock).mockResolvedValue([]);
  (getInsights as jest.Mock).mockResolvedValue({streak: {days_this_week: daysThisWeek}});
  const props = {
    name,
    onSignedOut: jest.fn(),
    onStartJournal: jest.fn(),
    onResumeDraft: jest.fn(),
    onOpenInsights: jest.fn(),
    onOpenEntries: jest.fn(),
    onOpenSettings: jest.fn(),
    onOpenCalm: jest.fn(),
    onOpenChat: jest.fn(),
  };
  let root!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    root = ReactTestRenderer.create(<HomeScreen {...props} />);
  });
  return {root: root.root, props};
}

test('shows the journals, the quick tools and the week as a count', async () => {
  const {root, props} = await renderHome(3);
  const text = allText(root);
  for (const title of ['Check-in', 'Saving Journal', 'Thought Journal', 'Exposure Journal']) {
    expect(text).toContain(title);
  }
  expect(text).toContain('3 of 7 days with an entry');
  expect(text.join(' ')).not.toMatch(/streak|🔥/i);
  expect(text).toContain('Get help');

  await ReactTestRenderer.act(async () => byLabel(root, 'Saving Journal').props.onPress());
  expect(props.onStartJournal).toHaveBeenCalledWith('savouring');
  await ReactTestRenderer.act(async () => byLabel(root, 'Ground yourself').props.onPress());
  expect(props.onOpenCalm).toHaveBeenCalledWith('groundYourself');
  await ReactTestRenderer.act(async () => byLabel(root, 'Grounding').props.onPress());
  expect(props.onOpenCalm).toHaveBeenLastCalledWith();
  await ReactTestRenderer.act(async () => byLabel(root, 'AI Chat').props.onPress());
  expect(props.onOpenChat).toHaveBeenCalled();
});

test('greets by the name given, and without one when there is none', async () => {
  const named = await renderHome(1, 'Hajira');
  expect(allText(named.root).join(' ')).toMatch(/Good (morning|afternoon|evening), Hajira/);
  const unnamed = await renderHome(1);
  expect(allText(unnamed.root).join(' ')).not.toContain(',  ');
  expect(allText(unnamed.root).join(' ')).toMatch(/Good (morning|afternoon|evening)/);
});

test('an empty week reads gently, not as a failure', async () => {
  const {root} = await renderHome(0);
  expect(allText(root)).toContain('A fresh week');
  expect(allText(root)).toContain('Whenever you are ready.');
});
