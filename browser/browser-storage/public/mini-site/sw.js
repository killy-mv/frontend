// A service worker scoped to /mini-site/ only.
//
// It is here so the Cache API demo has a payoff you can feel: with this
// registered, the mini-site loads with your network switched off, and keeps
// loading even after the server is stopped. The Cache API is the storage; the
// service worker is the thing that reads from it instead of the network.
//
// This file must be served from /mini-site/ — a worker can only control URLs at
// or below its own path.

const CACHE_NAME = 'mini-site-v1'
const ASSETS = ['/mini-site/', '/mini-site/style.css', '/mini-site/logo.svg', '/mini-site/data.json']

// The demo page usually populated the cache already; addAll here just makes the
// worker self-sufficient if you register it first.
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)))
  self.skipWaiting() // take over without needing a second reload
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

// Cache-first: answer from storage, fall back to the network, and quietly
// refresh the stored copy when the network does work.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fromNetwork = fetch(event.request)
        .then((response) => {
          const copy = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy))
          return response
        })
        .catch(() => cached ?? Response.error())

      return cached ?? fromNetwork
    }),
  )
})
