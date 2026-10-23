/**
 * The daily reminder setting: off by default, on at a gentle default time,
 * a few times to pick from, and off again. The native side is a stand-in here.
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

test('turns on at the default time, changes time, and turns off', async () => {
  let tree!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(<RemindersScreen onBack={jest.fn()} />);
  });
  const root = tree.root;
  expect(allText(root)).toContain('Off');
  expect(allText(root).join(' ')).toContain('never shows anything you');

  await ReactTestRenderer.act(async () => root.findByType(Switch).props.onValueChange(true));
  expect(mockNative.schedule).toHaveBeenCalledWith(19 * 60);
  expect(allText(root).join(' ')).toMatch(/Every day at/);

  const morning = root.findAll(
    n => n.props.accessibilityRole === 'radio' && typeof n.props.onPress === 'function'
      && String(n.props.accessibilityLabel).startsWith('Morning'),
  )[0];
  await ReactTestRenderer.act(async () => morning.props.onPress());
  expect(mockNative.schedule).toHaveBeenLastCalledWith(9 * 60);

  await ReactTestRenderer.act(async () => root.findByType(Switch).props.onValueChange(false));
  expect(mockNative.cancel).toHaveBeenCalled();
  expect(allText(root)).toContain('Off');
});
