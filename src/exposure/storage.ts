import AsyncStorage from '@react-native-async-storage/async-storage';

import {NetworkError} from '../api/client';
import {clearOnce, setOnce} from '../storage/reminders';
import {ExposureContent, ExposureMode, ExposureStatus, Ladder, Saved, saveExposure} from './api';

// What the Exposure Journal keeps on the phone: every draft step (so a step
// taken offline is never lost) and records finished offline until the server
// has them; the ladders, to read offline; whether the screening note was seen;
// and the reminders of planned exposures.

const DRAFTS = 'exposure_drafts';
const LADDERS = 'exposure_ladders';
const SCREENED = 'exposure_screened';
const REMINDERS = 'exposure_reminders';
export const DRAFT_DAYS = 7;

export interface LocalDraft {
  clientId: string;
  content: ExposureContent;
  mode: ExposureMode;
  status: ExposureStatus;
  phase: 'plan' | 'review';
  step: number;
  sourceEntryId: string | null;
  // Not yet accepted by the server.
  unsent: boolean;
  updatedAt: number;
}

async function read<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

async function write(key: string, value: unknown) {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

// ---- the screening note, once ----

export async function screened(): Promise<boolean> {
  return read(SCREENED, false);
}

export async function markScreened() {
  await write(SCREENED, true);
}

// ---- ladders, to read offline ----

export async function cachedLadders(): Promise<Ladder[]> {
  return read(LADDERS, []);
}

export async function cacheLadders(ladders: Ladder[]) {
  await write(LADDERS, ladders);
}

// ---- drafts ----

export async function localDrafts(now = Date.now()): Promise<LocalDraft[]> {
  const drafts = await read<Record<string, LocalDraft>>(DRAFTS, {});
  const cutoff = now - DRAFT_DAYS * 86400000;
  const kept = Object.fromEntries(Object.entries(drafts).filter(([, d]) => d.updatedAt >= cutoff));
  if (Object.keys(kept).length !== Object.keys(drafts).length) {
    await write(DRAFTS, kept);
  }
  return Object.values(kept).sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function keepDraft(draft: Omit<LocalDraft, 'updatedAt'>) {
  const drafts = await read<Record<string, LocalDraft>>(DRAFTS, {});
  drafts[draft.clientId] = {...draft, updatedAt: Date.now()};
  await write(DRAFTS, drafts);
}

export async function dropDraft(clientId: string) {
  const drafts = await read<Record<string, LocalDraft>>(DRAFTS, {});
  delete drafts[clientId];
  await write(DRAFTS, drafts);
}

const FINISHED: ExposureStatus[] = ['completed', 'partial', 'skipped'];

// Save the step on the phone, then on the server; offline the phone's copy is
// enough ('kept'). A finished record leaves the phone once the server has it.
export async function saveStep(draft: Omit<LocalDraft, 'updatedAt' | 'unsent'>): Promise<Saved | 'kept'> {
  await keepDraft({...draft, unsent: true});
  try {
    const saved = await saveExposure(draft.clientId, draft.content, {
      mode: draft.mode,
      status: draft.status,
      sourceEntryId: draft.sourceEntryId,
    });
    if (FINISHED.includes(draft.status)) {
      await dropDraft(draft.clientId);
    } else {
      await keepDraft({...draft, unsent: false});
    }
    await syncReminder(draft.clientId, draft.status, draft.content.scheduled_for);
    return saved;
  } catch (e) {
    if (e instanceof NetworkError) {
      await syncReminder(draft.clientId, draft.status, draft.content.scheduled_for);
      return 'kept';
    }
    throw e;
  }
}

// Records kept on the phone go to the server when there is a connection; the
// server checks them again. Stops at the first lost connection.
export async function syncUnsent(): Promise<number> {
  let sent = 0;
  for (const draft of (await localDrafts()).filter(d => d.unsent)) {
    try {
      await saveExposure(draft.clientId, draft.content, {mode: draft.mode, status: draft.status, sourceEntryId: draft.sourceEntryId});
      if (FINISHED.includes(draft.status)) {
        await dropDraft(draft.clientId);
      } else {
        await keepDraft({...draft, unsent: false});
      }
      sent += 1;
    } catch (e) {
      if (e instanceof NetworkError) {
        break;
      }
    }
  }
  return sent;
}

// ---- reminders: only for a planned exposure, at its time ----

// "YYYY-MM-DDTHH:MM" on the phone's clock, as epoch milliseconds.
export function atMillis(local: string): number {
  const [day, time] = local.split('T');
  const [y, m, d] = day.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  return new Date(y, m - 1, d, hh, mm).getTime();
}

export async function remindersOn(): Promise<Record<string, string>> {
  return read(REMINDERS, {});
}

// She chose a reminder for this plan (or turned it off).
export async function setPlanReminder(clientId: string, local: string | null): Promise<boolean> {
  const all = await remindersOn();
  await clearOnce(clientId);
  if (!local || atMillis(local) <= Date.now()) {
    delete all[clientId];
    await write(REMINDERS, all);
    return false;
  }
  const ok = (await setOnce(clientId, atMillis(local))) === 'set';
  if (ok) {
    all[clientId] = local;
  } else {
    delete all[clientId];
  }
  await write(REMINDERS, all);
  return ok;
}

// A reminder fires only for a plan still waiting: once it is done, done in
// part or set aside (or the time changes), the old one goes.
export async function syncReminder(clientId: string, status: ExposureStatus, scheduledFor: string | null) {
  const all = await remindersOn();
  if (!(clientId in all)) {
    return;
  }
  if (status !== 'planned' || !scheduledFor) {
    await setPlanReminder(clientId, null);
  } else if (all[clientId] !== scheduledFor) {
    await setPlanReminder(clientId, scheduledFor);
  }
}

// After the home loads: any reminder whose plan is no longer waiting goes.
export async function reconcileReminders(plannedIds: Set<string>) {
  for (const clientId of Object.keys(await remindersOn())) {
    if (!plannedIds.has(clientId)) {
      await setPlanReminder(clientId, null);
    }
  }
}
