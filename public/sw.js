/**
 * Service Worker — damit das Spiel auch ohne Internet läuft.
 *
 * Strategie: alles, was einmal geladen wurde, bleibt im Cache. Beim nächsten
 * Start kommt es sofort aus dem Cache, und im Hintergrund wird nachgesehen,
 * ob es etwas Neues gibt (stale-while-revalidate).
 */

const CACHE = "tims-toller-tag-v1";

/** Die Buchbilder und Symbole vorab laden — sie ändern sich nie. */
const VORAB = [
  "/",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/scenes/cover.webp",
  "/scenes/aufwachen.webp",
  "/scenes/anziehen.webp",
  "/scenes/fruehstueck.webp",
  "/scenes/turm.webp",
  "/scenes/aufraeumen.webp",
  "/scenes/blumen.webp",
  "/scenes/kekse.webp",
  "/scenes/pfuetzen.webp",
  "/scenes/schafe.webp",
  "/scenes/schmetterlinge.webp",
  "/scenes/gutenacht.webp",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(VORAB))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((namen) =>
        Promise.all(namen.filter((n) => n !== CACHE).map((n) => caches.delete(n))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Seitenaufrufe: erst Netz, sonst der zwischengespeicherte Startbildschirm.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((antwort) => {
          const kopie = antwort.clone();
          caches.open(CACHE).then((c) => c.put(request, kopie));
          return antwort;
        })
        .catch(() => caches.match(request).then((t) => t || caches.match("/"))),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((treffer) => {
      const ausDemNetz = fetch(request)
        .then((antwort) => {
          if (antwort && antwort.status === 200) {
            const kopie = antwort.clone();
            caches.open(CACHE).then((c) => c.put(request, kopie));
          }
          return antwort;
        })
        .catch(() => treffer);
      return treffer || ausDemNetz;
    }),
  );
});
