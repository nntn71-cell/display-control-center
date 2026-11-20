const CACHE_NAME = "display-control-center-shell-v2";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-512-maskable.png",
  "./icons/apple-touch-icon.png"
];

// Safari refuses to show a cached response that came from a redirect, so rebuild it as a plain response.
function clean(response) {
  if (!response || !response.redirected) return response;
  return response.blob().then(body => new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers
  }));
}

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      // Add files one by one so a single missing icon cannot stop the service worker from installing.
      .then(cache => Promise.all(APP_SHELL.map(path => cache.add(path).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key.startsWith("display-control-center-") && key !== CACHE_NAME)
            .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);

  // Never cache Supabase, authentication, commands, or other cross-origin requests.
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // Network-first for page navigations so dashboard updates appear promptly.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok && !response.redirected) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put("./index.html", copy));
          }
          return response;
        })
        .catch(() => caches.match("./index.html").then(clean))
    );
    return;
  }

  // Cache only the known static PWA shell files.
  if (APP_SHELL.some(path => new URL(path, self.location.href).pathname === url.pathname)) {
    event.respondWith(
      caches.match(request).then(cached => cached || fetch(request))
    );
  }
});
