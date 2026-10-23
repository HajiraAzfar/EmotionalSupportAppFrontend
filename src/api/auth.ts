import {apiRequest} from './client';
import {getAccessToken} from '../storage/tokens';

// What the user would like to be called in the greeting; empty clears it.
export async function setPreferredName(name: string): Promise<{preferred_name: string | null}> {
  const token = await getAccessToken();
  return apiRequest('/onboarding/name', {method: 'PUT', body: {name}, token: token ?? undefined});
}

// SRS 4.12: the account and everything in it, gone for good. Asks for the
// password again.
export async function deleteAccount(password: string) {
  const token = await getAccessToken();
  return apiRequest('/auth/delete-account', {method: 'POST', body: {password}, token: token ?? undefined});
}

export function signupEmail(email: string) {
  return apiRequest('/auth/signup', {
    method: 'POST',
    body: {email},
  });
}

export function verifySignupCode(email: string, code: string) {
  return apiRequest('/auth/verify-signup-code', {
    method: 'POST',
    body: {email, code},
  });
}

export function setPassword(setupToken: string, password: string) {
  return apiRequest('/auth/set-password', {
    method: 'POST',
    body: {setup_token: setupToken, password},
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

export function forgotPassword(email: string) {
  return apiRequest('/auth/forgot-password', {
    method: 'POST',
    body: {email},
  });
}

export function verifyResetCode(email: string, code: string) {
  return apiRequest('/auth/verify-reset-code', {
    method: 'POST',
    body: {email, code},
  });
}

export function resetPasswordWithCode(resetToken: string, password: string) {
  return apiRequest('/auth/reset-password-code', {
    method: 'POST',
    body: {reset_token: resetToken, password},
  });
}