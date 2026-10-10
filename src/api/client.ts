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
  // A file upload (a voice recording) goes as multipart; fetch sets that
  // Content-Type itself, with the boundary, so it must not be set here.
  const isForm = body instanceof FormData;
  const headers: Record<string, string> = isForm ? {} : {'Content-Type': 'application/json'};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    return await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: isForm ? body : body ? JSON.stringify(body) : undefined,
    });
  } catch {
    // No connection: fetch's own "Network request failed" means nothing to her.
    throw new NetworkError();
  }
}

export const NETWORK_MESSAGE = "Couldn't connect. Check your internet and try again.";

// Thrown when the request never reached the server, so a screen can keep what
// she entered and offer a retry instead of treating it as a server answer.
export class NetworkError extends Error {
  constructor() {
    super(NETWORK_MESSAGE);
    this.name = 'NetworkError';
  }
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

  // A crashed server answers in plain text ("Internal Server Error"), not JSON:
  // read it as text first so she sees a readable message, not a parser error.
  const raw = await response.text();
  let data = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(data?.detail || "Couldn't reach Echo just now. Please try again in a moment.");
  }

  return data;
}
