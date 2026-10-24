import {PermissionsAndroid, Platform} from 'react-native';

import NativeReminders from '../specs/NativeMindDocReminders';
import {CheckInSlot} from '../api/entries';

// A gentle local reminder when each check-in opens: morning, afternoon,
// evening, each with its own time and each on or off. No server, no push
// token, and a notification never shows anything written in the app.

export const SLOTS: CheckInSlot[] = ['morning', 'afternoon', 'evening'];

// The Saving Journal's one opt-in reminder sits beside the check-ins' three.
export type ReminderSlot = CheckInSlot | 'savoring';
export const SAVORING_TIMES = [20 * 60, 13 * 60, 17 * 60, 21 * 60 + 30];

// The times offered for each slot, all inside its window; the first is the default.
export const SLOT_TIMES: Record<CheckInSlot, number[]> = {
  morning: [8 * 60, 7 * 60, 9 * 60, 10 * 60],
  afternoon: [14 * 60, 13 * 60, 15 * 60, 16 * 60],
  evening: [21 * 60, 19 * 60, 20 * 60, 22 * 60],
};

// Only Android has the native side; elsewhere the setting is not offered.
export const remindersAvailable = Platform.OS === 'android' && NativeReminders != null;

export type Reminders = Record<CheckInSlot, number | null>;

// Each slot's time in minutes after midnight, or null when it is off.
export async function getReminders(): Promise<Reminders> {
  const out: Reminders = {morning: null, afternoon: null, evening: null};
  if (!NativeReminders) {
    return out;
  }
  for (const slot of SLOTS) {
    const minutes = await NativeReminders.scheduledAt(slot);
    out[slot] = minutes >= 0 ? minutes : null;
  }
  return out;
}

export type SetResult = 'set' | 'denied';

// Android 13 and later ask before an app may notify. A "no" leaves nothing set.
export async function setReminder(slot: ReminderSlot, minutesOfDay: number): Promise<SetResult> {
  if (!NativeReminders) {
    return 'denied';
  }
  if (Platform.OS === 'android' && Number(Platform.Version) >= 33) {
    const answer = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
    if (answer !== PermissionsAndroid.RESULTS.GRANTED) {
      return 'denied';
    }
  }
  await NativeReminders.schedule(slot, minutesOfDay);
  return 'set';
}

export async function clearReminder(slot: ReminderSlot) {
  await NativeReminders?.cancel(slot);
}

// The Saving Journal's reminder time, or null when it is off (the default).
export async function getSavoringReminder(): Promise<number | null> {
  if (!NativeReminders) {
    return null;
  }
  const minutes = await NativeReminders.scheduledAt('savoring');
  return minutes >= 0 ? minutes : null;
}

// A check-in (or a good moment) done for its day: that reminder stays quiet that day.
// A mark that fails only costs one reminder too many, so it never surfaces.
export async function markSlotDone(slot: ReminderSlot, localDate: string) {
  try {
    await NativeReminders?.markDone(slot, localDate);
  } catch {
    // nothing to show her
  }
}

// Every reminder off: deleting the account leaves none behind.
export async function clearAllReminders() {
  for (const slot of [...SLOTS, 'savoring' as const]) {
    await clearReminder(slot);
  }
}

export function formatTime(minutesOfDay: number) {
  const date = new Date(2000, 0, 1, Math.floor(minutesOfDay / 60), minutesOfDay % 60);
  return date.toLocaleTimeString(undefined, {hour: 'numeric', minute: '2-digit'});
}
