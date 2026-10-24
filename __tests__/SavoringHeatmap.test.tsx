/**
 * The heatmap: a column per week from Monday, a shade per level (none is grey,
 * never red), a dotted edge on a grace day, a spoken label on every square, and
 * a tap opens the day. It never shows what was written.
 */
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

import Heatmap, {LAVENDER_LIGHT} from '../src/savoring/components/Heatmap';

const days = [
  // 2026-10-21 is a Wednesday: the first column starts with two empty places.
  {date: '2026-10-21', level: 0 as const, points: 0, grace_day: false},
  {date: '2026-10-22', level: 1 as const, points: 1, grace_day: false},
  {date: '2026-10-23', level: 0 as const, points: 0, grace_day: true},
  {date: '2026-10-24', level: 3 as const, points: 4, grace_day: false},
];

test('shades by level, marks grace days, speaks each day and opens it', async () => {
  const onDayPress = jest.fn();
  let tree!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(<Heatmap days={days} onDayPress={onDayPress} />);
  });
  const cells = tree.root.findAll(n => typeof n.props.onPress === 'function' && n.props.accessibilityRole === 'button');
  expect(cells).toHaveLength(4);
  const style = (i: number) => cells[i].props.style;
  expect(style(0).backgroundColor).toBe(LAVENDER_LIGHT.empty);
  expect(style(1).backgroundColor).toBe(LAVENDER_LIGHT.levels[0]);
  expect(style(3).backgroundColor).toBe(LAVENDER_LIGHT.levels[2]);
  expect(style(2)).toMatchObject({borderStyle: 'dotted', borderWidth: 1.5});
  expect(cells[3].props.accessibilityLabel).toBe('24 Oct: 4 points');
  expect(cells[2].props.accessibilityLabel).toBe('23 Oct: no moments, a rest day');

  await ReactTestRenderer.act(async () => cells[1].props.onPress());
  expect(onDayPress).toHaveBeenCalledWith('2026-10-22');
});
