import {Dirs, FileSystem} from 'react-native-file-access';

import {apiRequest, apiUrl, NetworkError} from '../api/client';
import {CrisisEvent, phoneClock} from '../api/entries';
import {Heatmap, localDay} from '../savoring/api';
import {getAccessToken} from '../storage/tokens';

export type ExposureStatus = 'draft' | 'planned' | 'completed' | 'partial' | 'skipped';
export type ExposureMode = 'quick' | 'full';

export interface Named {
  id: string;
  name: string;
}

export interface LadderStep {
  id: string;
  description: string;
  expected_suds: number;
  sort_order: number;
  archived: boolean;
  attempts: number;
  completed: number;
  last_peak: number | null;
  suggested_start: boolean;
}

export interface Ladder {
  id: string;
  fear_name: string;
  archived: boolean;
  tags: Named[];
  steps: LadderStep[];
}

export interface Reading {
  minute: number;
  suds: number;
}

// What an exposure holds; a draft may hold any part of it.
export interface ExposureContent {
  ladder_item_id: string | null;
  feared_outcome: string | null;
  predicted_likelihood: number | null;
  predicted_severity: number | null;
  predicted_anxiety: number | null;
  safety_behaviors_planned: string[];
  learning_goal: string | null;
  scheduled_for: string | null;
  feelings: string[];
  anxiety_peak: number | null;
  anxiety_end: number | null;
  anxiety_readings: Reading[];
  what_happened: string | null;
  outcome_occurred: 'yes' | 'partly' | 'no' | null;
  safety_behaviors_used: string[];
  learning: string | null;
  next_step: 'repeat' | 'move_up' | 'variation' | null;
}

export interface ExposureRecord {
  id: string;
  client_id: string | null;
  status: ExposureStatus;
  mode: ExposureMode;
  legacy: boolean;
  planned_activity: string | null;
  local_date: string;
  created_at: string;
  edited_at: string | null;
  is_favorite: boolean;
  step: {id: string; description: string; expected_suds: number; archived: boolean; fear_name: string} | null;
  ladder_item_id: string | null;
  feared_outcome: string | null;
  predicted_likelihood: number | null;
  predicted_severity: number | null;
  predicted_anxiety: number | null;
  safety_behaviors_planned: Named[];
  safety_behaviors_used: Named[];
  learning_goal: string | null;
  scheduled_for: string | null;
  feelings: Named[];
  anxiety_readings: Reading[];
  what_happened: string | null;
  outcome_occurred: 'yes' | 'partly' | 'no' | null;
  learning: string | null;
  next_step: 'repeat' | 'move_up' | 'variation' | null;
  // 0-100 for every record (older ones were rated 0-10).
  before: number | null;
  peak: number | null;
  end: number | null;
}

export interface ExposureHome {
  drafts: ExposureRecord[];
  planned: ExposureRecord[];
  recent: ExposureRecord[];
  total_done: number;
  today_done: number;
  gentle: boolean;
  pattern: {step: string; fear: string; attempts: number} | null;
  suggest_professional: boolean;
  ladders: Ladder[];
}

export interface Saved {
  record: ExposureRecord;
  crisis_event: CrisisEvent | null;
  gentle: boolean;
  pattern: ExposureHome['pattern'];
}

export interface ExposureReport {
  summary: {
    done: number;
    completed: number;
    partial: number;
    skipped: number;
    planned: number;
    ladders_in_progress: number;
    steps_attempted: number;
    steps_completed: number;
    highest_step: {description: string; expected_suds: number} | null;
  };
  weeks: {week_start: string; exposures: number}[];
  prediction: {entries: number; predicted_likelihood: number | null; outcome_rate: number | null};
  anxiety: {predicted: number | null; peak: number | null; end: number | null};
  repeats: {step: string; attempts: number; first_peak: number; last_peak: number}[];
  safety_planned: {name: string; count: number}[];
  safety_used: {name: string; count: number}[];
  pattern: ExposureHome['pattern'];
  insights: string[] | null;
  locked: {needed: number; text: string} | null;
}

async function authed(path: string, method = 'GET', body?: unknown) {
  const token = await getAccessToken();
  return apiRequest(path, {method, body, token: token ?? undefined});
}

const tz = () => phoneClock().tz_offset;

export async function getLadders(): Promise<Ladder[]> {
  return (await authed(`/exposure/ladders?tz_offset=${tz()}`)).ladders;
}

export function createLadder(body: {fear_name: string; tags: string[]; steps: {description: string; expected_suds: number}[]}):
  Promise<{ladder_id: string; ladders: Ladder[]; crisis_event: CrisisEvent | null}> {
  return authed('/exposure/ladders', 'POST', body);
}

export function updateLadder(id: string, body: {fear_name?: string; tags?: string[]}):
  Promise<{ladders: Ladder[]; crisis_event: CrisisEvent | null}> {
  return authed(`/exposure/ladders/${id}`, 'PUT', body);
}

