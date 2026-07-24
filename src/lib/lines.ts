/**
 * Alle gesprochenen Sätze des Spiels.
 *
 * Die ID ist gleichzeitig der Dateiname der Aufnahme:
 *   ID "s03-erdbeeren"  ->  public/audio/s03-erdbeeren.mp3
 *
 * Solange keine Aufnahme vorhanden ist, liest die Gerätestimme den Text vor.
 * Siehe SPRECHTEXTE.md für die Liste zum Einsprechen.
 */

export const LINES = {
  // ---------------------------------------------------------------- Allgemein
  titel: "Tims toller Tag",
  willkommen: "Hallo! Ich bin Tim. Komm, wir erleben zusammen einen tollen Tag!",
  "lob-1": "Super gemacht!",
  "lob-2": "Das hast du toll gemacht!",
  "lob-3": "Prima!",
  "lob-4": "Wunderbar!",
  "lob-5": "Klasse!",
  sticker: "Dafür bekommst du einen Sticker.",
  gesperrt: "Das kommt gleich. Wir machen alles der Reihe nach.",
  finale: "Das war ein toller Tag. Bis morgen!",
  "finale-stolz": "Du hast Tim durch den ganzen Tag begleitet. Schau dir deine Sticker an!",

  // Zahlen zum Mitzählen
  "zahl-1": "eins",
  "zahl-2": "zwei",
  "zahl-3": "drei",
  "zahl-4": "vier",
  "zahl-5": "fünf",
  "zahl-6": "sechs",
  "zahl-7": "sieben",
  "zahl-8": "acht",
  "zahl-9": "neun",
  "zahl-10": "zehn",

  // ------------------------------------------------------------ 1 · Aufwachen
  "s01-intro": "Guten Morgen! Die Sonne geht auf. Tippe auf die Sonne.",
  "s01-sonne": "Die Sonne scheint ins Zimmer.",
  "s01-teddy": "Jetzt wecken wir Teddy. Tippe auf den Teddy.",
  "s01-teddy-wach": "Guten Morgen, Teddy!",
  "s01-tim": "Und jetzt Tim. Tippe auf Tim!",
  "s01-fertig": "Aufstehen, Teddy! Der Tag beginnt.",

  // ------------------------------------------------------------- 2 · Anziehen
  "s02-intro": "Was soll Tim heute anziehen? Er hat so viele Sachen zur Auswahl.",
  "s02-oberteil": "Zieh Tim zuerst ein Oberteil an.",
  "s02-hose": "Und jetzt eine Hose.",
  "s02-buch": "Ein grünes T-Shirt und eine blaue Hose. Genau wie im Buch!",
  "s02-fertig": "Fertig angezogen! Das sieht gut aus.",

  // ------------------------------------------------------------ 3 · Frühstück
  "s03-intro": "Tim hat einen riesigen Hunger. Füll seine Schüssel mit Früchten!",
  "s03-erdbeeren": "Tim möchte drei Erdbeeren.",
  "s03-bananen": "Jetzt zwei Bananen, bitte.",
  "s03-heidelbeeren": "Und zum Schluss fünf Heidelbeeren.",
  "s03-fertig": "Hmmm, lecker!",

  // ----------------------------------------------------------- 4 · Turm bauen
  "s04-intro": "Bau mit Tim einen riesigen Turm. Zieh die Bausteine nach oben.",
  "s04-weiter": "Noch ein Stein!",
  "s04-fertig": "Schau mal, Teddy! Fast so hoch wie der Elbtower!",

  // ------------------------------------------------------------ 5 · Aufräumen
  "s05-intro": "Oh, was für ein Chaos! Räum mit Tim auf.",
  "s05-erklaerung": "Jedes Spielzeug kommt in seine eigene Kiste.",
  "s05-falsch": "Hmm, das passt hier nicht. Probier eine andere Kiste!",
  "s05-fertig": "Jedes Ding hat seinen Platz!",

  // --------------------------------------------------------- 6 · Blumen gießen
  "s06-intro": "Die Blumen haben Durst. Halt die Gießkanne über eine Blume.",
  "s06-blueht": "Schau, sie blüht wieder!",
  "s06-fertig": "Jetzt sehen die Blumen wieder frisch aus.",

  // ---------------------------------------------------------- 7 · Kekse backen
  "s07-intro": "In der Küche hilft Tim seiner Mama beim Backen.",
  "s07-zutaten": "Erst die Zutaten in die Schüssel. Tippe auf Mehl, Ei und Zucker.",
  "s07-ruehren": "Jetzt wird gerührt! Dreh den Löffel im Kreis.",
  "s07-ausstechen": "Und jetzt Kekse ausstechen. Zieh die Förmchen auf den Teig.",
  "s07-fertig": "Die Kekse sind fertig! Die ganze Familie freut sich.",

  // -------------------------------------------------------------- 8 · Pfützen
  "s08-intro": "Draußen regnet es. Aber Tim hat seine Gummistiefel an!",
  "s08-erklaerung": "Tippe auf eine Pfütze, dann springt Tim hinein.",
  "s08-platsch": "Plitsch, platsch!",
  "s08-fertig": "Das macht Spaß!",

  // --------------------------------------------------------------- 9 · Schafe
  "s09-intro": "Schau, eine Herde flauschiger Schafe! Tippe jedes Schaf an und zähl mit.",
  "s09-streicheln": "Jetzt darfst du sie streicheln. Streich mit dem Finger über die Schafe.",
  "s09-maeh": "Määäh!",
  "s09-fertig": "Zehn Schafe! Sie genießen dein Streicheln.",

  // ------------------------------------------------------- 10 · Schmetterlinge
  "s10-intro": "So viele bunte Schmetterlinge! Bring jeden zu seiner Blume.",
  "s10-erklaerung": "Der Schmetterling mag die Blume mit der gleichen Farbe.",
  "s10-rot": "Der rote Schmetterling sucht die rote Blume.",
  "s10-gelb": "Der gelbe Schmetterling sucht die gelbe Blume.",
  "s10-blau": "Der blaue Schmetterling sucht die blaue Blume.",
  "s10-lila": "Der lila Schmetterling sucht die lila Blume.",
  "s10-orange": "Der orange Schmetterling sucht die orange Blume.",
  "s10-fertig": "Was für schöne Schmetterlinge!",

  // ----------------------------------------------------------- 11 · Gute Nacht
  "s11-intro": "Es ist Abend. Das Licht der Sterne funkelt durch Tims Fenster.",
  "s11-erklaerung": "Tippe die Sterne an.",
  "s11-baer": "Schau, ein kleiner Bär aus Sternen!",
  "s11-decke": "Zieh Tim die Decke hoch.",
  "s11-fertig": "Gute Nacht, kleiner Teddy. Das war ein toller Tag. Bis morgen!",
} as const;

export type LineId = keyof typeof LINES;

export const LOB_IDS: LineId[] = ["lob-1", "lob-2", "lob-3", "lob-4", "lob-5"];

export function zahl(n: number): LineId | null {
  return n >= 1 && n <= 10 ? (`zahl-${n}` as LineId) : null;
}
