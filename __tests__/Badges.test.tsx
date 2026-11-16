/**
 * Your badges: every badge, earned or not, as a count and never a streak;
 * tapping one says what it is and what earns it.
 */
import React from 'react';
import {Text} from 'react-native';
import ReactTestRenderer, {ReactTestInstance} from 'react-test-renderer';

import BadgesScreen from '../src/screens/BadgesScreen';
import {getBadges} from '../src/api/weekly';

jest.mock('../src/api/weekly', () => ({
  ...jest.requireActual('../src/api/weekly'),
  getBadges: jest.fn(),
}));
jest.mock('../src/api/crisis', () => ({
  ...jest.requireActual('../src/api/crisis'),
  getCrisisResources: jest.fn(() => new Promise(() => {})),
}));

const flatten = (c: any): string =>
  Array.isArray(c) ? c.map(flatten).join('') : c == null || c === false ? '' : String(c);
const allText = (root: ReactTestInstance) => root.findAllByType(Text).map(t => flatten(t.props.children)).join(' ');
const byLabel = (root: ReactTestInstance, label: string) =>
  root.findAll(n => n.props.accessibilityLabel === label && typeof n.props.onPress === 'function')[0];

const badge = (id: string, name: string, earned: boolean) => ({
  id, name, description: `${name} description`, how: `${name} how`, category: 'start', icon: 'Sprout',
  earned, earned_at: earned ? '2026-11-02T10:00:00Z' : null, entry_ids: [],
});

test('counts what is earned, and a tap says what a badge is for', async () => {
  (getBadges as jest.Mock).mockResolvedValue({
    badges: [badge('a', 'First Steps', true), badge('b', 'Moment Keeper', false)],
  });
  let tree!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(<BadgesScreen onBack={jest.fn()} />);
  });
  expect(allText(tree.root)).toContain('1 of 2 so far.');
  expect(allText(tree.root)).not.toMatch(/streak/i);

  await ReactTestRenderer.act(async () => byLabel(tree.root, 'Moment Keeper, not yet earned').props.onPress());
  expect(allText(tree.root)).toContain('Moment Keeper description');
  expect(allText(tree.root)).toContain('How: Moment Keeper how');

  await ReactTestRenderer.act(async () => byLabel(tree.root, 'First Steps, earned').props.onPress());
  expect(allText(tree.root)).toContain('First Steps description');
  // The phone's locale decides the order of day and month.
  expect(allText(tree.root)).toMatch(/Earned (\d+ November|November \d+)\./);
});
