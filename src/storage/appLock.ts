import AsyncStorage from '@react-native-async-storage/async-storage';
import {sha256} from 'js-sha256';
import {apiRequest} from '../api/client';
import {getAccessToken} from './tokens';

// FR-AUTH-009, changed 18 Nov 2026 at the owner's request: the lock belongs to
// the account, so one PIN works on every phone the account signs in on. The
// PIN itself is never sent anywhere, never written to a log, and never stored
// as itself: only a salted, slow hash of it, kept with the account on the
// server and copied to each phone, which checks the PIN offline.
//
// On a phone, each account's copy sits under the account's id: signing in as
// someone else never asks for another person's PIN. Signed out there is no
// lock, as there is nothing of anyone's to protect.
const PIN_KEY = 'app_lock_pin';
const ATTEMPTS_KEY = 'app_lock_attempts';
// Set once this phone has matched the server for the account; from then on
// the server is the truth (see syncLock).
const SYNCED_KEY = 'app_lock_synced';

const BASE64URL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

// Hermes has no typed atob, and a lock that silently failed to decode would be
// a lock that is silently off, so the few lines are written out here.
function fromBase64Url(text: string): string {
  let out = '';
  let value = 0;
  let bits = 0;
  for (const char of text) {
    // eslint-disable-next-line no-bitwise
    value = ((value << 6) | BASE64URL.indexOf(char)) & 0xffff;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      // eslint-disable-next-line no-bitwise
      out += String.fromCharCode((value >> bits) & 0xff);
    }
  }
  return out;
}

// The account is the access token's `sub`. It is read without checking the
// signature: it only chooses which PIN applies, and the server checks every request.
function accountOf(token: string | null): string | null {
  try {
    const sub = JSON.parse(fromBase64Url(token!.split('.')[1])).sub;
    return typeof sub === 'string' && sub ? sub : null;
  } catch {
    return null;
  }
}

type Keys = {pin: string; attempts: string; synced: string};

async function keys(): Promise<Keys | null> {
  const account = accountOf(await getAccessToken());
  if (!account) {
    return null;
  }
  const own = {
    pin: `${PIN_KEY}:${account}`,
    attempts: `${ATTEMPTS_KEY}:${account}`,
    synced: `${SYNCED_KEY}:${account}`,
  };
  // Until 18 Nov 2026 one PIN served the whole phone. It becomes the PIN of
  // whoever is signed in, which is whom it already locked.
  const shared = await AsyncStorage.getItem(PIN_KEY);
  if (shared !== null) {
    await AsyncStorage.setItem(own.pin, shared);
    await AsyncStorage.removeItem(PIN_KEY);
    await AsyncStorage.removeItem(ATTEMPTS_KEY);
  }
  return own;
}

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

async function saveToServer(stored: StoredPin | null): Promise<void> {
  const token = (await getAccessToken()) ?? undefined;
  await apiRequest('/auth/app-lock', {method: 'PUT', token, body: {pin: stored}});
}

export async function isLockSet(): Promise<boolean> {
  const own = await keys();
  return own !== null && (await AsyncStorage.getItem(own.pin)) !== null;
}

/** For every phone. The server is written first, so offline nothing changes and this throws. */
export async function setPin(pin: string): Promise<void> {
  const own = await keys();
  if (!own) {
    throw new Error('Sign in to set a PIN.');
  }
  const salt = newSalt();
  const stored: StoredPin = {salt, hash: derive(pin, salt)};
  await saveToServer(stored);
  await AsyncStorage.setItem(own.pin, JSON.stringify(stored));
  await AsyncStorage.setItem(own.synced, '1');
  await resetAttempts();
}

export async function verifyPin(pin: string): Promise<boolean> {
  const own = await keys();
  const raw = own && (await AsyncStorage.getItem(own.pin));
  // No PIN for this account any more: it was turned off on another phone while
  // this one sat locked, and there is nothing left to keep anyone out with.
  if (raw === null) {
    return true;
  }
  const stored = await readJson<StoredPin | null>(own!.pin, null);
  return stored !== null && derive(pin, stored.salt) === stored.hash;
}

/**
 * Turning the lock off, or a forgotten PIN: gone for the account on every
 * phone, so the next sign-in does not bring it back. Server first, so offline
 * this throws and nothing changes. Call it before clearTokens().
 */
export async function clearLock(): Promise<void> {
  await saveToServer(null);
  await forgetLock();
}

/**
 * This phone's copy only: after the account itself is deleted, or when the
 * server can't be reached. Signing out keeps it for the next sign-in.
 */
export async function forgetLock(): Promise<void> {
  const own = await keys();
  if (own) {
    await AsyncStorage.removeItem(own.pin);
    await AsyncStorage.removeItem(own.attempts);
    await AsyncStorage.removeItem(own.synced);
  }
}

/**
 * Brings this phone in line with the account, whenever the app learns who is
 * signed in: a PIN set, changed or turned off on another phone applies here
 * too. A PIN this phone kept before PINs followed the account is uploaded the
 * first time instead of being dropped. Offline, this phone's copy stands.
 */
export async function syncLock(): Promise<void> {
  const own = await keys();
  if (!own) {
    return;
  }
  try {
    const token = (await getAccessToken()) ?? undefined;
    const {pin} = (await apiRequest('/auth/app-lock', {token})) as {pin: StoredPin | null};
    const local = await AsyncStorage.getItem(own.pin);
    if (pin) {
      await AsyncStorage.setItem(own.pin, JSON.stringify(pin));
    } else if (local !== null && !(await AsyncStorage.getItem(own.synced))) {
      await saveToServer(JSON.parse(local));
    } else {
      await AsyncStorage.removeItem(own.pin);
    }
    await AsyncStorage.setItem(own.synced, '1');
  } catch {
    // Offline, or the session has ended: try again at the next sign-in or start.
  }
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
  const own = await keys();
  return own ? readJson<Attempts>(own.attempts, NO_ATTEMPTS) : NO_ATTEMPTS;
}

export async function registerFailure(): Promise<Attempts> {
  const own = await keys();
  const current = await getAttempts();
  const failed = current.failed + 1;
  const wait = lockoutMs(failed);
  const next: Attempts = {failed, lockedUntil: wait ? Date.now() + wait : 0};
  if (own) {
    await AsyncStorage.setItem(own.attempts, JSON.stringify(next));
  }
  return next;
}

export async function resetAttempts(): Promise<void> {
  const own = await keys();
  if (own) {
    await AsyncStorage.removeItem(own.attempts);
  }
}
