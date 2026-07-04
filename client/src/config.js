const configuredApiUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, '');

export const API_BASE_URL = configuredApiUrl || '/api';

export function apiUrl(path = '') {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

export function absoluteApiUrl(path = '') {
  return new URL(apiUrl(path), window.location.origin).toString();
}
