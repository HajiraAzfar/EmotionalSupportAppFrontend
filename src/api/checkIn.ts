import AsyncStorage from '@react-native-async-storage/async-storage';

import {apiRequest} from './client';
import {CrisisEvent, newClientId} from './entries';
import {getAccessToken} from '../storage/tokens';

export interface Label {
  en: string;
  ur: string;
  roman: string;
}

export interface FactorItem {
  id: string;
  label: string;
  label_ur: string;
  label_roman: string;
}

export interface FactorCategory extends FactorItem {
  items: FactorItem[];
}

export interface Factors {
  prompt: Label;
  note_prompt: Label;
  categories: FactorCategory[];
}

export interface CheckInResult {
  entry_id: string;
  closing: string;
  card: 'soft' | 'prominent' | null;
  crisis_event: CrisisEvent | null;
  suggest: 'chat' | null;
}

export type Step = 'mood' | 'factors' | 'note' | 'sending' | 'done';

// Everything she has given so far. Kept on the phone until the server has it,
// so a lost connection or an app restart loses nothing.
export interface CheckInDraft {
  client_id: string;
  step: Step;
  mood: number | null;
  factors: string[];
  note: string;
  sync: 'pending' | 'synced';
}

const DRAFT_KEY = 'check_in_draft';

async function authed(path: string, method = 'GET', body?: unknown) {
  const token = await getAccessToken();
  return apiRequest(path, {method, body, token: token ?? undefined});
}

export function getFactors(mood: number): Promise<Factors> {
  return authed(`/entries/check_in/factors?mood=${mood}`);
}

export function submitCheckIn(draft: CheckInDraft): Promise<CheckInResult> {
  return authed('/entries/check_in', 'POST', {
    client_id: draft.client_id,
    mood: draft.mood,
    factors: draft.factors,
    note: draft.note,
  });
}

export function newDraft(mood: number | null = null): CheckInDraft {
  return {client_id: newClientId(), step: mood ? 'factors' : 'mood', mood, factors: [], note: '', sync: 'pending'};
}

export async function loadDraft(): Promise<CheckInDraft | null> {
  try {
    const raw = await AsyncStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveDraft(draft: CheckInDraft): Promise<void> {
  return AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(draft)).catch(() => {});
}

export function clearDraft(): Promise<void> {
  return AsyncStorage.removeItem(DRAFT_KEY).catch(() => {});
}
