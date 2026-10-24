import AsyncStorage from '@react-native-async-storage/async-storage';

import {NetworkError} from '../api/client';
import {RecordContent, RecordMode, Saved, saveRecord} from './api';

// Thought records kept on the phone: every draft step (so a step taken offline
// is never lost) and a record finished offline, until the server has them.

const KEY = 'thought_drafts';
export const DRAFT_DAYS = 7;

export interface LocalDraft {
  clientId: string;
  content: RecordContent;
  mode: RecordMode;
  step: number;
  sourceEntryId: string | null;
  // Finished on the phone but not yet on the server.
  complete: boolean;
  updatedAt: number;
}

async function load(): Promise<Record<string, LocalDraft>> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function store(drafts: Record<string, LocalDraft>) {
  await AsyncStorage.setItem(KEY, JSON.stringify(drafts));
}

// Drafts from the last week, newest first; older ones are let go.
export async function localDrafts(now = Date.now()): Promise<LocalDraft[]> {
  const drafts = await load();
  const cutoff = now - DRAFT_DAYS * 86400000;
  const kept = Object.fromEntries(Object.entries(drafts).filter(([, d]) => d.updatedAt >= cutoff));
  if (Object.keys(kept).length !== Object.keys(drafts).length) {
    await store(kept);
  }
  return Object.values(kept).sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function keepDraft(draft: Omit<LocalDraft, 'updatedAt'>) {
  const drafts = await load();
  drafts[draft.clientId] = {...draft, updatedAt: Date.now()};
  await store(drafts);
}

export async function dropDraft(clientId: string) {
  const drafts = await load();
  delete drafts[clientId];
  await store(drafts);
}

// Save the step (or the finished record) on the phone, then on the server.
// Offline, the phone's copy is enough: 'kept' says so. Anything else the server
// refuses is for the screen to show.
export async function saveStep(draft: Omit<LocalDraft, 'updatedAt'>): Promise<Saved | 'kept'> {
  await keepDraft(draft);
  try {
    const saved = await saveRecord(draft.clientId, draft.content, {
      mode: draft.mode,
      complete: draft.complete,
      sourceEntryId: draft.sourceEntryId,
    });
    if (draft.complete) {
      await dropDraft(draft.clientId);
    }
    return saved;
  } catch (e) {
    if (e instanceof NetworkError) {
      return 'kept';
    }
    throw e;
  }
}

// Records finished offline go to the server when there is a connection; the
// server checks them again. Stops at the first lost connection.
export async function syncFinished(): Promise<number> {
  let sent = 0;
  for (const draft of (await localDrafts()).filter(d => d.complete)) {
    try {
      await saveRecord(draft.clientId, draft.content, {mode: draft.mode, complete: true, sourceEntryId: draft.sourceEntryId});
      await dropDraft(draft.clientId);
      sent += 1;
    } catch (e) {
      if (e instanceof NetworkError) {
        break;
      }
    }
  }
  return sent;
}
