"use client";

/**
 * Aufnahmen werden im Browser gespeichert (IndexedDB), nicht im Arbeitsspeicher.
 *
 * 73 Sätze spricht niemand in einem Rutsch ein. Deshalb überstehen die
 * Aufnahmen das Schließen des Fensters und man kann jederzeit weitermachen.
 */

const DB_NAME = "tims-toller-tag-aufnahmen";
const SPEICHER = "aufnahmen";

export interface Aufnahme {
  /** Die ID des Satzes, z. B. "s01-intro". */
  id: string;
  blob: Blob;
  /** Dateiendung passend zum Aufnahmeformat, z. B. "webm" oder "m4a". */
  endung: string;
  dauer: number;
  zeitpunkt: number;
}

function oeffnen(): Promise<IDBDatabase> {
  return new Promise((erfuellen, ablehnen) => {
    const anfrage = indexedDB.open(DB_NAME, 1);
    anfrage.onupgradeneeded = () => {
      const db = anfrage.result;
      if (!db.objectStoreNames.contains(SPEICHER)) {
        db.createObjectStore(SPEICHER, { keyPath: "id" });
      }
    };
    anfrage.onsuccess = () => erfuellen(anfrage.result);
    anfrage.onerror = () => ablehnen(anfrage.error);
  });
}

export async function alleLaden(): Promise<Map<string, Aufnahme>> {
  const db = await oeffnen();
  return new Promise((erfuellen, ablehnen) => {
    const anfrage = db.transaction(SPEICHER, "readonly").objectStore(SPEICHER).getAll();
    anfrage.onsuccess = () => {
      const karte = new Map<string, Aufnahme>();
      for (const a of anfrage.result as Aufnahme[]) karte.set(a.id, a);
      erfuellen(karte);
    };
    anfrage.onerror = () => ablehnen(anfrage.error);
  });
}

export async function sichern(aufnahme: Aufnahme): Promise<void> {
  const db = await oeffnen();
  return new Promise((erfuellen, ablehnen) => {
    const t = db.transaction(SPEICHER, "readwrite");
    t.objectStore(SPEICHER).put(aufnahme);
    t.oncomplete = () => erfuellen();
    t.onerror = () => ablehnen(t.error);
  });
}

export async function entfernen(id: string): Promise<void> {
  const db = await oeffnen();
  return new Promise((erfuellen, ablehnen) => {
    const t = db.transaction(SPEICHER, "readwrite");
    t.objectStore(SPEICHER).delete(id);
    t.oncomplete = () => erfuellen();
    t.onerror = () => ablehnen(t.error);
  });
}

export async function alleEntfernen(): Promise<void> {
  const db = await oeffnen();
  return new Promise((erfuellen, ablehnen) => {
    const t = db.transaction(SPEICHER, "readwrite");
    t.objectStore(SPEICHER).clear();
    t.oncomplete = () => erfuellen();
    t.onerror = () => ablehnen(t.error);
  });
}

/**
 * Welches Aufnahmeformat kann dieser Browser?
 * Chrome und Firefox liefern WebM/Opus, Safari liefert MP4/AAC — beides
 * versteht das Spiel.
 */
export function besteAufnahmeArt(): { mimeType: string; endung: string } {
  const kandidaten: { mimeType: string; endung: string }[] = [
    { mimeType: "audio/webm;codecs=opus", endung: "webm" },
    { mimeType: "audio/webm", endung: "webm" },
    { mimeType: "audio/mp4", endung: "m4a" },
    { mimeType: "audio/ogg;codecs=opus", endung: "ogg" },
  ];
  for (const k of kandidaten) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(k.mimeType)) {
      return k;
    }
  }
  return { mimeType: "", endung: "webm" };
}
