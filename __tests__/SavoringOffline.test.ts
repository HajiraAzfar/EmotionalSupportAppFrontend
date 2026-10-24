/**
 * Moments kept offline: sent when there is a connection, once each; a moment
 * the server refuses on sync (the day full, or now too old) waits for her
 * choice, and moving it to today or letting it go is hers.
 */
import {ApiError, NetworkError} from '../src/api/client';
import {NewMoment, localDay, saveMoment} from '../src/savoring/api';
import {letGo, loadPending, moveToToday, queueMoment, syncPending} from '../src/savoring/storage';

jest.mock('../src/savoring/api', () => ({
  ...jest.requireActual('../src/savoring/api'),
  saveMoment: jest.fn(),
}));

const moment = (id: string, local_date = localDay(-1)): NewMoment => ({
  client_id: id, mode: 'quick', local_date, source_entry_id: null, type: 'anticipate', what_happened: id,
  categories: [], people: [], places: [], mood_before: null, emotions: {}, sensory_note: null, mood_after: null,
  techniques: [], why_good: null, souvenir_line: null, expected_rating: null, event_date: local_date,
});

beforeEach(async () => {
  jest.clearAllMocks();
  for (const p of await loadPending()) {
    await letGo(p.moment.client_id);
  }
});

test('waiting moments are sent once; a refused one keeps its reason', async () => {
  await queueMoment(moment('a'));
  await queueMoment(moment('a'));
  await queueMoment(moment('b'));
  (saveMoment as jest.Mock)
    .mockResolvedValueOnce({})
    .mockRejectedValueOnce(new ApiError('That day already has three.', 409, 'daily_cap'));
  const {added, pending} = await syncPending();
  expect(added).toBe(1);
  expect(saveMoment).toHaveBeenCalledTimes(2);
  expect(pending).toEqual([expect.objectContaining({conflict: {code: 'daily_cap', message: 'That day already has three.'}})]);

  // Moving it to today clears the refusal, and its awaited day is not left before it.
  await moveToToday('b');
  const [moved] = await loadPending();
  expect(moved.conflict).toBeUndefined();
  expect(moved.moment.local_date).toBe(localDay());
  expect(moved.moment.event_date).toBe(localDay());
  await letGo('b');
  expect(await loadPending()).toEqual([]);
});

test('a lost connection stops the sync and keeps everything', async () => {
  await queueMoment(moment('c'));
  await queueMoment(moment('d'));
  (saveMoment as jest.Mock).mockRejectedValue(new NetworkError());
  const {added, pending} = await syncPending();
  expect(added).toBe(0);
  expect(saveMoment).toHaveBeenCalledTimes(1);
  expect(pending.map(p => p.moment.client_id)).toEqual(['c', 'd']);
});
