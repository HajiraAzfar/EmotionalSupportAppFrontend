import {Dirs, FileSystem} from 'react-native-file-access';

import {apiRequest, apiUrl, NetworkError} from '../api/client';
import {CrisisEvent, phoneClock} from '../api/entries';
import {getAccessToken} from '../storage/tokens';

export type MomentType = 'moment' | 'reminisce' | 'anticipate';
export type MomentMode = 'quick' | 'full';

export interface Named {
  id: string;
  name: string;
}

export interface Moment {
  id: string;
  type: MomentType;
  mode: MomentMode;
  local_date: string;
  // Her local time it was saved, "YYYY-MM-DDTHH:MM".
  created_at: string;
  event_date: string | null;
  is_favorite: boolean;
  source_entry_id: string | null;
  what_happened: string | null;
  categories: Named[];
  people: string[];
  places: string[];
  mood_before: number | null;
  mood_after: number | null;
  mood_lift: number | null;
  emotions: (Named & {intensity: number | null})[];
  sensory_note: string | null;
  techniques: Named[];
  why_good: string | null;
  souvenir_line: string | null;
  expected_rating: number | null;
  actual_rating: number | null;
  follow_up_due: boolean;
}

// What she puts down; only what_happened is needed.
export interface MomentContent {
  type: MomentType;
  what_happened: string;
  categories: string[];
  people: string[];
  places: string[];
  mood_before: number | null;
  emotions: Record<string, number | null>;
  sensory_note: string | null;
  mood_after: number | null;
  techniques: string[];
  why_good: string | null;
  souvenir_line: string | null;
  expected_rating: number | null;
  event_date: string | null;
}

export interface NewMoment extends MomentContent {
  client_id: string;
  mode: MomentMode;
  local_date: string;
  source_entry_id: string | null;
}

export interface DayRoom {
  date: string;
  count: number;
  cap: number;
  at_cap: boolean;
  message: string | null;
}

export interface SavoringHome {
  today: DayRoom;
  yesterday: DayRoom;
  total_entries: number;
  recent: Moment[];
  follow_ups: Moment[];
  memory_lane: Moment[];
  support: 'break' | 'reach_out' | null;
}

export interface HeatmapDay {
  date: string;
  points: number;
  level: 0 | 1 | 2 | 3;
  grace_day: boolean;
}

export interface Heatmap {
  days: HeatmapDay[];
  streak: {current: number; best: number; total_days: number; today_counted: boolean};
}

export interface Saved {
  entry: Moment;
  crisis_event: CrisisEvent | null;
  day: DayRoom;
}

export interface Counted {
  name: string;
  count: number;
}

export interface SavoringReport {
  from: string;
  to: string;
  summary: {
    days_with_entries: number;
    entries_total: number;
    avg_per_active_day: number;
    avg_mood_lift: number | null;
    lift_entries: number;
    types: Record<MomentType, number>;
  };
  emotions: Counted[];
  categories: Counted[];
  people: Counted[];
  places: Counted[];
  time_of_day: Record<'morning' | 'afternoon' | 'evening' | 'night', number>;
  techniques: {name: string; uses: number; avg_lift: number}[];
  anticipation: {expected: number; actual: number; entries: number} | null;
  weeks: {week_start: string; savoring_days: number; checkin_mood: number | null}[];
  highlights: Moment[];
  insights: string[] | null;
  locked: {needed: number; text: string} | null;
}

async function authed(path: string, method = 'GET', body?: unknown) {
  const token = await getAccessToken();
  return apiRequest(path, {method, body, token: token ?? undefined});
}

const tz = () => phoneClock().tz_offset;

// The phone's own calendar day, "YYYY-MM-DD", some days from today.
export function localDay(offsetDays = 0, from: Date = new Date()): string {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function getHome(): Promise<SavoringHome> {
  return authed(`/savoring/home?tz_offset=${tz()}`);
}

export async function getPrefill(sourceEntryId: string): Promise<string[]> {
  return (await authed(`/savoring/prefill?source_entry_id=${sourceEntryId}`)).feelings;
}

export function saveMoment(moment: NewMoment): Promise<Saved> {
  return authed('/savoring/entries', 'POST', {...moment, ...phoneClock()});
}

export function editMoment(id: string, content: MomentContent): Promise<{entry: Moment; crisis_event: CrisisEvent | null}> {
  return authed(`/savoring/entries/${id}?tz_offset=${tz()}`, 'PUT', content);
}

export function getMoment(id: string): Promise<Moment> {
  return authed(`/savoring/entries/${id}?tz_offset=${tz()}`);
}

export type MomentFilter = {type?: MomentType; emotion?: string; favorite?: boolean; date?: string};

export async function listMoments(filter: MomentFilter = {}): Promise<Moment[]> {
  const query = [`tz_offset=${tz()}`];
  if (filter.type) {
    query.push(`type=${filter.type}`);
  }
  if (filter.emotion) {
    query.push(`emotion=${encodeURIComponent(filter.emotion)}`);
  }
  if (filter.favorite) {
    query.push('favorite=true');
  }
  if (filter.date) {
    query.push(`date=${filter.date}`);
  }
  return (await authed(`/savoring/entries?${query.join('&')}`)).entries;
}

export function setFavorite(id: string, isFavorite: boolean): Promise<Moment> {
  return authed(`/savoring/entries/${id}/favorite?tz_offset=${tz()}`, 'PUT', {is_favorite: isFavorite});
}

export function setActual(id: string, rating: number): Promise<Moment> {
  return authed(`/savoring/entries/${id}/actual?tz_offset=${tz()}`, 'POST', {actual_rating: rating});
}

export function deleteMoment(id: string) {
  return authed(`/entries/${id}`, 'DELETE');
}

export function getHeatmap(from: string, to: string): Promise<Heatmap> {
  return authed(`/savoring/heatmap?from=${from}&to=${to}&tz_offset=${tz()}`);
}

export function getReport(from: string, to: string): Promise<SavoringReport> {
  return authed(`/reports/savoring?from=${from}&to=${to}&tz_offset=${tz()}`);
}

// Her moments as a CSV in Downloads; her written notes only when she chose them. Returns the file's name.
export async function exportCsv(from: string, to: string, includeNotes: boolean): Promise<string> {
  // A small authorised call first, so an expired token is refreshed before the download.
  await authed('/auth/me');
  const token = await getAccessToken();
  const name = `mind-doc-savoring-${localDay()}.csv`;
  const path = `${Dirs.CacheDir}/${name}`;
  let result;
  try {
    result = await FileSystem.fetch(
      apiUrl(`/savoring/export.csv?from=${from}&to=${to}&include_notes=${includeNotes}&tz_offset=${tz()}`),
      {path, headers: {Authorization: `Bearer ${token}`}},
    );
  } catch {
    throw new NetworkError();
  }
  if (!result.ok) {
    throw new Error("Couldn't make the file just now. Please try again in a moment.");
  }
  await FileSystem.cpExternal(path, name, 'downloads');
  await FileSystem.unlink(path).catch(() => undefined);
  return name;
}
