/** NigeriaTransfer Service Worker — Offline support + upload queue */

const CACHE_NAME = "nt-v1";
const APP_SHELL = ["/", "/pricing", "/about", "/offline"];

// Install — cache app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — serve from cache, fall back to network
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Skip non-GET and API requests
  if (request.method !== "GET" || request.url.includes("/api/")) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          // Cache static assets
          if (response.ok && (request.url.includes("/_next/static/") || request.url.includes("/images/"))) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          // Offline fallback for pages
          if (request.headers.get("accept")?.includes("text/html")) {
            return caches.match("/");
          }
          return new Response("Offline", { status: 503 });
        });
    })
  );
});

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
