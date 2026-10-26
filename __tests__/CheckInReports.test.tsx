/**
 * The reports (all four journals): yesterday's on top, then the finished
 * weeks, months and days; each downloads as a PDF and says where it went.
 */
import React from 'react';
import {Text} from 'react-native';
import ReactTestRenderer, {ReactTestInstance} from 'react-test-renderer';

import CheckInReportsScreen from '../src/screens/CheckInReportsScreen';
import {CheckInReports, downloadCheckInReport, getCheckInReports} from '../src/api/insights';

jest.mock('../src/api/insights', () => ({
  ...jest.requireActual('../src/api/insights'),
  getCheckInReports: jest.fn(),
  downloadCheckInReport: jest.fn(async (kind: string, start: string) => `mind-doc-${kind}-${start}.pdf`),
}));
jest.mock('../src/api/crisis', () => ({
  ...jest.requireActual('../src/api/crisis'),
  getCrisisResources: jest.fn(() => new Promise(() => {})),
}));

const flatten = (c: any): string =>
  Array.isArray(c) ? c.map(flatten).join('') : c == null || c === false ? '' : String(c);
const allText = (root: ReactTestInstance) => root.findAllByType(Text).map(t => flatten(t.props.children)).join(' ');
const button = (root: ReactTestInstance, label: string) =>
  root.findAll(n => typeof n.props.onPress === 'function' && n.props.accessibilityLabel === label)[0];

const day = (start: string, title: string, n: number) =>
  ({kind: 'daily' as const, start, end: start, title, entries: n});

async function render(reports: CheckInReports) {
  (getCheckInReports as jest.Mock).mockResolvedValue(reports);
  let tree!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(<CheckInReportsScreen onBack={jest.fn()} />);
  });
  return tree.root;
}

beforeEach(() => jest.clearAllMocks());

test("yesterday's report leads, and each finished report downloads", async () => {
  const yesterday = day('2026-10-23', 'Friday 23 October 2026', 2);
  const root = await render({
    latest_daily: yesterday,
    daily: [yesterday, day('2026-10-22', 'Thursday 22 October 2026', 3)],
    weekly: [{kind: 'weekly', start: '2026-10-12', end: '2026-10-18', title: '12–18 October 2026', entries: 15}],
    monthly: [],
  });
  const text = allText(root);
  expect(text).toContain('YESTERDAY');
  expect(text).toContain('Friday 23 October 2026');
  expect(text).toContain('12–18 October 2026');
  expect(text).toContain('2 entries');
  expect(text).toContain('The first one comes on the 1st');
  // Yesterday is not listed twice.
  expect(root.findAll(n => n.props.accessibilityLabel === 'Download the report for Friday 23 October 2026'))
    .toHaveLength(0);

  await ReactTestRenderer.act(async () => button(root, "Download yesterday's report").props.onPress());
  expect(downloadCheckInReport).toHaveBeenCalledWith('daily', '2026-10-23');
  expect(allText(root)).toContain('Saved to your Downloads as mind-doc-daily-2026-10-23.pdf.');

  await ReactTestRenderer.act(async () =>
    button(root, 'Download the report for 12–18 October 2026').props.onPress());
  expect(downloadCheckInReport).toHaveBeenLastCalledWith('weekly', '2026-10-12');
});

test('a yesterday with nothing written says so, with nothing to download', async () => {
  const root = await render({latest_daily: day('2026-10-23', 'Friday 23 October 2026', 0), daily: [], weekly: [], monthly: []});
  expect(allText(root)).toContain('Nothing was written that day, so there is no report.');
  expect(button(root, "Download yesterday's report")).toBeUndefined();
});
