/**
 * The Saving Journal's capture: quick (what happened, mood before, good
 * feelings, save), deeper (a pause, then the after step), every step after
 * the first skippable, a check-in's good feelings ticked, a full day said
 * kindly, and a moment kept on the phone when there is no connection.
 */
import React from 'react';
import {Text, TextInput} from 'react-native';
import ReactTestRenderer, {ReactTestInstance} from 'react-test-renderer';

import CaptureFlow from '../src/savoring/screens/CaptureFlow';
import {getPrefill, localDay, saveMoment} from '../src/savoring/api';
import {loadPending} from '../src/savoring/storage';
import {ApiError, NetworkError} from '../src/api/client';
import {getLibrary} from '../src/api/libraries';

jest.mock('../src/savoring/api', () => ({
  ...jest.requireActual('../src/savoring/api'),
  saveMoment: jest.fn(),
  getPrefill: jest.fn(async () => []),
  setFavorite: jest.fn(),
  editMoment: jest.fn(),
}));
jest.mock('../src/api/libraries', () => ({
  ...jest.requireActual('../src/api/libraries'),
  getLibrary: jest.fn(),
}));
jest.mock('../src/api/crisis', () => ({
  ...jest.requireActual('../src/api/crisis'),
  getCrisisResources: jest.fn(() => new Promise(() => {})),
}));
jest.mock('../src/specs/NativeMindDocReminders', () => ({
  __esModule: true,
  default: {markDone: jest.fn(async () => {})},
}));

const flatten = (c: any): string =>
  Array.isArray(c) ? c.map(flatten).join('') : c == null || c === false ? '' : String(c);
const text = (root: ReactTestInstance) => root.findAllByType(Text).map(t => flatten(t.props.children)).join(' ');
const byLabel = (root: ReactTestInstance, label: string) =>
  root.findAll(n => typeof n.props.onPress === 'function' && n.props.accessibilityLabel === label)[0];
const byText = (root: ReactTestInstance, label: string) =>
  root.findAll(n => typeof n.props.onPress === 'function' && text(n) === label)[0];
const press = async (node: ReactTestInstance) => ReactTestRenderer.act(async () => node.props.onPress());

const LIBRARIES: Record<string, any> = {
  feelings: {categories: [
    {id: 'happy', name: 'Happy', valence: 'positive', items: [{id: 'grateful', name: 'Grateful'}]},
    {id: 'calm', name: 'Calm', valence: 'positive', items: [{id: 'peaceful', name: 'Peaceful'}]},
    {id: 'sad', name: 'Sad', valence: 'negative', items: [{id: 'tired', name: 'Tired'}]},
  ]},
  savoring_categories: {categories: [{id: 'm', name: '', items: [{id: 'meal', name: 'A meal'}]}]},
  savoring_techniques: {categories: [{id: 't', name: '', items: [{id: 'senses', name: 'Noticed the senses'}]}]},
};

const saved = (over = {}) => ({
  entry: {id: 'm1', type: 'moment', mode: 'quick', local_date: localDay(), created_at: '', event_date: null,
    is_favorite: false, source_entry_id: null, what_happened: 'Chai', categories: [], people: [], places: [],
    mood_before: 4, mood_after: 6, mood_lift: 2, emotions: [], sensory_note: null, techniques: [], why_good: null,
    souvenir_line: null, expected_rating: null, actual_rating: null, follow_up_due: false, ...over},
  crisis_event: null,
  day: {date: localDay(), count: 1, cap: 3, at_cap: false, message: null},
});

async function render(props: Partial<React.ComponentProps<typeof CaptureFlow>> = {}) {
  let tree!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(
      <CaptureFlow initialType="moment" mode="quick" onClose={jest.fn()} onDone={jest.fn()} onAnother={jest.fn()} {...props} />,
    );
  });
  return tree.root;
}

async function write(root: ReactTestInstance, value: string) {
  await ReactTestRenderer.act(async () => root.findAllByType(TextInput)[0].props.onChangeText(value));
}

beforeEach(() => {
  jest.clearAllMocks();
  (getLibrary as jest.Mock).mockImplementation(async (name: string) => LIBRARIES[name]);
});

