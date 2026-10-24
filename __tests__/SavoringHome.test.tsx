/**
 * The Saving Journal's home: a full day says so kindly (and offers yesterday),
 * an awaited moment asks how it really was, a run of very low moments brings a
 * gentle word, and the streak resets without blame.
 */
import React from 'react';
import {Text} from 'react-native';
import ReactTestRenderer, {ReactTestInstance} from 'react-test-renderer';

import SavoringHome from '../src/savoring/screens/SavoringHome';
import {getHeatmap, getHome, setActual} from '../src/savoring/api';

jest.mock('../src/savoring/api', () => ({
  ...jest.requireActual('../src/savoring/api'),
  getHome: jest.fn(),
  getHeatmap: jest.fn(),
  setActual: jest.fn(async () => ({})),
}));
jest.mock('../src/api/crisis', () => ({
  ...jest.requireActual('../src/api/crisis'),
  getCrisisResources: jest.fn(() => new Promise(() => {})),
}));

const flatten = (c: any): string =>
  Array.isArray(c) ? c.map(flatten).join('') : c == null || c === false ? '' : String(c);
const text = (root: ReactTestInstance) => root.findAllByType(Text).map(t => flatten(t.props.children)).join(' ');
const pressable = (root: ReactTestInstance, label: string) =>
  root.findAll(n => typeof n.props.onPress === 'function' && (n.props.accessibilityLabel === label || text(n) === label))[0];

const day = (date: string, count: number) => ({date, count, cap: 3, at_cap: count >= 3, message: null});
const awaited = {
  id: 'a1', type: 'anticipate', mode: 'quick', local_date: '2026-10-20', created_at: '2026-10-20T10:00',
  event_date: '2026-10-24', is_favorite: false, source_entry_id: null, what_happened: "Eid at Nani's",
  categories: [], people: [], places: [], mood_before: null, mood_after: null, mood_lift: null, emotions: [],
  sensory_note: null, techniques: [], why_good: null, souvenir_line: null, expected_rating: 8, actual_rating: null,
  follow_up_due: true,
};

async function render(home: object, streak = {current: 0, best: 4, total_days: 9, today_counted: false}) {
  (getHome as jest.Mock).mockResolvedValue({
    today: day('2026-10-24', 0), yesterday: day('2026-10-23', 0), total_entries: 9, recent: [], follow_ups: [],
    memory_lane: [], support: null, ...home,
  });
  (getHeatmap as jest.Mock).mockResolvedValue({days: [{date: '2026-10-24', level: 0, points: 0, grace_day: false}], streak});
  const onStart = jest.fn();
  let tree!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(
      <SavoringHome onBack={jest.fn()} onStart={onStart} onOpenMoment={jest.fn()} onOpenHistory={jest.fn()}
        onOpenInsights={jest.fn()} onOpenSettings={jest.fn()} onOpenYear={jest.fn()} />,
    );
  });
  return {root: tree.root, onStart};
}

beforeEach(() => jest.clearAllMocks());

test('a full day says so kindly, and yesterday still has room', async () => {
  const {root, onStart} = await render({today: day('2026-10-24', 3)});
  expect(text(root)).toContain("You've captured 3 good moments today. Come back tomorrow for more.");
  expect(pressable(root, 'Savor a moment')).toBeUndefined();
  await ReactTestRenderer.act(async () => pressable(root, 'Add one for yesterday').props.onPress());
  expect(onStart).toHaveBeenCalledWith('moment', expect.anything(), 9);
});

test('an awaited moment asks how it really was', async () => {
  const {root} = await render({follow_ups: [awaited]});
  expect(text(root)).toContain('How was it really?');
  expect(text(root)).toContain('You expected 8/10.');
  await ReactTestRenderer.act(async () => pressable(root, 'How was it really?: 9 out of 10').props.onPress());
  await ReactTestRenderer.act(async () => pressable(root, 'Save').props.onPress());
  expect(setActual).toHaveBeenCalledWith('a1', 9);
});

test('low moments bring a gentle word, and a reset streak is a new start', async () => {
  const {root} = await render({support: 'reach_out'});
  const words = text(root);
  expect(words).toContain('Talking to someone could help');
  expect(words).toContain("New start today. You've had 9 good-moment days so far.");
  expect(words).not.toMatch(/should|failed|lost your streak/i);
});
