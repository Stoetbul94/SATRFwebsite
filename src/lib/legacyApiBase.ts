/**
 * Base URL for the abandoned FastAPI backend.
 * Production must never fall back to localhost.
 */

export function resolveLegacyApiBase(
  nodeEnv: string | undefined,
  configuredUrl: string | undefined
): string | undefined {
  const configured = configuredUrl?.trim().replace(/\/$/, '');
  if (configured) return configured;
  if (nodeEnv !== 'production') {
    return 'http://localhost:8000/api';
  }
  return undefined;
}

export function resolveLegacyBackendOrigin(
  nodeEnv: string | undefined,
  configuredUrl: string | undefined
): string | undefined {
  const configured = configuredUrl?.trim().replace(/\/$/, '');
  if (configured) return configured;
  if (nodeEnv !== 'production') {
    return 'http://localhost:8000';
  }
  return undefined;
}

export function getLegacyApiBaseUrl(): string | undefined {
  return resolveLegacyApiBase(process.env.NODE_ENV, process.env.NEXT_PUBLIC_API_BASE_URL);
}

export function getLegacyBackendOrigin(): string | undefined {
  return resolveLegacyBackendOrigin(process.env.NODE_ENV, process.env.NEXT_PUBLIC_API_URL);
}
