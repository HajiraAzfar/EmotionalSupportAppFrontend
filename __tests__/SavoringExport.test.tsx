/**
 * The export's consent: her written notes stay out unless she turns them on,
 * and the file is called what it is: self-reported, not a diagnosis.
 */
import React from 'react';
import {Switch, Text} from 'react-native';
import ReactTestRenderer, {ReactTestInstance} from 'react-test-renderer';

import ExportScreen from '../src/savoring/screens/ExportScreen';
import {exportCsv} from '../src/savoring/api';

jest.mock('../src/savoring/api', () => ({
  ...jest.requireActual('../src/savoring/api'),
  exportCsv: jest.fn(async () => 'mind-doc-savoring.csv'),
}));
jest.mock('../src/api/crisis', () => ({
  ...jest.requireActual('../src/api/crisis'),
  getCrisisResources: jest.fn(() => new Promise(() => {})),
}));

const flatten = (c: any): string =>
  Array.isArray(c) ? c.map(flatten).join('') : c == null || c === false ? '' : String(c);
const text = (root: ReactTestInstance) => root.findAllByType(Text).map(t => flatten(t.props.children)).join(' ');
const button = (root: ReactTestInstance) =>
  root.findAll(n => typeof n.props.onPress === 'function' && text(n) === 'Export CSV')[0];

test('notes are off by default, and on only when she turns them on', async () => {
  let tree!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(<ExportScreen onBack={jest.fn()} />);
  });
  const root = tree.root;
  expect(text(root)).toContain('Self-reported data, not a diagnosis.');
  expect(root.findByType(Switch).props.value).toBe(false);
  await ReactTestRenderer.act(async () => button(root).props.onPress());
  expect((exportCsv as jest.Mock).mock.calls[0][2]).toBe(false);
  expect(text(root)).toContain('Saved to your Downloads as mind-doc-savoring.csv.');

  await ReactTestRenderer.act(async () => root.findByType(Switch).props.onValueChange(true));
  await ReactTestRenderer.act(async () => button(root).props.onPress());
  expect((exportCsv as jest.Mock).mock.calls[1][2]).toBe(true);
});
