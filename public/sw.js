const ASSETS_CACHE = 'orthodox-assets-v1';
const PAGES_CACHE = 'orthodox-pages-v1';
const API_CACHE = 'orthodox-api-v1';
const BOOKS_PDF_CACHE = 'orthodox-books-pdf-v1';

const CORE_PRECACHE = [
  '/',
  '/offline-reader',
  '/manifest.webmanifest',
  '/pdf.worker.min.mjs',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/design/church.webp',
  '/design/sanctuary.webp',
  '/design/sections/beacon.webp',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(PAGES_CACHE)
      .then((cache) => cache.addAll(['/offline-reader']).catch(() => {}))
      .then(() => caches.open(ASSETS_CACHE).then((c) => c.addAll(CORE_PRECACHE.slice(2)).catch(() => {})))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  const keep = new Set([ASSETS_CACHE, PAGES_CACHE, API_CACHE, BOOKS_PDF_CACHE]);
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !keep.has(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

async function cacheUrlsWithConcurrency(cacheName, urls, concurrency = 4) {
  const cache = await caches.open(cacheName);
  let idx = 0;
  async function worker() {
    while (idx < urls.length) {
      const target = urls[idx++];
      try {
        const res = await fetch(target, { credentials: 'same-origin' });
        if (res.ok) {
          await cache.put(target, res);
        }
      } catch {
        // Ignore transient single-url prefetch errors
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
}

self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || typeof data !== 'object') return;
  if (data.type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }
  if (data.type === 'CACHE_APP_SHELL' && Array.isArray(data.urls)) {
    const pages = [];
    const assets = [];
    for (const u of data.urls) {
      if (typeof u !== 'string') continue;
      if (u.startsWith('/_next/static/') || u.startsWith('/design/') || u.startsWith('/icons/') || u.endsWith('.mjs')) {
        assets.push(u);
      } else {
        pages.push(u);
      }
    }
    event.waitUntil(
      Promise.all([
        cacheUrlsWithConcurrency(PAGES_CACHE, pages, 4),
        cacheUrlsWithConcurrency(ASSETS_CACHE, assets, 6),
      ]),
    );
  }
});

async function handleSavedPdfRequest(request, url) {
  const cache = await caches.open(BOOKS_PDF_CACHE);
  const canonicalUrl = `${url.origin}${url.pathname.replace(/\/file\/download$/, '/file/stream')}`;
  const cached = await cache.match(canonicalUrl);

  if (cached) {
    const rangeHeader = request.headers.get('range');
    if (!rangeHeader) {
      return cached;
    }

    const fullBuf = await cached.arrayBuffer();
    const total = fullBuf.byteLength;
    const match = /bytes=(\d+)-(\d*)/.exec(rangeHeader);
    if (!match) {
      return new Response(fullBuf, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Length': String(total),
          'Accept-Ranges': 'bytes',
        },
      });
    }

    const start = Math.min(Number(match[1]), total - 1);
    const end = match[2] ? Math.min(Number(match[2]), total - 1) : total - 1;
    const chunk = fullBuf.slice(start, end + 1);

    return new Response(chunk, {
      status: 206,
      headers: {
        'Content-Type': 'application/pdf',
        'Accept-Ranges': 'bytes',
        'Content-Range': `bytes ${start}-${end}/${total}`,
        'Content-Length': String(chunk.byteLength),
      },
    });
  }

  // Never auto-cache unrequested PDFs during regular browsing
  return fetch(request);
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith('/api/offline/')) return;

  if (/^\/library\/[^/]+\/file\/(stream|download)$/.test(url.pathname)) {
    event.respondWith(handleSavedPdfRequest(request, url));
    return;
  }

  if (url.pathname.startsWith('/videos/download/')) return;

  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/design/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname === '/pdf.worker.min.mjs' ||
    url.pathname === '/manifest.webmanifest' ||
    url.pathname === '/icon.png'
  ) {
    event.respondWith(
      caches.open(ASSETS_CACHE).then(async (cache) => {
        const hit = await cache.match(request);
        if (hit) return hit;
        const fresh = await fetch(request);
        if (fresh.ok) cache.put(request, fresh.clone()).catch(() => {});
        return fresh;
      }),
    );
    return;
  }

  if (url.pathname.startsWith('/api/')) {
    if (url.pathname.startsWith('/api/ai/') || url.pathname === '/api/health') return;
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(API_CACHE).then((c) => c.put(request, copy).catch(() => {}));
          }
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          return new Response(JSON.stringify({ offline: true }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          });
        }),
    );
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(PAGES_CACHE).then((c) => c.put(request.url, copy).catch(() => {}));
          }
          return res;
        })
        .catch(async () => {
          const pagesCache = await caches.open(PAGES_CACHE);
          const exact = await pagesCache.match(request.url);
          if (exact) return exact;
          const byPath = await pagesCache.match(url.pathname);
          if (byPath) return byPath;
          const fallback = await pagesCache.match('/offline-reader');
          if (fallback) return fallback;
          const home = await pagesCache.match('/');
          return (
            home ||
            new Response('<h1>أنت في وضع عدم الاتصال</h1><p>يرجى العودة للصفحة الرئيسية.</p>', {
              status: 503,
              headers: { 'Content-Type': 'text/html; charset=utf-8' },
            })
          );
        }),
    );
  }
});
