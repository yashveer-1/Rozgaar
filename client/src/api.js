import { loadSession } from './auth';
import { apiUrl } from './config';

export async function apiFetch(path, options = {}) {
  const session = loadSession();
  const headers = new Headers(options.headers);
  if (session?.accessToken) headers.set('Authorization', `Bearer ${session.accessToken}`);
  if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  const response = await fetch(apiUrl(path), { ...options, headers });
  if (response.status === 204) return null;
  const contentType = response.headers.get('content-type') || '';
  const body = contentType.includes('application/json') ? await response.json() : await response.blob();
  if (!response.ok) throw new Error(body?.message || 'Request failed');
  return body;
}

export const formatMoney = value => `₹${Number(value || 0).toLocaleString('en-IN')}`;
export const formatPay = pay => pay
  ? `${formatMoney(pay.min)}${pay.max && pay.max !== pay.min ? `–${formatMoney(pay.max)}` : ''}/${pay.unit}`
  : 'Pay not specified';
