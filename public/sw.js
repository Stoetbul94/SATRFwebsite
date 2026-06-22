/* SATRF PWA service worker v1 — public content only */
const CACHE_NAME = 'satrf-pwa-v1';

const PRECACHE_URLS = [
  '/offline.html',
  '/manifest.webmanifest',
  '/favicon.ico',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/apple-touch-icon.png',
];

const PUBLIC_PAGE_PREFIXES = [
  '/',
  '/about',
  '/events',
  '/results',
  '/rules',
  '/contact',
  '/donate',
  '/notices',
  '/insights',
];

const BYPASS_PATH_PREFIXES = [
  '/api/',
  '/admin',
  '/dashboard',
  '/login',
  '/register',
];

const BYPASS_HOST_SNIPPETS = ['firebase', 'googleapis.com', 'gstatic.com'];

function isBypassPath(pathname) {
  return BYPASS_PATH_PREFIXES.some((prefix) => {
    if (prefix.endsWith('/')) return pathname.startsWith(prefix);
    return pathname === prefix || pathname.startsWith(prefix + '/');
  });
}

function isPublicPagePath(pathname) {
  if (pathname === '/') return true;
  return PUBLIC_PAGE_PREFIXES.some(
    (prefix) => prefix !== '/' && (pathname === prefix || pathname.startsWith(prefix + '/'))
  );
}

function isStaticAsset(pathname) {
  return (
    pathname.startsWith('/images/') ||
    pathname.startsWith('/icons/') ||
    pathname.startsWith('/_next/static/') ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.webmanifest')
  );
}

function shouldBypass(request) {
  if (request.method !== 'GET') return true;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return BYPASS_HOST_SNIPPETS.some((s) => url.hostname.includes(s));
  }

  if (isBypassPath(url.pathname)) return true;

  if (request.headers.get('Authorization')) return true;

  const cacheControl = request.headers.get('Cache-Control') || '';
  if (/no-store|private/i.test(cacheControl)) return true;

  return false;
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
      .catch(() => undefined)
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
  }
  return response;
}

async function networkFirstPage(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response.ok && response.type === 'basic') {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    const offline = await caches.match('/offline.html');
    if (offline) return offline;
    return new Response('Offline', { status: 503, statusText: 'Offline' });
  }
}

self.addEventListener('fetch', (event) => {
  try {
    const { request } = event;
    if (shouldBypass(request)) return;

    const url = new URL(request.url);
    if (url.origin !== self.location.origin) return;

    const accept = request.headers.get('Accept') || '';
    const isHtmlNavigation = request.mode === 'navigate' || accept.includes('text/html');

    if (isStaticAsset(url.pathname)) {
      event.respondWith(cacheFirst(request));
      return;
    }

    if (isHtmlNavigation && isPublicPagePath(url.pathname)) {
      event.respondWith(networkFirstPage(request));
    }
  } catch {
    /* never throw from SW */
  }
});
