/**
 * The check-in reminders: one per slot, each off by default, on at its
 * default time (08:00 / 14:00 / 21:00), changeable, and off again. The
 * native side is a stand-in here.
 */
import React from 'react';
import {Switch, Text} from 'react-native';
import ReactTestRenderer, {ReactTestInstance} from 'react-test-renderer';

import RemindersScreen from '../src/screens/RemindersScreen';

jest.mock('../src/specs/NativeMindDocReminders', () => ({
  __esModule: true,
  default: {
    schedule: jest.fn(async () => {}),
    cancel: jest.fn(async () => {}),
    scheduledAt: jest.fn(async () => -1),
  },
}));
const mockNative = jest.requireMock('../src/specs/NativeMindDocReminders').default;

const flatten = (c: any): string =>
  Array.isArray(c) ? c.map(flatten).join('') : c == null || c === false ? '' : String(c);
const allText = (root: ReactTestInstance) => root.findAllByType(Text).map(t => flatten(t.props.children));
const toggle = (root: ReactTestInstance, label: string) =>
  root.findAllByType(Switch).find(s => s.props.accessibilityLabel === label)!;

test('each slot turns on at its default time, changes time, and turns off', async () => {
  let tree!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(<RemindersScreen onBack={jest.fn()} />);
  });
  const root = tree.root;
  expect(allText(root).filter(t => t === 'Off')).toHaveLength(3);
  expect(allText(root).join(' ')).toContain('never show anything you wrote');

  await ReactTestRenderer.act(async () => toggle(root, 'Morning check-in reminder').props.onValueChange(true));
  expect(mockNative.schedule).toHaveBeenCalledWith('morning', 8 * 60);
  await ReactTestRenderer.act(async () => toggle(root, 'Evening check-in reminder').props.onValueChange(true));
  expect(mockNative.schedule).toHaveBeenLastCalledWith('evening', 21 * 60);
  expect(allText(root).filter(t => t.startsWith('Every day at'))).toHaveLength(2);

  const earlier = root.findAll(
    n => n.props.accessibilityRole === 'radio' && typeof n.props.onPress === 'function'
      && String(n.props.accessibilityLabel).startsWith('Morning check-in at 7'),
  )[0];
  await ReactTestRenderer.act(async () => earlier.props.onPress());
  expect(mockNative.schedule).toHaveBeenLastCalledWith('morning', 7 * 60);

  await ReactTestRenderer.act(async () => toggle(root, 'Morning check-in reminder').props.onValueChange(false));
  expect(mockNative.cancel).toHaveBeenCalledWith('morning');
  expect(allText(root).filter(t => t === 'Off')).toHaveLength(2);
});
