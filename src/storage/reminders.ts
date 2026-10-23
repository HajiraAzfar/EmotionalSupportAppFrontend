import {PermissionsAndroid, Platform} from 'react-native';

import NativeReminders from '../specs/NativeMindDocReminders';

// Phase E of the plan: one gentle local reminder a day. No server, no push
// token, and the notification never shows anything written in the app.

// Only Android has the native side; elsewhere the setting is not offered.
export const remindersAvailable = Platform.OS === 'android' && NativeReminders != null;

// Minutes after midnight, or null when no reminder is set.
export async function getReminder(): Promise<number | null> {
  if (!NativeReminders) {
    return null;
  }
  const minutes = await NativeReminders.scheduledAt();
  return minutes >= 0 ? minutes : null;
}

export type SetResult = 'set' | 'denied';

// Android 13 and later ask before an app may notify. A "no" leaves nothing set.
export async function setReminder(minutesOfDay: number): Promise<SetResult> {
  if (!NativeReminders) {
    return 'denied';
  }
  if (Platform.OS === 'android' && Number(Platform.Version) >= 33) {
    const answer = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
    if (answer !== PermissionsAndroid.RESULTS.GRANTED) {
      return 'denied';
    }
  }
  await NativeReminders.schedule(minutesOfDay);
  return 'set';
}

export async function clearReminder() {
  await NativeReminders?.cancel();
}

export function formatTime(minutesOfDay: number) {
  const date = new Date(2000, 0, 1, Math.floor(minutesOfDay / 60), minutesOfDay % 60);
  return date.toLocaleTimeString(undefined, {hour: 'numeric', minute: '2-digit'});
}
