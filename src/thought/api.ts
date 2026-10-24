import {apiRequest} from '../api/client';
import {CrisisEvent, phoneClock} from '../api/entries';
import {Heatmap} from '../savoring/api';
import {getAccessToken} from '../storage/tokens';

export type RecordMode = 'quick' | 'full';

export interface Named {
  id: string;
  name: string;
}

export interface EmotionRating {
  feeling: string;
  before: number | null;
  after: number | null;
}

// What a record holds; a draft may hold any part of it.
export interface RecordContent {
  situation: string | null;
  situation_tags: string[];
  emotions: EmotionRating[];
  automatic_thought: string | null;
  second_thought: string | null;
  belief_before: number | null;
  belief_after: number | null;
  thinking_traps: string[];
  evidence_for: string | null;
  evidence_against: string | null;
  balanced_thought: string | null;
  balanced_belief: number | null;
  next_step: string | null;
}

export interface ThoughtRecord {
  id: string;
  client_id: string | null;
  status: 'in_progress' | 'completed';
  mode: RecordMode;
  name: string | null;
  local_date: string;
  created_at: string;
  edited_at: string | null;
  editable_freely: boolean;
  is_favorite: boolean;
  source_entry_id: string | null;
  situation: string | null;
  situation_tags: Named[];
  emotions: (Named & {before: number | null; after: number | null})[];
  automatic_thought: string | null;
  second_thought: string | null;
  belief_before: number | null;
  belief_after: number | null;
  belief_drop: number | null;
  emotion_drop: number | null;
  thinking_traps: Named[];
  evidence_for: string | null;
  evidence_against: string | null;
  balanced_thought: string | null;
  balanced_belief: number | null;
  next_step: string | null;
}

export interface Pattern {
  tag: string;
  trap: string;
  records: number;
}

export interface ThoughtHome {
  drafts: ThoughtRecord[];
  recent: ThoughtRecord[];
  total_completed: number;
  today_completed: number;
  gentle: boolean;
  pattern: Pattern | null;
  asks_evidence_for: boolean;
  situation_required: boolean;
}

export interface Saved {
  record: ThoughtRecord;
  crisis_event: CrisisEvent | null;
  gentle: boolean;
  pattern: Pattern | null;
}

export interface ThoughtReport {
  from: string;
  to: string;
  summary: {
    completed: number;
    started: number;
    completion_rate: number | null;
    with_belief: number;
    avg_belief_drop: number | null;
    with_emotions: number;
    avg_emotion_drop: number | null;
    with_balanced_belief: number;
    balanced_belief_avg: number | null;
    linked_high_checkins: number;
  };
  traps: {name: string; count: number}[];
  tags: {name: string; count: number}[];
  reframes: ThoughtRecord[];
  pattern: Pattern | null;
  insights: string[] | null;
  locked: {needed: number; text: string} | null;
}

async function authed(path: string, method = 'GET', body?: unknown) {
  const token = await getAccessToken();
  return apiRequest(path, {method, body, token: token ?? undefined});
}

const tz = () => phoneClock().tz_offset;

// A draft step (complete=false), the finished record, or a later change, by the app's own id.
export function saveRecord(
  clientId: string,
  content: RecordContent,
  options: {mode: RecordMode; complete: boolean; sourceEntryId?: string | null},
): Promise<Saved> {
  return authed(`/thought/records/${clientId}`, 'PUT', {
    ...content,
    mode: options.mode,
    complete: options.complete,
    source_entry_id: options.sourceEntryId ?? null,
    ...phoneClock(),
  });
}

export function editRecord(id: string, content: RecordContent): Promise<Saved> {
  return authed(`/thought/entries/${id}?tz_offset=${tz()}`, 'PUT', content);
}

export function getHome(): Promise<ThoughtHome> {
  return authed(`/thought/home?tz_offset=${tz()}`);
}

export async function getPrefill(sourceEntryId: string): Promise<string[]> {
  return (await authed(`/thought/prefill?source_entry_id=${sourceEntryId}`)).feelings;
}

export function getRecord(id: string): Promise<ThoughtRecord> {
  return authed(`/thought/entries/${id}?tz_offset=${tz()}`);
}

export async function listRecords(): Promise<ThoughtRecord[]> {
  return (await authed(`/thought/entries?tz_offset=${tz()}`)).entries;
}

export function setFavorite(id: string, isFavorite: boolean): Promise<ThoughtRecord> {
  return authed(`/thought/entries/${id}/favorite?tz_offset=${tz()}`, 'PUT', {is_favorite: isFavorite});
}

export async function askQuestion(id: string, side: 'for' | 'against'): Promise<string | null> {
  return (await authed(`/thought/entries/${id}/question`, 'POST', {side})).question;
}

export async function suggestTraps(id: string): Promise<string[] | null> {
  return (await authed(`/thought/entries/${id}/traps`, 'POST', {})).suggestions;
}

export function deleteRecord(id: string) {
  return authed(`/entries/${id}`, 'DELETE');
}

export function getHeatmap(from: string, to: string): Promise<Heatmap> {
  return authed(`/thought/heatmap?from=${from}&to=${to}&tz_offset=${tz()}`);
}

export function getReport(from: string, to: string): Promise<ThoughtReport> {
  return authed(`/reports/thought?from=${from}&to=${to}&tz_offset=${tz()}`);
}

// A described record back into what the flow edits.
export function contentOf(r: ThoughtRecord): RecordContent {
  return {
    situation: r.situation,
    situation_tags: r.situation_tags.map(t => t.id),
    emotions: r.emotions.map(e => ({feeling: e.id, before: e.before, after: e.after})),
    automatic_thought: r.automatic_thought,
    second_thought: r.second_thought,
    belief_before: r.belief_before,
    belief_after: r.belief_after,
    thinking_traps: r.thinking_traps.map(t => t.id),
    evidence_for: r.evidence_for,
    evidence_against: r.evidence_against,
    balanced_thought: r.balanced_thought,
    balanced_belief: r.balanced_belief,
    next_step: r.next_step,
  };
}

export const EMPTY: RecordContent = {
  situation: null,
  situation_tags: [],
  emotions: [],
  automatic_thought: null,
  second_thought: null,
  belief_before: null,
  belief_after: null,
  thinking_traps: [],
  evidence_for: null,
  evidence_against: null,
  balanced_thought: null,
  balanced_belief: null,
  next_step: null,
};
