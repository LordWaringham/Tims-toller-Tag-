/**
 * Service Worker — damit das Spiel auch ohne Internet läuft.
 *
 * Strategie: alles, was einmal geladen wurde, bleibt im Cache. Beim nächsten
 * Start kommt es sofort aus dem Cache, und im Hintergrund wird nachgesehen,
 * ob es etwas Neues gibt (stale-while-revalidate).
 */

const CACHE = "tims-toller-tag-v2";

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

/**
 * Die Sprachaufnahmen hinterher ablegen.
 *
 * Sie sind der Grund, warum das Spiel überhaupt spricht — ohne sie wäre es
 * offline stumm. Welche es gibt, steht im Manifest, das beim Bauen entsteht.
 * Bewusst nach dem Aktivieren und Datei für Datei: Es sind einige Megabyte,
 * und eine einzelne fehlende Aufnahme darf nicht alles scheitern lassen.
 */
async function aufnahmenAblegen() {
  try {
    const cache = await caches.open(CACHE);
    const antwort = await fetch("/audio/manifest.json", { cache: "no-cache" });
    if (!antwort.ok) return;
    await cache.put("/audio/manifest.json", antwort.clone());
    const manifest = await antwort.json();

    for (const datei of Object.values(manifest)) {
      const pfad = `/audio/${datei}`;
      try {
        if (await cache.match(pfad)) continue;
        const a = await fetch(pfad);
        if (a.ok) await cache.put(pfad, a);
      } catch {
        /* eine fehlende Aufnahme ist kein Grund aufzugeben */
      }
    }
  } catch {
    /* ohne Netz eben beim nächsten Start */
  }
}

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((namen) =>
        Promise.all(namen.filter((n) => n !== CACHE).map((n) => caches.delete(n))),
      )
      .then(() => self.clients.claim())
      .then(() => aufnahmenAblegen()),
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

  // Sprachaufnahmen zuerst aus dem Netz holen.
  //
  // Wer neue Aufnahmen hochlädt, will sie sofort hören. Mit dem sonst
  // üblichen "erst Cache, dann nachladen" käme beim ersten Start noch die
  // alte Liste — und der frisch eingesprochene Satz bliebe stumm.
  if (url.pathname.startsWith("/audio/")) {
    event.respondWith(
      fetch(request)
        .then((antwort) => {
          if (antwort && antwort.status === 200) {
            const kopie = antwort.clone();
            caches.open(CACHE).then((c) => c.put(request, kopie));
          }
          return antwort;
        })
        .catch(() => caches.match(request)),
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
