/**
 * The daily check-in screen. Native rendering (the chip-tap crash) can only be
 * confirmed on a device; this covers everything the JavaScript side decides.
 */
import React from 'react';
import {Text, TextInput} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ReactTestRenderer, {ReactTestInstance} from 'react-test-renderer';

import CheckInScreen from '../src/screens/CheckInScreen';
import {Factors, getFactors, submitCheckIn} from '../src/api/checkIn';
import {NetworkError} from '../src/api/client';

jest.mock('../src/api/checkIn', () => ({
  ...jest.requireActual('../src/api/checkIn'),
  getFactors: jest.fn(),
  submitCheckIn: jest.fn(),
}));

// The same file the server serves from, so every real chip is tapped.
const config = require('../../emotional-support-backend/app/content/checkin_factors.json');
const pick = (x: any) => ({id: x.id, label: x.label, label_ur: x.label_ur, label_roman: x.label_roman});
function factorsFor(mood: number): Factors {
  const band = mood >= 4 ? 'high' : mood === 3 ? 'mid' : 'low';
  return {
    prompt: config.prompts[band],
    note_prompt: config.prompts.note,
    categories: config.categories.map((c: any) => ({
      ...pick(c),
      items: config.items.filter((i: any) => i.category === c.id && i.moods.includes(mood)).map(pick),
    })),
  };
}
const STRESSORS = config.items.filter((i: any) => !i.moods.includes(4) && !i.moods.includes(5)).map((i: any) => i.label);
const SEND_FAILED = "Couldn't send that. Your answer is saved. Tap to try again.";
const LEAKS = /trigger|skipped|\bsoft\b|prominent|debugger|network request failed/i;

const flatten = (c: any): string => (Array.isArray(c) ? c.map(flatten).join('') : c == null || c === false ? '' : String(c));
const textOf = (n: ReactTestInstance) => n.findAllByType(Text).map(t => flatten(t.props.children)).join('');
const allText = (root: ReactTestInstance) => root.findAllByType(Text).map(t => flatten(t.props.children));

const flush = () => ReactTestRenderer.act(async () => {
  await new Promise<void>(r => setTimeout(r, 0));
});

async function open(mood: number) {
  let r: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    r = ReactTestRenderer.create(<CheckInScreen startMood={mood} onExit={jest.fn()} />);
  });
  await flush();
  await flush();
  return r!.root;
}

async function press(root: ReactTestInstance, label: string | RegExp) {
  const node = root.findAll(
    n => typeof n.props.onPress === 'function' && (typeof label === 'string' ? textOf(n) === label : label.test(textOf(n))),
  )[0];
  expect(node).toBeDefined();
  await ReactTestRenderer.act(async () => {
    node.props.onPress();
  });
  await flush();
}

const chipNodes = (root: ReactTestInstance) =>
  root.findAll(n => n.props.accessibilityRole === 'checkbox' && typeof n.props.onPress === 'function');

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.mocked(getFactors).mockImplementation(async (m: number) => factorsFor(m));
  jest.mocked(submitCheckIn).mockReset();
});

test.each([1, 2, 3, 4, 5])('T5: mood %i — every expander and every chip, twice, never throws', async mood => {
  const root = await open(mood);
  while (root.findAll(n => typeof n.props.onPress === 'function' && /^\+\d+ more$/.test(textOf(n))).length) {
    await press(root, /^\+\d+ more$/);
  }
  const labels = [...new Set(chipNodes(root).map(n => n.props.accessibilityLabel as string))];
  expect(labels.length).toBe(factorsFor(mood).categories.reduce((s, c) => s + c.items.length, 0));

  for (const label of labels) {
    const node = chipNodes(root).find(n => n.props.accessibilityLabel === label && !n.props.accessibilityState.checked)!;
    await ReactTestRenderer.act(async () => node.props.onPress());
  }
  expect(allText(root)).toContain(`Continue (${labels.length} selected)`);
  expect(allText(root)).toContain(`Selected (${labels.length})`);

  for (const label of labels) {
    const node = chipNodes(root).find(n => n.props.accessibilityLabel === label && n.props.accessibilityState.checked)!;
    await ReactTestRenderer.act(async () => node.props.onPress());
  }
  expect(allText(root)).toContain('Continue');
  expect(allText(root).join(' ')).not.toMatch(/selected\)/);
});

test('T2: mood 5 shows no stressor chips', async () => {
  const root = await open(5);
  const shown = chipNodes(root).map(n => n.props.accessibilityLabel);
  expect(shown.filter(l => STRESSORS.includes(l))).toEqual([]);
});

test('T7: factors left empty — the note step asks its own question, once', async () => {
  const root = await open(2);
  expect(allText(root)).toContain(config.prompts.low.en);
  await press(root, 'Continue');
  const text = allText(root);
  expect(text).toContain(config.prompts.note.en);
  expect(text).not.toContain(config.prompts.low.en);
  expect(text.join(' ')).not.toMatch(LEAKS);
});

test('T6: network failure on the note step keeps her text, and retry sends it once', async () => {
  const root = await open(3);
  await press(root, 'Continue');
  const input = root.findAllByType(TextInput).find(i => i.props.placeholder === 'Optional')!;
  await ReactTestRenderer.act(async () => input.props.onChangeText('long day at work'));

  jest.mocked(submitCheckIn).mockRejectedValueOnce(new NetworkError());
  await press(root, 'Continue');
  expect(allText(root)).toContain(SEND_FAILED);
  expect(root.findAllByType(TextInput).find(i => i.props.placeholder === 'Optional')!.props.value).toBe('long day at work');
  expect(await AsyncStorage.getItem('check_in_draft')).toContain('long day at work');
  expect(allText(root).join(' ')).not.toMatch(LEAKS);

  jest.mocked(submitCheckIn).mockResolvedValueOnce({
    entry_id: 'e1', closing: 'A long day at work. Rest well tonight.', card: null, crisis_event: null, suggest: null,
  });
  await press(root, SEND_FAILED);
  expect(allText(root)).toContain('A long day at work. Rest well tonight.');
  const [first, second] = jest.mocked(submitCheckIn).mock.calls.map(c => c[0]);
  expect(second.client_id).toBe(first.client_id);
  expect(second.note).toBe('long day at work');
  expect(await AsyncStorage.getItem('check_in_draft')).toBeNull();
});

test('T4/T8: mood 2, everything empty — gentle closing, no mood-tied Get help hint, no leaked labels', async () => {
  jest.mocked(submitCheckIn).mockResolvedValueOnce({
    entry_id: 'e2', closing: "That's a hard day to carry.", card: null, crisis_event: null, suggest: null,
  });
  const root = await open(2);
  await press(root, 'Continue');
  await press(root, 'Continue');
  const text = allText(root);
  expect(text).toContain("That's a hard day to carry.");
  // Target rule 10: Get help stays in the header for everyone; nothing ties it to the mood.
  expect(text.join(' ')).not.toMatch(/if today feels like too much/i);
  expect(text.join(' ')).not.toMatch(LEAKS);
  expect(jest.mocked(submitCheckIn).mock.calls[0][0]).toMatchObject({mood: 2, factors: [], note: ''});
});
