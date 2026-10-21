export const API_BASE_URL = (import.meta.env?.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

export async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem('token');
  if (!token) {
    window.dispatchEvent(new Event('session-expired'));
    throw new Error('Please sign in to continue');
  }
  // Only attach credentials to this application's configured API origin.
  const url = new URL(input, API_BASE_URL);
  if (url.origin !== new URL(API_BASE_URL).origin) throw new Error('Unexpected API origin');
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(url.toString(), { ...init, headers });
  if (response.status === 401) {
    localStorage.removeItem('token');
    window.dispatchEvent(new Event('session-expired'));
    throw new Error('Your session expired. Please sign in again');
  }
  if (!response.ok) {
    let message = 'The request could not be saved';
    try { const body = await response.json(); if (typeof body.error === 'string') message = body.error; } catch { /* Non-JSON error response. */ }
    throw new Error(message);
  }
  return response;
}