export function addStep(id: string, step: {description: string; expected_suds: number}):
  Promise<{ladders: Ladder[]; crisis_event: CrisisEvent | null}> {
  return authed(`/exposure/ladders/${id}/steps`, 'POST', step);
}

export function updateStep(id: string, stepId: string, step: {description?: string; expected_suds?: number}):
  Promise<{ladders: Ladder[]; crisis_event: CrisisEvent | null}> {
  return authed(`/exposure/ladders/${id}/steps/${stepId}`, 'PUT', step);
}

export function removeStep(id: string, stepId: string): Promise<{outcome: 'archived' | 'deleted'; ladders: Ladder[]}> {
  return authed(`/exposure/ladders/${id}/steps/${stepId}`, 'DELETE');
}

export function reorderSteps(id: string, itemIds: string[]): Promise<{ladders: Ladder[]}> {
  return authed(`/exposure/ladders/${id}/order`, 'PUT', {item_ids: itemIds});
}

export function getHome(): Promise<ExposureHome> {
  return authed(`/exposure/home?tz_offset=${tz()}`);
}

export async function getPrefill(sourceEntryId: string): Promise<string[]> {
  return (await authed(`/exposure/prefill?source_entry_id=${sourceEntryId}`)).feelings;
}

// A draft step, the plan, how it went, or a correction, by the app's own id.
export function saveExposure(
  clientId: string,
  content: ExposureContent,
  options: {mode: ExposureMode; status: ExposureStatus; sourceEntryId?: string | null},
): Promise<Saved> {
  return authed(`/exposure/records/${clientId}`, 'PUT', {
    ...content,
    mode: options.mode,
    status: options.status,
    source_entry_id: options.sourceEntryId ?? null,
    ...phoneClock(),
  });
}

export function getRecord(id: string): Promise<ExposureRecord> {
  return authed(`/exposure/entries/${id}?tz_offset=${tz()}`);
}

export async function listRecords(): Promise<ExposureRecord[]> {
  return (await authed(`/exposure/entries?tz_offset=${tz()}`)).entries;
}

export function setFavorite(id: string, isFavorite: boolean): Promise<ExposureRecord> {
  return authed(`/exposure/entries/${id}/favorite?tz_offset=${tz()}`, 'PUT', {is_favorite: isFavorite});
}

export function deleteRecord(id: string) {
  return authed(`/entries/${id}`, 'DELETE');
}

export function getHeatmap(from: string, to: string): Promise<Heatmap> {
  return authed(`/exposure/heatmap?from=${from}&to=${to}&tz_offset=${tz()}`);
}

export function getReport(from: string, to: string): Promise<ExposureReport> {
  return authed(`/reports/exposure?from=${from}&to=${to}&tz_offset=${tz()}`);
}

// Her ladders, steps and exposures as a JSON file in Downloads. Returns the file's name.
export async function exportData(includeNotes: boolean): Promise<string> {
  await authed('/auth/me');
  const token = await getAccessToken();
  const name = `mind-doc-exposure-${localDay()}.json`;
  const path = `${Dirs.CacheDir}/${name}`;
  let result;
  try {
    result = await FileSystem.fetch(apiUrl(`/exposure/export.json?include_notes=${includeNotes}&tz_offset=${tz()}`), {
      path,
      headers: {Authorization: `Bearer ${token}`},
    });
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

// A described record back into what the flow edits.
export function contentOf(r: ExposureRecord): ExposureContent {
  return {
    ladder_item_id: r.ladder_item_id,
    feared_outcome: r.feared_outcome,
    predicted_likelihood: r.predicted_likelihood,
    predicted_severity: r.predicted_severity,
    predicted_anxiety: r.predicted_anxiety,
    safety_behaviors_planned: r.safety_behaviors_planned.map(s => s.id),
    learning_goal: r.learning_goal,
    scheduled_for: r.scheduled_for,
    feelings: r.feelings.map(f => f.id),
    // A record from before keeps its 0-10 distress too; corrected, it is saved on 0-100.
    anxiety_peak: r.peak,
    anxiety_end: r.end,
    anxiety_readings: r.anxiety_readings,
    what_happened: r.what_happened,
    outcome_occurred: r.outcome_occurred,
    safety_behaviors_used: r.safety_behaviors_used.map(s => s.id),
    learning: r.learning,
    next_step: r.next_step,
  };
}

export const EMPTY: ExposureContent = {
  ladder_item_id: null,
  feared_outcome: null,
  predicted_likelihood: null,
  predicted_severity: null,
  predicted_anxiety: null,
  safety_behaviors_planned: [],
  learning_goal: null,
  scheduled_for: null,
  feelings: [],
  anxiety_peak: null,
  anxiety_end: null,
  anxiety_readings: [],
  what_happened: null,
  outcome_occurred: null,
  safety_behaviors_used: [],
  learning: null,
  next_step: null,
};
