import {apiRequest} from './client';
import {JournalType} from './entries';
import {getAccessToken} from '../storage/tokens';

// FR-INS-001: one period applies to every view at once.
export type Period = '7d' | '30d' | '3m' | 'all';

export const PERIODS: {value: Period; label: string}[] = [
  {value: '7d', label: '7 days'},
  {value: '30d', label: '30 days'},
  {value: '3m', label: '3 months'},
  {value: 'all', label: 'All'},
];

// FR-INS-002: 30 days at the start of each session.
export const DEFAULT_PERIOD: Period = '30d';

export interface MoodPoint {
  date: string;
  value: number;
  entry_id: string;
}

// FR-INS-009: the same shape, plus the journal it came from — check-in and
// thought records both record how strong the feeling was.
export interface IntensityPoint extends MoodPoint {
  journal_type: JournalType;
}

// A plotted series with the ends of its scale, so no chart hardcodes them.
export interface Series<P extends MoodPoint> {
  points: P[];
  needed: number;
  min: number;
  max: number;
}

export interface CountRow {
  id: string;
  name: string;
  count: number;
  // FR-INS-011: only present when the previous period had enough entries.
  change?: number;
}

export interface ExposureCycle {
  entry_id: string;
  cycle: number;
  completed_at: string;
  before: number | null;
  during: number | null;
  after: number | null;
}

export interface ExposureGroup {
  feared_outcome: string;
  cycles: ExposureCycle[];
  // FR-INS-014: false while only one cycle is complete.
  enough: boolean;
}

// Module 4 / FR-INS-015: days in a row, counted in her timezone over her whole
// history — not just inside the period she is looking at.
export interface Streak {
  current: number;
  longest: number;
  today: boolean;
  week_start: string;
  days_this_week: number;
  weekly_goal: number | null;
  // Entries, not days: everything she has ever finished, and this month's share.
  total_entries: number;
  entries_this_month: number;
}

// FR-INS-015: a day she completed an entry on, with the mood it carried.
export interface CalendarDay {
  date: string;
  mood: number | null;
  entries: number;
}

// The weekly average of a scale: day-to-day mood is noise, a week is a trend.
export interface TrendPoint {
  week_start: string;
  value: number;
  entries: number;
}

export interface MoodTrend {
  points: TrendPoint[];
  min: number;
  max: number;
  needed: number;
}

export interface DistributionRow {
  value: number;
  label: string;
  count: number;
}

// How often each item came up, week by week — at most three of them.
export interface ItemTrend {
  weeks: string[];
  series: {id: string; name: string; counts: number[]}[];
  needed: number;
}

export interface WritingTime {
  part: string;
  label: string;
  count: number;
}

// FR-INS-019: a point is a position between 0 and 1, never a score. The client
// is given nothing it could print beside the dot.
export interface QuestionnairePoint {
  date: string;
  position: number;
}

export interface QuestionnaireState {
  due: boolean;
  next_due: string | null;
  trend: {points: QuestionnairePoint[]; needed: number};
}

export interface QuestionnaireSpec {
  version: string;
  title: string;
  intro: string;
  scale: {value: number; label: string}[];
  items: {id: string; text: string}[];
}

export interface Insights {
  period: Period;
  from: string | null;
  to: string;
  completed_entries: number;
  min_points: number;
  mood: Series<MoodPoint>;
  feeling_intensity: Series<IntensityPoint>;
  triggers: CountRow[];
  feelings: CountRow[];
  thinking_traps: CountRow[];
  exposure: ExposureGroup[];
  calendar: {days: CalendarDay[]};
  streak: Streak;
  mood_trend: MoodTrend;
  mood_distribution: DistributionRow[];
  trap_trend: ItemTrend;
  trigger_trend: ItemTrend;
  writing_times: WritingTime[];
  trend_min_weeks: number;
  questionnaire: QuestionnaireState;
  journal_types: {journal_type: JournalType; count: number}[];
}

// FR-INS-002: the period she picked is kept for the rest of the session, and
// starts again at the default when the app is next opened.
let sessionPeriod: Period = DEFAULT_PERIOD;

export function rememberedPeriod(): Period {
  return sessionPeriod;
}

export function rememberPeriod(period: Period) {
  sessionPeriod = period;
}

export async function getInsights(period: Period): Promise<Insights> {
  const token = await getAccessToken();
  // Minutes east of UTC, so the backend can group entries by her calendar day:
  // getTimezoneOffset() counts the other way round, hence the minus.
  const tzOffset = -new Date().getTimezoneOffset();
  return apiRequest(`/insights?period=${period}&tz_offset=${tzOffset}`, {
    token: token ?? undefined,
  });
}
export async function getQuestionnaire(): Promise<QuestionnaireSpec> {
  const token = await getAccessToken();
  return apiRequest('/insights/questionnaire', {token: token ?? undefined});
}

export async function submitQuestionnaire(answers: Record<string, number>) {
  const token = await getAccessToken();
  return apiRequest('/insights/questionnaire', {
    method: 'POST',
    body: {answers},
    token: token ?? undefined,
  });
}

// FR-INS-017: declining is an answer too — the next offer waits just as long.
export async function declineQuestionnaire() {
  const token = await getAccessToken();
  return apiRequest('/insights/questionnaire/decline', {
    method: 'POST',
    body: {},
    token: token ?? undefined,
  });
}
