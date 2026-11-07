export const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
let accessToken: string | null = null;
export const setAccessToken = (token: string | null) => { accessToken = token; };
export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) { super(message); this.status = status; }
}
export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body) headers.set('Content-Type', 'application/json');
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
  let response: Response;
  try { response = await fetch(`${API_BASE}${path}`, { ...options, headers, credentials: 'include', signal: options.signal ? AbortSignal.any([options.signal, AbortSignal.timeout(30000)]) : AbortSignal.timeout(30000) }); }
  catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new Error('Cannot reach ServiceLoop. Please check your connection and try again.', { cause: error });
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401 && !path.startsWith('/auth/')) window.dispatchEvent(new Event('serviceloop:auth-lost'));
    const message = data?.message;
    throw new ApiError(response.status, Array.isArray(message) ? message.join('. ') : message || 'The request could not be completed.');
  }
  if (data === null) throw new Error('The API returned an invalid response. Check the configured API address.');
  return data as T;
}
export async function collection<T>(path: string, signal?: AbortSignal): Promise<T[]> {
  const items: T[] = []; let offset = 0;
  for (;;) {
    const page = await api<{ items: T[]; total: number }>(`${path}${path.includes('?') ? '&' : '?'}limit=100&offset=${offset}`, { signal });
    items.push(...page.items); offset += page.items.length;
    if (!page.items.length || offset >= page.total) return items;
  }
}
export const errorMessage = (error: unknown) => error instanceof Error ? error.message : 'Something went wrong. Please try again.';