test('a quick moment: what happened, the mood before, good feelings, save', async () => {
  (saveMoment as jest.Mock).mockResolvedValue(saved());
  const root = await render();
  expect(text(root)).toContain('What happened?');
  // Nothing can go on until she says what happened.
  expect(byText(root, 'Next').props.disabled).toBe(true);
  await write(root, 'Chai on the roof');
  await press(byText(root, 'Next'));

  expect(text(root)).toContain('Just before this, how were you feeling?');
  await press(byLabel(root, 'Mood before: 4 out of 10'));
  await press(byText(root, 'Next'));

  // Only the good feelings are offered.
  expect(text(root)).toContain('Grateful');
  expect(text(root)).not.toContain('Tired');
  await press(byLabel(root, 'Grateful'));
  await press(byLabel(root, 'How strong Grateful is: 7 out of 10'));
  await press(byText(root, 'Save'));

  const sent = (saveMoment as jest.Mock).mock.calls[0][0];
  expect(sent).toMatchObject({what_happened: 'Chai on the roof', mood_before: 4, emotions: {grateful: 7},
    mode: 'quick', type: 'moment', local_date: localDay(), mood_after: null});
  expect(text(root)).toContain('Kept.');
  expect(text(root)).toContain('4 → 6');
});

test('every step after the first can be skipped, and a skipped rating is not sent', async () => {
  (saveMoment as jest.Mock).mockResolvedValue(saved({mood_before: null, mood_after: null}));
  const root = await render();
  await write(root, 'Sunlight');
  await press(byText(root, 'Next'));
  await press(byLabel(root, 'Mood before: 3 out of 10'));
  await press(byText(root, 'Skip'));
  await press(byText(root, 'Skip'));
  expect((saveMoment as jest.Mock).mock.calls[0][0]).toMatchObject({mood_before: null, emotions: {}});
});

test('a deeper moment pauses to savor, then asks what she did and what made it good', async () => {
  (saveMoment as jest.Mock).mockResolvedValue(saved({mode: 'full'}));
  const root = await render({mode: 'full'});
  await write(root, 'Eid lunch');
  await press(byText(root, 'Next'));
  await press(byText(root, 'Skip'));
  await press(byText(root, 'Skip'));
  expect(text(root)).toContain('Stay with it for a moment');
  await press(byText(root, 'Skip the pause'));
  expect(text(root)).toContain('Did you do any of these?');
  await press(byLabel(root, 'Noticed the senses'));
  await press(byText(root, 'Save'));
  expect((saveMoment as jest.Mock).mock.calls[0][0]).toMatchObject({mode: 'full', techniques: ['senses'], sensory_note: null});
});

test("opened from a check-in, its good feelings start ticked", async () => {
  (getPrefill as jest.Mock).mockResolvedValue(['peaceful']);
  const root = await render({sourceEntryId: 'c1'});
  await write(root, 'A walk');
  await press(byText(root, 'Next'));
  await press(byText(root, 'Next'));
  expect(byLabel(root, 'Peaceful').props.accessibilityState.checked).toBe(true);
});

test('a full day is said kindly, never as an error', async () => {
  (saveMoment as jest.Mock).mockRejectedValue(
    new ApiError("You've captured 3 good moments today. Come back tomorrow for more.", 409, 'daily_cap'),
  );
  const root = await render();
  await write(root, 'One more');
  await press(byText(root, 'Next'));
  await press(byText(root, 'Skip'));
  await press(byText(root, 'Save'));
  expect(text(root)).toContain("You've captured 3 good moments today. Come back tomorrow for more.");
  expect(text(root)).not.toContain("Couldn't");
});

test('with no connection, the moment is kept on the phone to add later', async () => {
  (saveMoment as jest.Mock).mockRejectedValue(new NetworkError());
  const root = await render();
  await write(root, 'Rain on the window');
  await press(byText(root, 'Next'));
  await press(byText(root, 'Skip'));
  await press(byText(root, 'Save'));
  expect(text(root)).toContain("Saved on this phone. It will be added when you're back online.");
  const pending = await loadPending();
  expect(pending.map(p => p.moment.what_happened)).toEqual(['Rain on the window']);
});
