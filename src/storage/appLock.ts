import AsyncStorage from '@react-native-async-storage/async-storage';
import {sha256} from 'js-sha256';

// FR-AUTH-009: the lock lives on this device and nowhere else. The PIN is never
// sent to the server, never written to a log, and never stored as itself —
// only a salted hash of it is kept, so reading storage does not reveal it.
const PIN_KEY = 'app_lock_pin';
const ATTEMPTS_KEY = 'app_lock_attempts';

export const PIN_LENGTH = 6;

// Enough rounds to make guessing a six-digit PIN slow, few enough that
// unlocking still feels instant on a phone (~200ms).
const ITERATIONS = 20000;

// How long the app may be in the background before it locks. A few seconds of
// switching apps should not make her type the PIN again; a real absence should.
export const LOCK_AFTER_MS = 30_000;

type StoredPin = {salt: string; hash: string};
export type Attempts = {failed: number; lockedUntil: number};

const NO_ATTEMPTS: Attempts = {failed: 0, lockedUntil: 0};

// A salt is not a secret: it only stops one precomputed table working on every
// device. There is no secure random source here without a native module.
function newSalt(): string {
  return sha256(`${Date.now()}-${Math.random()}-${Math.random()}`).slice(0, 32);
}

function derive(pin: string, salt: string): string {
  let digest = sha256(salt + pin);
  for (let i = 1; i < ITERATIONS; i++) {
    digest = sha256(digest + salt);
  }
  return digest;
}

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export async function isLockSet(): Promise<boolean> {
  return (await AsyncStorage.getItem(PIN_KEY)) !== null;
}

export async function setPin(pin: string): Promise<void> {
  const salt = newSalt();
  const stored: StoredPin = {salt, hash: derive(pin, salt)};
  await AsyncStorage.setItem(PIN_KEY, JSON.stringify(stored));
  await resetAttempts();
}

export async function verifyPin(pin: string): Promise<boolean> {
  const stored = await readJson<StoredPin | null>(PIN_KEY, null);
  if (!stored) {
    return false;
  }
  return derive(pin, stored.salt) === stored.hash;
}

/** Turning the lock off, or signing out: the hash and the attempt count both go. */
export async function clearLock(): Promise<void> {
    await AsyncStorage.removeMany([PIN_KEY, ATTEMPTS_KEY]);
}

/**
 * How long the app refuses further attempts after this many failures. Stored,
 * so closing and reopening the app does not clear a lockout.
 */
export function lockoutMs(failed: number): number {
  if (failed < 5) {
    return 0;
  }
  if (failed === 5) {
    return 30_000;
  }
  if (failed === 6) {
    return 60_000;
  }
  if (failed === 7) {
    return 5 * 60_000;
  }
  return 15 * 60_000;
}

export async function getAttempts(): Promise<Attempts> {
  return readJson<Attempts>(ATTEMPTS_KEY, NO_ATTEMPTS);
}

export async function registerFailure(): Promise<Attempts> {
  const current = await getAttempts();
  const failed = current.failed + 1;
  const wait = lockoutMs(failed);
  const next: Attempts = {failed, lockedUntil: wait ? Date.now() + wait : 0};
  await AsyncStorage.setItem(ATTEMPTS_KEY, JSON.stringify(next));
  return next;
}

export async function resetAttempts(): Promise<void> {
  await AsyncStorage.removeItem(ATTEMPTS_KEY);
}