/**
 * Home: the mood card that starts a check-in, the week stated as a count (never
 * a streak), and the quick-access tiles and where they lead.
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
const byText = (root: ReactTestInstance, text: string) =>
  root.findAll(
    n => typeof n.props.onPress === 'function' && n.findAllByType(Text).some(t => flatten(t.props.children) === text),
  )[0];

async function renderHome(daysThisWeek: number, name: string | null = null) {
  (listRecentDrafts as jest.Mock).mockResolvedValue([]);
  (getInsights as jest.Mock).mockResolvedValue({
    streak: {days_this_week: daysThisWeek},
    calendar: {days: [{date: '2026-11-14', mood: 4, entries: 1}]},
  });
  const props = {
    name,
    onSignedOut: jest.fn(),
    onStartJournal: jest.fn(),
    onResumeDraft: jest.fn(),
    onCheckInMood: jest.fn(),
    onOpenWeekly: jest.fn(),
    onOpenProfile: jest.fn(),
    onOpenLibrary: jest.fn(),
    onOpenCalm: jest.fn(),
    onOpenChat: jest.fn(),
  };
  let root!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    root = ReactTestRenderer.create(<HomeScreen {...props} />);
  });
  return {root: root.root, props};
}

test('a face on the mood card starts a check-in with that mood', async () => {
  const {root, props} = await renderHome(3);
  expect(allText(root)).toContain('How are you feeling today?');
  await ReactTestRenderer.act(async () => byLabel(root, 'Check in: Good').props.onPress());
  expect(props.onCheckInMood).toHaveBeenCalledWith(4);
  await ReactTestRenderer.act(async () => byText(root, 'Check-ins').props.onPress());
  expect(props.onStartJournal).toHaveBeenCalledWith('check_in');
});

test('shows the week as a count, and the tiles lead where they say', async () => {
  const {root, props} = await renderHome(3);
  const text = allText(root);
  for (const title of ['Saving Journal', 'Thought Journal', 'Exposure Journal', 'AI Chat']) {
    expect(text).toContain(title);
  }
  expect(text).toContain('3 of 7 days with an entry');
  expect(text.join(' ')).not.toMatch(/streak|🔥/i);
  expect(text).toContain('Get help');

  await ReactTestRenderer.act(async () =>
    byLabel(root, 'Your week in reflection. 3 of 7 days with an entry. Opens the report.').props.onPress(),
  );
  expect(props.onOpenWeekly).toHaveBeenCalled();
  await ReactTestRenderer.act(async () => byLabel(root, 'Saving Journal').props.onPress());
  expect(props.onStartJournal).toHaveBeenCalledWith('savouring');
  await ReactTestRenderer.act(async () => byLabel(root, 'Ground yourself').props.onPress());
  expect(props.onOpenCalm).toHaveBeenCalledWith('groundYourself');
  await ReactTestRenderer.act(async () => byLabel(root, 'Calm').props.onPress());
  expect(props.onOpenCalm).toHaveBeenLastCalledWith();
  await ReactTestRenderer.act(async () => byLabel(root, 'AI Chat').props.onPress());
  expect(props.onOpenChat).toHaveBeenCalled();
  await ReactTestRenderer.act(async () => byLabel(root, 'Profile and settings').props.onPress());
  expect(props.onOpenProfile).toHaveBeenCalled();
  await ReactTestRenderer.act(async () => byLabel(root, 'Library').props.onPress());
  expect(props.onOpenLibrary).toHaveBeenCalled();
});

test('greets by the name given, and without one when there is none', async () => {
  const named = await renderHome(1, 'hajira');
  expect(allText(named.root).join(' ')).toMatch(/Good (morning|afternoon|evening), Hajira/);
  const unnamed = await renderHome(1);
  expect(allText(unnamed.root).join(' ')).not.toContain(',  ');
  expect(allText(unnamed.root).join(' ')).toMatch(/Good (morning|afternoon|evening)/);
});

test('an empty week reads gently, not as a failure, and still shows seven days', async () => {
  const {root} = await renderHome(0);
  expect(allText(root)).toContain('A fresh week');
  expect(allText(root)).toContain('Whenever you are ready.');
  const bars = root.find(n => n.props.testID === 'week-bars' && typeof n.type === 'string');
  expect(bars.children).toHaveLength(7);
});
