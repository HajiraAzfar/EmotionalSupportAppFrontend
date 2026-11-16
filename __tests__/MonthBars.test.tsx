/**
 * Mood, month by month: each month's average, in order, with its mood named.
 */
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

import {monthlyMood} from '../src/api/insights';
import MonthBars from '../src/components/insights/MonthBars';

const LABELS = ['Very low', 'Low', 'Okay', 'Good', 'Very good'];
const point = ([date, value]: [string, number], i: number) => ({date, value, entry_id: `e${i}`});

test('averages each month, oldest first, and skips months with no mood', () => {
  const points = (
    [
      ['2026-11-02', 4],
      ['2026-09-30', 1],
      ['2026-11-14', 5],
      ['2026-09-01', 2],
    ] as [string, number][]
  ).map(point);
  expect(monthlyMood(points)).toEqual([
    {month: '2026-09', value: 1.5, entries: 2},
    {month: '2026-11', value: 4.5, entries: 2},
  ]);
});

test('each bar names its mood and count', async () => {
  const months = monthlyMood(
    (
      [
        ['2026-10-03', 2],
        ['2026-11-02', 4],
        ['2026-11-03', 4],
      ] as [string, number][]
    ).map(point),
  );
  let root!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    root = ReactTestRenderer.create(<MonthBars months={months} min={1} max={5} labels={LABELS} />);
  });
  const label = (id: string) => root.root.findByProps({testID: id}).props.accessibilityLabel as string;
  expect(label('month-2026-10')).toMatch(/: Low, 1 check-in$/);
  expect(label('month-2026-11')).toMatch(/: Good, 2 check-ins$/);
});
