import type {TurboModule} from 'react-native';
import {TurboModuleRegistry} from 'react-native';

// The check-in reminders, on Android (android/.../reminders): one per slot
// ("morning" | "afternoon" | "evening"). A time is minutes after midnight on
// the phone's own clock; -1 means that slot has no reminder.
export interface Spec extends TurboModule {
  schedule(slot: string, minutesOfDay: number): Promise<void>;
  cancel(slot: string): Promise<void>;
  scheduledAt(slot: string): Promise<number>;
}

// `get`, not `getEnforcing`: on a phone without the module (iOS, tests) the
// reminders simply aren't offered.
export default TurboModuleRegistry.get<Spec>('MindDocReminders');
