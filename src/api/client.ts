import {getRefreshToken, saveTokens} from '../storage/tokens';

// Where the backend lives, as seen from the device running the app:
//  - Android emulator: 10.0.2.2 is the emulator's alias for this computer.
//  - Real phone over USB: 'http://localhost:8000', after running
//      adb reverse tcp:8000 tcp:8000
//  - Real phone over Wi-Fi: this computer's IP, e.g. 'http://192.168.10.8:8000'
//    (both on the same network, and start uvicorn with --host 0.0.0.0).
const API_URL = 'http://10.0.2.2:8000';

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
