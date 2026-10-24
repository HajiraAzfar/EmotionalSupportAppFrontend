import AsyncStorage from '@react-native-async-storage/async-storage';

import {ApiError, NetworkError} from '../api/client';
import {NewMoment, saveMoment, Saved, localDay} from './api';

// What stays on the phone for the Saving Journal: how a moment starts, and the
// moments saved while offline, until the server has them.

export type DefaultMode = 'auto' | 'quick' | 'full';
const MODE_KEY = 'savoring_default_mode';
const QUEUE_KEY = 'savoring_pending';

// Quick for her first few moments, then a deeper one is offered.
export const QUICK_FIRST = 3;

export async function getDefaultMode(): Promise<DefaultMode> {
  const value = await AsyncStorage.getItem(MODE_KEY).catch(() => null);
  return value === 'quick' || value === 'full' ? value : 'auto';
}

export async function setDefaultMode(mode: DefaultMode) {
  await AsyncStorage.setItem(MODE_KEY, mode);
}

// A moment the server has not taken yet. `conflict` is set when it refused it
// on sync (the day was full, or the moment became too old): she decides then.
export interface Pending {
  moment: NewMoment;
  conflict?: {code: 'daily_cap' | 'outside_window'; message: string};
}

export async function loadPending(): Promise<Pending[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function savePending(items: Pending[]) {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(items));
}

export async function queueMoment(moment: NewMoment) {
  const items = await loadPending();
  if (!items.some(p => p.moment.client_id === moment.client_id)) {
    await savePending([...items, {moment}]);
  }
}

// Save now, or keep it on the phone when there is no connection. Any other
// refusal (the day is full) is for the screen to show.
export async function saveOrQueue(moment: NewMoment): Promise<Saved | 'queued'> {
  try {
    return await saveMoment(moment);
  } catch (e) {
    if (e instanceof NetworkError) {
      await queueMoment(moment);
      return 'queued';
    }
    throw e;
  }
}

// Send what is waiting, oldest first. The server checks the cap and the day
// again; a refusal is kept with its reason for her to resolve. A retry is safe:
// each moment carries its client id, so one the server already has is not
// saved twice. Stops at the first lost connection.
export async function syncPending(): Promise<{added: number; pending: Pending[]}> {
  const items = await loadPending();
  const left: Pending[] = [];
  let added = 0;
  let offline = false;
  for (const item of items) {
    if (offline || item.conflict) {
      left.push(item);
      continue;
    }
    try {
      await saveMoment(item.moment);
      added += 1;
    } catch (e) {
      if (e instanceof ApiError && (e.code === 'daily_cap' || e.code === 'outside_window')) {
        left.push({...item, conflict: {code: e.code, message: e.message}});
      } else {
        // Offline again, or something to try later: keep it as it is.
        offline = e instanceof NetworkError;
        left.push(item);
      }
    }
  }
  await savePending(left);
  return {added, pending: left};
}

// Her choice for a moment the server refused: move it to today, or let it go.
export async function moveToToday(clientId: string) {
  const items = await loadPending();
  const today = localDay();
  await savePending(
    items.map(p => {
      if (p.moment.client_id !== clientId) {
        return p;
      }
      // A day looked forward to cannot come before the moment's own day.
      const event = p.moment.event_date && p.moment.event_date < today ? today : p.moment.event_date;
      return {moment: {...p.moment, local_date: today, event_date: event}};
    }),
  );
}

export async function letGo(clientId: string) {
  const items = await loadPending();
  await savePending(items.filter(p => p.moment.client_id !== clientId));
}
