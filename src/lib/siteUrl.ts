export const DEFAULT_SITE_URL = 'https://www.rifleshooting.co.za';

export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  return (configured || DEFAULT_SITE_URL).replace(/\/$/, '');
}

/** Absolute URL for a site path. Homepage is `https://www.rifleshooting.co.za/`. */
export function absoluteUrl(path = '/'): string {
  const site = getSiteUrl();
  if (!path || path === '/') return `${site}/`;
  const normalised = path.startsWith('/') ? path : `/${path}`;
  return `${site}${normalised}`;
}
