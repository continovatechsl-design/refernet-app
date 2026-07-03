// A minimal service worker — its presence (plus manifest.json) is what
// lets Chrome/Edge/Android show "Install app" and lets iOS "Add to Home
// Screen" launch in standalone mode instead of Safari's browser chrome.
const CACHE_NAME = 'refernet-v1'

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

// Simple network-first passthrough — keeps things fresh since this app is
// dynamic (Firestore data), we're not trying to work fully offline.
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  )
})
