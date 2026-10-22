import {apiRequest} from './client';
import {JournalType} from './entries';
import {CountRow, ExposureGroup} from './insights';
import {getAccessToken} from '../storage/tokens';

// "Your Week in Reflection". Everything here is counted by the backend from
// her saved entries; the only generated text is `narrative`, and it is allowed
// to be null — the report reads perfectly well without it.

export interface WeekPoint {
  date: string;
  value: number;
  entry_id: string;
  journal_type: JournalType;
}

export interface Overview {
  entries: number;
  check_in: number;
  thought: number;
  savouring: number;
  // Planned and attempted are different things and are never added together.
  exposure_planned: number;
  exposure_attempted: number;
  learnings: number;
}

export interface HelpedCard {
  kind: 'significance' | 'revised_thought' | 'learning';
  title: string;
  blurb: string;
  text: string;
  entry_id: string;
  journal_type: JournalType;
  date: string;
}

export interface Win {
  id: string;
  title: string;
  count: number;
  detail: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  // What earns it, in her words — shown on a locked badge too.
  how: string;
  category: string;
  icon: string;
  earned: boolean;
  earned_at: string | null;
  entry_ids: string[];
}

export interface SavouredMoment {
  entry_id: string;
  date: string;
  event: string;
  significance: string;
  feelings: string[];
}

export interface WeeklyReport {
  week_start: string;
  week_end: string;
  is_current: boolean;
  overview: Overview;
  mood: {points: WeekPoint[]; min: number; max: number};
  feeling_intensity: {points: WeekPoint[]; min: number; max: number};
  feelings: CountRow[];
  triggers: CountRow[];
  thinking_traps: CountRow[];
  journals: {
    check_in: {entries: number; triggers: CountRow[]};
    savouring: {entries: number; moments: SavouredMoment[]};
    thought: {entries: number; patterns: CountRow[]; balanced_thoughts: number};
    exposure: {planned: number; attempted: number; cycles: ExposureGroup[]};
  };
  helped: HelpedCard[];
  wins: Win[];
  badges: {new: Badge[]; earned_total: number; total: number};
  reflection: string | null;
  carried_in: string | null;
  // Null when the week was too thin to describe, or the model would not answer.
  narrative: string | null;
}

export interface WeekSummary {
  week_start: string;
  week_end: string;
  entries: number;
  is_current: boolean;
}

// Minutes east of UTC, so a week runs Monday to Sunday where she is rather
// than where the server is. getTimezoneOffset() counts the other way round.
const tz = () => -new Date().getTimezoneOffset();

export async function getWeek(weekStart?: string): Promise<WeeklyReport> {
  const token = await getAccessToken();
  const week = weekStart ? `&week_start=${weekStart}` : '';
  return apiRequest(`/insights/weekly?tz_offset=${tz()}${week}`, {token: token ?? undefined});
}

export async function getWeeks(): Promise<{weeks: WeekSummary[]}> {
  const token = await getAccessToken();
  return apiRequest(`/insights/weekly/history?tz_offset=${tz()}`, {token: token ?? undefined});
}

export async function saveReflection(weekStart: string, text: string) {
  const token = await getAccessToken();
  return apiRequest(`/insights/weekly/reflection?tz_offset=${tz()}`, {
    method: 'POST',
    body: {week_start: weekStart, text},
    token: token ?? undefined,
  });
}

export async function getBadges(): Promise<{badges: Badge[]}> {
  const token = await getAccessToken();
  return apiRequest('/insights/badges', {token: token ?? undefined});
}

// "11–17 October", or "28 September – 4 October" when the week spans two.
export function weekLabel(startISO: string, endISO: string): string {
  const start = new Date(`${startISO}T00:00:00`);
  const end = new Date(`${endISO}T00:00:00`);
  const day = (d: Date) => d.getDate();
  const month = (d: Date) => d.toLocaleDateString(undefined, {month: 'long'});
  return start.getMonth() === end.getMonth()
    ? `${day(start)}–${day(end)} ${month(end)}`
    : `${day(start)} ${month(start)} – ${day(end)} ${month(end)}`;
}
