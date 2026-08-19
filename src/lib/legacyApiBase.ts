/**
 * Base URL for the abandoned FastAPI backend.
 * Production must never fall back to localhost — that string must not appear
 * in the client bundle (webpack dead-code-eliminates the development branch).
 */
export function getLegacyApiBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '');
  if (configured) return configured;
  if (process.env.NODE_ENV !== 'production') {
    return 'http://localhost:8000/api';
  }
  return '';
}

export function getLegacyBackendOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');
  if (configured) return configured;
  if (process.env.NODE_ENV !== 'production') {
    return 'http://localhost:8000';
  }
  return '';
}
