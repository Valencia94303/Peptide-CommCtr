// Peptide Command Center — minimal service worker.
//
// Strategy:
//   - HTML pages: network-first, fall back to cache. This means new deploys
//     land immediately when online, but the app still opens if the user is
//     offline or the network is flaky.
//   - Manifest + icons: cache-first. Small and rarely changes.
//   - Everything else (CDN scripts, Supabase XHR, Storage): pass through.
//
// Bump CACHE_VERSION whenever you change which files are precached.

const CACHE_VERSION = 'pepcc-v4';
const CORE_ASSETS = [
    './',
    './index.html',
    './onboarding.html',
    './manifest.json',
    './icon.svg'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_VERSION).then((cache) => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => Promise.all(
            keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))
        )).then(() => self.clients.claim())
    );
});

function isHTMLRequest(req) {
    return req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');
}

function isSameOriginStatic(url) {
    return url.origin === self.location.origin
        && (url.pathname.endsWith('.svg') || url.pathname.endsWith('.json') || url.pathname.endsWith('.png') || url.pathname.endsWith('.ico'));
}

self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (req.method !== 'GET') return;
    const url = new URL(req.url);

    // Never touch Supabase, auth, or external API calls.
    if (url.hostname.includes('supabase')) return;
    if (url.hostname.includes('googleapis') || url.hostname.includes('googleusercontent')) return;

    if (isHTMLRequest(req)) {
        // Network-first for HTML so deploys land immediately.
        event.respondWith(
            fetch(req).then((resp) => {
                if (resp && resp.ok && url.origin === self.location.origin) {
                    const copy = resp.clone();
                    caches.open(CACHE_VERSION).then((cache) => cache.put(req, copy));
                }
                return resp;
            }).catch(() => caches.match(req).then((c) => c || caches.match('./index.html')))
        );
        return;
    }

    if (isSameOriginStatic(url)) {
        // Cache-first for small static assets.
        event.respondWith(
            caches.match(req).then((cached) => cached || fetch(req).then((resp) => {
                if (resp && resp.ok) {
                    const copy = resp.clone();
                    caches.open(CACHE_VERSION).then((cache) => cache.put(req, copy));
                }
                return resp;
            }))
        );
    }
});
