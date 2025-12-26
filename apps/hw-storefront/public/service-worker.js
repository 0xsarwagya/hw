/**
 * Custom Service Worker with Auto Cache Clearing on New Deployments
 *
 * This service worker automatically detects new deployments by checking
 * the app version and clears all caches when a new version is detected.
 */

const CACHE_VERSION = "1.0.3"; // This will be updated during build
const CACHE_NAME = `peflora-storefront-${CACHE_VERSION}`;
const VERSION_CHECK_INTERVAL = 60000; // Check for updates every minute

// Install event - clear old caches and cache new assets
self.addEventListener("install", (event) => {
  console.log("[Service Worker] Installing...", CACHE_VERSION);

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        // Delete all old caches that don't match current version
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => {
              console.log("[Service Worker] Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }),
        );
      })
      .then(() => {
        // Skip waiting to activate immediately
        return self.skipWaiting();
      }),
  );
});

// Activate event - take control of all pages immediately
self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activating...", CACHE_VERSION);

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        // Delete all caches that don't match current version
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => {
              console.log(
                "[Service Worker] Deleting old cache on activate:",
                cacheName,
              );
              return caches.delete(cacheName);
            }),
        );
      })
      .then(() => {
        // Claim all clients immediately
        return self.clients.claim();
      }),
  );
});

// Fetch event - Smart caching strategy
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Skip cross-origin requests (except for images and fonts)
  if (
    url.origin !== location.origin &&
    !url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|woff|woff2|ttf|eot)$/i)
  ) {
    return;
  }

  // Don't cache images in service worker - let browser and API handle it
  // This ensures images always load fresh and fast
  if (
    url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|avif)$/i) ||
    url.pathname.startsWith("/api/images/") ||
    url.pathname.startsWith("/_next/image")
  ) {
    // Always fetch from network for images, don't interfere
    event.respondWith(
      fetch(request, {
        cache: "default", // Let browser handle caching
      }).catch(() => {
        // Only use cache as absolute last resort
        return caches.match(request).then((cachedResponse) => {
          return (
            cachedResponse ||
            new Response("Image unavailable", {
              status: 503,
              headers: { "Content-Type": "text/plain" },
            })
          );
        });
      }),
    );
    return;
  }

  // For other resources, use network-first with cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Clone the response
        const responseToCache = response.clone();

        // Cache successful responses (except API routes)
        if (response.status === 200 && !url.pathname.startsWith("/api/")) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }

        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Return offline page or error response
          return new Response("Offline", {
            status: 503,
            statusText: "Service Unavailable",
            headers: new Headers({
              "Content-Type": "text/plain",
            }),
          });
        });
      }),
  );
});

// Check for new version periodically
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "CHECK_VERSION") {
    checkForNewVersion();
  }
});

// Periodic version check
setInterval(() => {
  checkForNewVersion();
}, VERSION_CHECK_INTERVAL);

/**
 * Check for new version by fetching version API
 */
async function checkForNewVersion() {
  try {
    const response = await fetch("/api/version?t=" + Date.now(), {
      cache: "no-store",
    });

    if (!response.ok) {
      return;
    }

    const data = await response.json();
    const newVersion = data.version;

    if (newVersion && newVersion !== CACHE_VERSION) {
      console.log(
        "[Service Worker] New version detected:",
        newVersion,
        "Current:",
        CACHE_VERSION,
      );

      // Clear all caches
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map((cacheName) => {
          console.log("[Service Worker] Clearing cache:", cacheName);
          return caches.delete(cacheName);
        }),
      );

      // Notify all clients about the update
      const clients = await self.clients.matchAll();
      clients.forEach((client) => {
        client.postMessage({
          type: "NEW_VERSION_AVAILABLE",
          version: newVersion,
          oldVersion: CACHE_VERSION,
        });
      });

      // Unregister this service worker
      self.registration.unregister().then(() => {
        // Reload all pages
        clients.forEach((client) => {
          client.navigate(client.url);
        });
      });
    }
  } catch (error) {
    console.error("[Service Worker] Error checking version:", error);
  }
}

// Listen for skip waiting
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
