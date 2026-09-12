const CACHE_NAME = "color-corner-v82";
const PREVIEW_URL = new URL("preview/", self.registration.scope);
function isPreviewRequest(request) {
  const url = new URL(request.url);
  return url.origin === PREVIEW_URL.origin &&
    (url.pathname === PREVIEW_URL.pathname.slice(0, -1) || url.pathname.startsWith(PREVIEW_URL.pathname));
}
const ASSETS = [
  "./assets/optimized/thumbnails/anime-moon-puppy.webp",
  "./assets/optimized/thumbnails/anime-kitten.webp",
  "./assets/optimized/thumbnails/anime-dragon.webp",
  "./assets/optimized/thumbnails/anime-artist.webp",
  "./assets/optimized/thumbnails/animal-magic-kitten.webp",
  "./assets/optimized/thumbnails/animal-hat-cat.webp",
  "./assets/optimized/thumbnails/animal-hat-bunny.webp",
  "./assets/optimized/thumbnails/animal-fox-tea.webp",
  "./assets/optimized/thumbnails/animal-bunny-artist.webp",
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./styles.css?v=82",
  "./app.js?v=82",
  "./manifest.webmanifest",
  "./icons/icon-192.svg",
  "./icons/icon-512.svg",
  "./assets/forest/stickers-v2/star-fairy.png",
  "./assets/forest/stickers-v2/flower-fairy.png",
  "./assets/forest/stickers-v2/magic-mushrooms.png",
  "./assets/forest/stickers-v2/mushroom-cottage.png",
  "./assets/forest/stickers-v2/forest-frog.png",
  "./assets/forest/stickers-v2/lily-frog.png",
  "./assets/forest/stickers-v2/moon-ferns.png",
  "./assets/forest/stickers-v2/glow-ferns.png",
  "./assets/optimized/backgrounds/enchanted-background-landscape.webp",
  "./assets/mythical/mythical-creatures-sprites-v3.png",
  "./assets/mythical/moon-unicorn-v2.png",
  "./assets/mythical/tiny-fairy-v2.png",
  "./assets/mythical/aurora-phoenix.png",
  "./assets/optimized/backgrounds/background-moonlight.webp",
  "./assets/optimized/backgrounds/background-enchanted.webp",
  "./assets/optimized/backgrounds/background-fairy-glow.webp",
  "./assets/optimized/backgrounds/background-mushroom-magic.webp",
  "./assets/optimized/backgrounds/background-crystal-dream.webp",
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
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map(async (key) => {
        if (key !== CACHE_NAME && key.startsWith("color-corner-")) return caches.delete(key);
        const cache = await caches.open(key);
        const requests = await cache.keys();
        await Promise.all(requests.filter(isPreviewRequest).map((request) => cache.delete(request)));
      }));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  // Preview always uses the network, including navigations and offline errors.
  // Never fall back to the live app or cache any preview response.
  if (isPreviewRequest(event.request)) return;
  if (event.request.method !== "GET") return;
  if (event.request.mode === "navigate" || new URL(event.request.url).pathname.endsWith("/app.js")) {
    event.respondWith(
      fetch(event.request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      }).catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        return event.request.mode === "navigate"
          ? (await caches.match("./index.html")) || Response.error()
          : Response.error();
      })
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
      return response;
    }).catch(() => Response.error()))
  );
});
