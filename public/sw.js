const CACHE_NAME = "profix-tech-v1";
const OFFLINE_URLS = [
  "/techportal",
  "/manifest.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);

  // API запросы — только сеть
  if (url.hostname === "functions.poehali.dev") return;

  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return res;
      })
      .catch(() => caches.match(event.request).then((r) => r || caches.match("/techportal")))
  );
});

// Push уведомления
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "ProFiX";
  const options = {
    body: data.body || "Новое уведомление",
    icon: "https://cdn.poehali.dev/files/14883a12-7574-4223-bfd4-68dc3e490534.png",
    badge: "https://cdn.poehali.dev/files/14883a12-7574-4223-bfd4-68dc3e490534.png",
    data: { url: data.url || "/techportal" },
    vibrate: [200, 100, 200],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((windowClients) => {
      const url = event.notification.data?.url || "/techportal";
      for (const client of windowClients) {
        if (client.url.includes("/techportal") && "focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
