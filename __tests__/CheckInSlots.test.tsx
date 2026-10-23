/**
 * The check-in list: the slot open now leads; today's and yesterday's others
 * say plainly where they stand, a missed one can be added, a finished one read,
 * and nothing is worded as a failure.
 */
import React from 'react';
import {Text} from 'react-native';
import ReactTestRenderer, {ReactTestInstance} from 'react-test-renderer';

import CheckInSlotsScreen from '../src/screens/CheckInSlotsScreen';
import {getCheckInSlots, SlotBoard} from '../src/api/entries';

jest.mock('../src/api/entries', () => ({
  ...jest.requireActual('../src/api/entries'),
  getCheckInSlots: jest.fn(),
}));
jest.mock('../src/specs/NativeMindDocReminders', () => ({
  __esModule: true,
  default: {markDone: jest.fn(async () => {})},
}));
const mockReminders = jest.requireMock('../src/specs/NativeMindDocReminders').default;

const flatten = (c: any): string =>
  Array.isArray(c) ? c.map(flatten).join('') : c == null || c === false ? '' : String(c);
const allText = (root: ReactTestInstance) => root.findAllByType(Text).map(t => flatten(t.props.children));
const row = (root: ReactTestInstance, label: string) =>
  root.findAll(n => typeof n.props.onPress === 'function' && String(n.props.accessibilityLabel).startsWith(label))[0];

const board: SlotBoard = {
  current: {slot: 'afternoon', local_date: '2026-10-22'},
  slots: [
    {local_date: '2026-10-21', slot: 'morning', state: 'done', entry_id: 'y1', opens_at: '2026-10-21T05:00', closes_at: '2026-10-21T12:00'},
    {local_date: '2026-10-21', slot: 'afternoon', state: 'missed', entry_id: null, opens_at: '2026-10-21T12:00', closes_at: '2026-10-21T18:00'},
    {local_date: '2026-10-21', slot: 'evening', state: 'missed', entry_id: null, opens_at: '2026-10-21T18:00', closes_at: '2026-10-22T05:00'},
    {local_date: '2026-10-22', slot: 'morning', state: 'missed', entry_id: null, opens_at: '2026-10-22T05:00', closes_at: '2026-10-22T12:00'},
    {local_date: '2026-10-22', slot: 'afternoon', state: 'open', entry_id: null, opens_at: '2026-10-22T12:00', closes_at: '2026-10-22T18:00'},
    {local_date: '2026-10-22', slot: 'evening', state: 'upcoming', entry_id: null, opens_at: '2026-10-22T18:00', closes_at: '2026-10-23T05:00'},
  ],
};

test('leads with the open slot, lets a missed one be added, and opens a finished one', async () => {
  (getCheckInSlots as jest.Mock).mockResolvedValue(board);
  const onStart = jest.fn();
  const onOpenEntry = jest.fn();
  let tree!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(<CheckInSlotsScreen onBack={jest.fn()} onStart={onStart} onOpenEntry={onOpenEntry} />);
  });
  const root = tree.root;
  const text = allText(root).join(' ');
  expect(text).toContain('Afternoon check-in');
  expect(text).toContain('Today');
  expect(text).toContain('Yesterday');
  expect(text).not.toMatch(/missed|failed|streak|behind/i);
  // Only the finished slot quiets its reminder.
  expect(mockReminders.markDone).toHaveBeenCalledTimes(1);
  expect(mockReminders.markDone).toHaveBeenCalledWith('morning', '2026-10-21');

  const start = root.findAll(n => typeof n.props.onPress === 'function' && allText(n).includes('Start'))[0];
  await ReactTestRenderer.act(async () => start.props.onPress());
  expect(onStart).toHaveBeenLastCalledWith('afternoon', '2026-10-22');

  // Today's list comes first, so the first Morning row is today's.
  await ReactTestRenderer.act(async () => row(root, 'Morning: Not filled in').props.onPress());
  expect(onStart).toHaveBeenLastCalledWith('morning', '2026-10-22');
  await ReactTestRenderer.act(async () => row(root, 'Morning: Done').props.onPress());
  expect(onOpenEntry).toHaveBeenCalledWith('y1');
});
