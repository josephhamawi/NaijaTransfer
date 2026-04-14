/** NaijaTransfer Service Worker — Offline support + upload queue */

// Bumping the SW version invalidates ALL old caches on activate. This is the
// version to bump whenever the SW logic changes. Asset freshness is handled
// by the strategies below — we no longer precache HTML, so a new deploy
// does not require bumping this.
const SW_VERSION = "nt-v2";
const STATIC_CACHE = `${SW_VERSION}-static`;

// Install — take over immediately. We intentionally do NOT precache HTML
// shells: the previous version precached /, /about, /pricing, and after a
// deploy served them back cache-first. That stale HTML referenced chunk
// hashes that no longer existed on the server, which crashed hydration with
// React errors #418/#423. HTML is now always fetched fresh (network-first).
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

// Activate — drop every cache that isn't the current version.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => !k.startsWith(SW_VERSION)).map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Fetch strategy:
//   - /_next/static/*  → cache-first (files are immutable by content hash)
//   - everything else  → network-first, fall back to cache only on offline
// This guarantees that a refresh after a deploy ALWAYS pulls fresh HTML,
// so the client ends up on matching chunk hashes.
self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Never intercept API calls — they must always hit the network and must
  // never be cached (auth tokens, live data, uploads).
  if (url.pathname.startsWith("/api/")) return;

  // Immutable hashed assets: cache-first.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Everything else (HTML navigations, images, /wallpapers/*, etc.):
  // network-first with offline fallback.
  event.respondWith(networkFirst(request));
});

async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    // If the upstream is unreachable and we have no cache entry, let the
    // browser show its normal network-error — don't invent an HTML body
    // here (that's how we broke MIME checks last time).
    return new Response("", { status: 504, statusText: "Offline" });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    // Opportunistically cache successful navigations so offline still works.
    if (response.ok && request.mode === "navigate") {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (request.headers.get("accept")?.includes("text/html")) {
      const offline = await caches.match("/offline");
      if (offline) return offline;
    }
    return new Response("Offline", { status: 503 });
  }
}

// Background sync for upload queue
self.addEventListener("sync", (event) => {
  if (event.tag === "upload-queue") {
    event.waitUntil(processUploadQueue());
  }
});

async function processUploadQueue() {
  // Upload queue is stored in IndexedDB by the client
  // This handler is triggered when connectivity is restored
  const clients = await self.clients.matchAll();
  for (const client of clients) {
    client.postMessage({ type: "UPLOAD_QUEUE_SYNC", status: "processing" });
  }
}

// Listen for messages from the client
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
