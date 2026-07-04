import { apiUrl } from './config';

const SESSION_KEY = 'shramik-lens-session';

export function loadSession() {
  try {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY));
    if (
      typeof session?.accessToken === 'string'
      && typeof session?.refreshToken === 'string'
      && typeof session?.user?.name === 'string'
      && typeof session?.user?.role === 'string'
    ) return session;
    localStorage.removeItem(SESSION_KEY);
    return null;
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function saveSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function tokenExpiry(token) {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(payload)).exp * 1000;
  } catch {
    return 0;
  }
}

async function authRequest(path, options) {
  const response = await fetch(apiUrl(`/auth/${path}`), options);
  const body = response.status === 204 ? {} : await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || 'Unable to complete authentication');
  return body;
}

export async function authenticate(mode, values) {
  const session = await authRequest(mode, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(values),
  });
  saveSession(session);
  return session;
}

export async function refreshSession(session) {
  if (!session?.refreshToken) throw new Error('Your session has expired');
  const refreshed = await authRequest('refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: session.refreshToken }),
  });
  saveSession(refreshed);
  return refreshed;
}

export function millisecondsUntilRefresh(session) {
  return Math.max(0, tokenExpiry(session?.accessToken) - Date.now() - 60_000);
}

export async function revokeSession(session) {
  if (!session?.refreshToken) return;
  await authRequest('logout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: session.refreshToken }),
  });
}
