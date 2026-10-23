import type {TurboModule} from 'react-native';
import {TurboModuleRegistry} from 'react-native';

// The daily reminder, on Android (android/.../reminders). A time is minutes
// after midnight, on the phone's own clock; -1 means no reminder is set.
export interface Spec extends TurboModule {
  schedule(minutesOfDay: number): Promise<void>;
  cancel(): Promise<void>;
  scheduledAt(): Promise<number>;
}

// `get`, not `getEnforcing`: on a phone without the module (iOS, tests) the
// reminder simply isn't offered.
export default TurboModuleRegistry.get<Spec>('MindDocReminders');
