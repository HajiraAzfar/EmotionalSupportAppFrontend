import AsyncStorage from '@react-native-async-storage/async-storage';
import {clearLock, isLockSet, setPin, syncLock, verifyPin} from '../src/storage/appLock';
import {clearTokens, saveTokens} from '../src/storage/tokens';

// Jest runs on Node, which has Buffer; the app's TypeScript setup has no Node types.
declare const Buffer: {from(text: string): {toString(encoding: 'base64url'): string}};

// The server's /auth/app-lock, one PIN hash per account, for whoever is signed in.
const mockServer = new Map<string, unknown>();
let mockAccount = '';
let mockOffline = false;
jest.mock('../src/api/client', () => ({
  apiRequest: jest.fn(async (_path: string, {method = 'GET', body}: {method?: string; body?: any} = {}) => {
    if (mockOffline) {
      throw new Error("Couldn't connect. Check your internet and try again.");
    }
    if (method === 'PUT') {
      mockServer.set(mockAccount, body.pin);
    }
    return {pin: mockServer.get(mockAccount) ?? null};
  }),
}));

// A token shaped like the server's: base64url, no padding, `sub` is the account id.
function signIn(account: string) {
  mockAccount = account;
  const payload = Buffer.from(JSON.stringify({sub: account, exp: 1_900_000_000})).toString('base64url');
  return saveTokens(`header.${payload}.signature`, 'refresh');
}

// A second phone: the same server, nothing stored on the phone yet.
const newPhone = () => AsyncStorage.clear();

const A = '3f6c1a2e-8b4d-4e7a-9c1f-0a2b3c4d5e6f';
const B = 'b7e2d9c4-1a3f-4b6e-8d0c-9f8e7d6c5b4a';

beforeEach(async () => {
  await AsyncStorage.clear();
  mockServer.clear();
  mockOffline = false;
});

test('the PIN follows the account to another phone', async () => {
  await signIn(A);
  await setPin('111111');

  await newPhone();
  await signIn(A);
  await syncLock();
  expect(await isLockSet()).toBe(true);
  expect(await verifyPin('111111')).toBe(true);
  expect(await verifyPin('999999')).toBe(false);
});

test('each account has its own PIN', async () => {
  await signIn(A);
  await setPin('111111');

  await signIn(B);
  await syncLock();
  expect(await isLockSet()).toBe(false); // B is never asked for A's PIN
  await setPin('222222');
  expect(await verifyPin('111111')).toBe(false);

  await signIn(A);
  await syncLock();
  expect(await verifyPin('111111')).toBe(true);

  await clearTokens();
  expect(await isLockSet()).toBe(false); // signed out: nothing to lock
});

test('a change, or turning it off, on another phone reaches this one', async () => {
  await signIn(A);
  await setPin('111111');
  const phoneOne = await AsyncStorage.getItem(`app_lock_pin:${A}`);

  // Phone two changes it.
  await newPhone();
  await signIn(A);
  await syncLock();
  await setPin('333333');

  // Back on phone one, still holding the old copy until it syncs.
  await newPhone();
  await signIn(A);
  await AsyncStorage.setItem(`app_lock_pin:${A}`, phoneOne!);
  await AsyncStorage.setItem(`app_lock_synced:${A}`, '1');
  await syncLock();
  expect(await verifyPin('333333')).toBe(true);
  expect(await verifyPin('111111')).toBe(false);

  // Phone two turns it off: phone one, even sitting at its lock screen, lets her in.
  mockServer.set(A, null);
  await syncLock();
  expect(await isLockSet()).toBe(false);
  expect(await verifyPin('000000')).toBe(true);
});

test('turning it off clears it for the account', async () => {
  await signIn(A);
  await setPin('111111');
  await clearLock();
  expect(await isLockSet()).toBe(false);
  expect(mockServer.get(A)).toBeNull();

  await newPhone();
  await signIn(A);
  await syncLock();
  expect(await isLockSet()).toBe(false);
});

test('offline, setting or turning off changes nothing', async () => {
  await signIn(A);
  mockOffline = true;
  await expect(setPin('111111')).rejects.toThrow('internet');
  expect(await isLockSet()).toBe(false);

  mockOffline = false;
  await setPin('111111');
  mockOffline = true;
  await expect(clearLock()).rejects.toThrow('internet');
  expect(await verifyPin('111111')).toBe(true);
  await syncLock(); // offline: this phone's copy stands
  expect(await isLockSet()).toBe(true);
});

test('a PIN kept only on this phone, from before, is uploaded, not dropped', async () => {
  await signIn(A);
  await setPin('123456');
  const stored = await AsyncStorage.getItem(`app_lock_pin:${A}`);
  // As an older version left it: one shared key, never sent to the server.
  await AsyncStorage.clear();
  mockServer.clear();
  await AsyncStorage.setItem('app_lock_pin', stored!);

  await signIn(A);
  await syncLock();
  expect(await verifyPin('123456')).toBe(true);
  expect(mockServer.get(A)).toEqual(JSON.parse(stored!));
  expect(await AsyncStorage.getItem('app_lock_pin')).toBeNull();
});
