const CACHE_NAME = "color-corner-v72";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.webmanifest",
  "./icons/icon-192.svg",
  "./icons/icon-512.svg",
  "./assets/forest/forest-sprites-clean.png",
  "./assets/forest/stickers-v2/star-fairy.png",
  "./assets/forest/stickers-v2/flower-fairy.png",
  "./assets/forest/stickers-v2/magic-mushrooms.png",
  "./assets/forest/stickers-v2/mushroom-cottage.png",
  "./assets/forest/stickers-v2/forest-frog.png",
  "./assets/forest/stickers-v2/lily-frog.png",
  "./assets/forest/stickers-v2/moon-ferns.png",
  "./assets/forest/stickers-v2/glow-ferns.png",
  "./assets/forest/enchanted-background.png",
  "./assets/forest/enchanted-background-landscape.png",
  "./assets/mythical/mythical-creatures-sprites-v3.png",
  "./assets/mythical/moon-unicorn-v2.png",
  "./assets/mythical/tiny-fairy-v2.png",
  "./assets/mythical/aurora-phoenix.png",
  "./assets/mythical/background-moonlight.png",
  "./assets/mythical/background-enchanted.png",
  "./assets/mythical/background-fairy-glow.png",
  "./assets/mythical/background-mushroom-magic.png",
  "./assets/mythical/background-crystal-dream.png",
  "./assets/coloring-pages/anime-kitten.png",
  "./assets/coloring-pages/anime-artist.png",
  "./assets/coloring-pages/anime-moon-puppy.png",
  "./assets/coloring-pages/anime-dragon.png",
  "./assets/coloring-pages/animal-hat-cat.png",
  "./assets/coloring-pages/animal-hat-bunny.png",
  "./assets/coloring-pages/animal-magic-kitten.png",
  "./assets/coloring-pages/animal-fox-tea.png",
  "./assets/coloring-pages/animal-bunny-artist.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  if (event.request.mode === "navigate" || new URL(event.request.url).pathname.endsWith("/app.js")) {
    event.respondWith(
      fetch(event.request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      }).catch(() => caches.match(event.request).then((cached) => cached || caches.match("./index.html")))
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
      return response;
    }).catch(() => caches.match("./index.html")))
  );
});
