import {getRefreshToken, saveTokens} from '../storage/tokens';

// Where the backend lives, as seen from the device running the app.
// A debug build runs on the emulator against uvicorn on this computer, which
// the emulator reaches at 10.0.2.2. A release build is the one that goes on a
// phone, and it talks to the deployed server over HTTPS, so the phone needs
// nothing but internet — no shared Wi-Fi, no firewall rule, no laptop awake.
const API_URL = __DEV__
  ? 'http://10.0.2.2:8000'
  : 'https://emotional-support-backend-a0039c1a.fastapicloud.dev';

type RequestOptions = {
  method?: string;
  body?: unknown;
  token?: string;
};

// One refresh at a time: parallel 401s wait for the same rotation instead of
// each spending the (single-use) refresh token.
let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) {
    return null;
  }
  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({refresh_token: refreshToken}),
  });
  if (!response.ok) {
    return null;
  }
  const data = await response.json();
  await saveTokens(data.access_token, data.refresh_token);
  return data.access_token;
}

async function send(path: string, method: string, body: unknown, token?: string) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function apiRequest(path: string, options: RequestOptions = {}) {
  const {method = 'GET', body, token} = options;

  let response = await send(path, method, body, token);

  // Access tokens last 15 minutes; a journal or conversation can outlast one.
  if (response.status === 401 && token) {
    refreshing = refreshing ?? refreshAccessToken().finally(() => (refreshing = null));
    const fresh = await refreshing;
    if (fresh) {
      response = await send(path, method, body, fresh);
    }
  }

  if (response.status === 204) {
    return null;
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || 'Something went wrong.');
  }

  return data;
}
