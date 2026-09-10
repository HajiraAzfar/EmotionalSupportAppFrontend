import {apiRequest} from './client';

export function signup(email: string, password: string) {
  return apiRequest('/auth/signup', {
    method: 'POST',
    body: {email, password},
  });
}

export function login(email: string, password: string) {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: {email, password},
  });
}

export function getMe(token: string) {
  return apiRequest('/auth/me', {token});
}