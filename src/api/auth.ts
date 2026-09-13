import {apiRequest} from './client';

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