/**
 * The mood graph's dates: entries bunch up in time, and their dates must not
 * be drawn on top of each other.
 */
import React from 'react';
import {Text} from 'react-native';
import ReactTestRenderer from 'react-test-renderer';

import MoodAreaChart from '../src/components/insights/MoodAreaChart';

const point = (date: string, i: number) => ({date, value: 3, entry_id: `e${i}`});

test('dates sit at least 52 apart and never repeat a day', async () => {
  // A month with a cluster: two entries on 2 Nov, then 3 Nov and 4 Nov.
  const dates = ['2026-10-16', '2026-10-22', '2026-10-29', '2026-11-02', '2026-11-02', '2026-11-03', '2026-11-04', '2026-11-14'];
  let root!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    root = ReactTestRenderer.create(
      <MoodAreaChart points={dates.map(point)} min={1} max={5} labels={['1', '2', '3', '4', '5']} />,
    );
  });
  await ReactTestRenderer.act(async () => {
    root.root.findAll(n => typeof n.props.onLayout === 'function')[0].props.onLayout({nativeEvent: {layout: {width: 320}}});
  });

  // The date labels are the absolutely placed texts along the bottom.
  const ticks = root.root
    .findAllByType(Text)
    .filter(t => t.props.style?.position === 'absolute')
    .map(t => ({left: t.props.style.left as number, text: String(t.props.children)}));

  expect(ticks.length).toBeGreaterThan(2);
  expect(new Set(ticks.map(t => t.text)).size).toBe(ticks.length);
  for (let i = 1; i < ticks.length; i++) {
    expect(ticks[i].left - ticks[i - 1].left).toBeGreaterThanOrEqual(52);
  }
});
