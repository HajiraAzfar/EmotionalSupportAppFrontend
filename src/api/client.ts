const API_URL = 'http://10.0.2.2:8000';

type RequestOptions = {
  method?: string;
  body?: unknown;
  token?: string;
};

export async function apiRequest(path: string, options: RequestOptions = {}) {
  const {method = 'GET', body, token} = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || 'Something went wrong.');
  }

  return data;
}