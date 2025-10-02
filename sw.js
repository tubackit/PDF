// Service Worker für PDF Tools PWA
const CACHE_NAME = 'pdf-tools-v1.0.0';
const STATIC_CACHE = 'pdf-tools-static-v1.0.0';
const DYNAMIC_CACHE = 'pdf-tools-dynamic-v1.0.0';

// Dateien die gecacht werden sollen
const STATIC_FILES = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/manifest.json',
  'https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js',
  'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.min.js',
  'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js',
  'https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js'
];

// Service Worker Installation
self.addEventListener('install', (event) => {
  console.log('Service Worker: Install');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('Service Worker: Static files cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Cache failed', error);
      })
  );
});

// Service Worker Aktivierung
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activate');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activated');
        return self.clients.claim();
      })
  );
});

// Fetch Event Handler
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Nur GET-Requests cachen
  if (request.method !== 'GET') {
    return;
  }
  
  // Externe APIs nicht cachen (PDF-lib, PDF.js, etc.)
  if (url.hostname !== self.location.hostname) {
    // Für externe Ressourcen: Cache First Strategy
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          return fetch(request)
            .then((response) => {
              // Nur erfolgreiche Responses cachen
              if (response.status === 200) {
                const responseClone = response.clone();
                caches.open(DYNAMIC_CACHE)
                  .then((cache) => {
                    cache.put(request, responseClone);
                  });
              }
              return response;
            })
            .catch(() => {
              // Fallback für externe Ressourcen
              return new Response('Offline - Externe Ressource nicht verfügbar', {
                status: 503,
                statusText: 'Service Unavailable'
              });
            });
        })
    );
    return;
  }
  
  // Für lokale Dateien: Cache First Strategy
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        return fetch(request)
          .then((response) => {
            // Nur erfolgreiche Responses cachen
            if (response.status === 200) {
              const responseClone = response.clone();
              caches.open(DYNAMIC_CACHE)
                .then((cache) => {
                  cache.put(request, responseClone);
                });
            }
            return response;
          })
          .catch(() => {
            // Offline Fallback
            if (request.destination === 'document') {
              return caches.match('/index.html');
            }
            return new Response('Offline', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});

// Background Sync für Offline-Funktionalität
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync', event.tag);
  
  if (event.tag === 'pdf-processing') {
    event.waitUntil(
      // Hier könnte Offline-PDF-Verarbeitung implementiert werden
      console.log('Background sync: PDF processing')
    );
  }
});

// Push Notifications (für zukünftige Features)
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'PDF Tools Benachrichtigung',
    icon: '/manifest.json',
    badge: '/manifest.json',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'open',
        title: 'App öffnen',
        icon: '/manifest.json'
      },
      {
        action: 'close',
        title: 'Schließen',
        icon: '/manifest.json'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('PDF Tools', options)
  );
});

// Notification Click Handler
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked');
  
  event.notification.close();
  
  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Message Handler für Kommunikation mit der App
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

// Error Handler
self.addEventListener('error', (event) => {
  console.error('Service Worker: Error', event.error);
});

// Unhandled Promise Rejection Handler
self.addEventListener('unhandledrejection', (event) => {
  console.error('Service Worker: Unhandled promise rejection', event.reason);
});