/**
 * Sprachausgabe.
 *
 * Bevorzugt eine echte Aufnahme aus /public/audio (siehe SPRECHTEXTE.md).
 * Fehlt die Datei, liest die deutsche Stimme des Geräts den Text vor.
 */

import { LINES, type LineId } from "./lines";

type Manifest = Record<string, string>;

let manifest: Manifest | null = null;
let manifestLoading: Promise<Manifest> | null = null;

let current: HTMLAudioElement | null = null;
let muted = false;
let unlocked = false;

/**
 * Zählt jede Sprechanforderung mit.
 *
 * Zwischen dem Aufruf von speak() und dem tatsächlichen Abspielen liegt ein
 * await (das Manifest wird geladen). Ohne diesen Zähler könnten zwei kurz
 * hintereinander angeforderte Sätze beide durch dieses Fenster schlüpfen und
 * gleichzeitig erklingen. Es gewinnt immer der zuletzt angeforderte Satz.
 */
let anforderung = 0;

const cache = new Map<string, HTMLAudioElement>();
const listeners = new Set<(m: boolean) => void>();

/** Lädt einmalig die Liste der vorhandenen Aufnahmen. */
function loadManifest(): Promise<Manifest> {
  if (manifest) return Promise.resolve(manifest);
  if (manifestLoading) return manifestLoading;
  manifestLoading = fetch("/audio/manifest.json")
    .then((r) => (r.ok ? r.json() : {}))
    .catch(() => ({}))
    .then((m: Manifest) => {
      manifest = m ?? {};
      return manifest;
    });
  return manifestLoading;
}

/** Muss einmal aus einer echten Nutzergeste heraus laufen (iOS/Safari). */
export function unlockAudio() {
  if (unlocked) return;
  unlocked = true;
  void loadManifest();
  try {
    const s = window.speechSynthesis;
    if (s) {
      // Stille Äußerung schaltet die Sprachausgabe frei.
      const u = new SpeechSynthesisUtterance("");
      u.volume = 0;
      s.speak(u);
      s.cancel();
    }
  } catch {
    /* egal */
  }
}

export function isMuted() {
  return muted;
}

export function setMuted(value: boolean) {
  muted = value;
  if (muted) stopSpeaking();
  if (typeof localStorage !== "undefined") {
    localStorage.setItem("ttt-muted", muted ? "1" : "0");
  }
  listeners.forEach((l) => l(muted));
}

export function restoreMuted() {
  if (typeof localStorage === "undefined") return;
  const gespeichert = localStorage.getItem("ttt-muted") === "1";
  if (gespeichert === muted) return;
  muted = gespeichert;
  listeners.forEach((l) => l(muted));
}

/** Für useSyncExternalStore: anmelden und aktuellen Stand abfragen. */
export function subscribeMuted(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export const getMutedSnapshot = () => muted;
export const getMutedServerSnapshot = () => false;

/**
 * Bricht das Sprechen ab.
 *
 * `auchGeplante` verwirft zusätzlich Sätze, die noch auf das Manifest warten —
 * nötig beim Verlassen einer Station, damit dort nicht nachträglich noch etwas
 * herausrutscht.
 */
export function stopSpeaking(auchGeplante = false) {
  if (auchGeplante) anforderung++;
  if (current) {
    current.pause();
    current.currentTime = 0;
    current = null;
  }
  try {
    window.speechSynthesis?.cancel();
  } catch {
    /* egal */
  }
}

/** Sucht eine möglichst natürliche deutsche Stimme. */
function pickGermanVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis?.getVoices() ?? [];
  if (!voices.length) return null;
  const german = voices.filter((v) => v.lang?.toLowerCase().startsWith("de"));
  if (!german.length) return null;
  // Bevorzugt hochwertige Systemstimmen.
  const preferred = ["anna", "petra", "markus", "yannick", "google", "premium", "enhanced"];
  for (const name of preferred) {
    const hit = german.find((v) => v.name.toLowerCase().includes(name));
    if (hit) return hit;
  }
  return german[0];
}

function speakWithTts(text: string): Promise<void> {
  return new Promise((resolve) => {
    const synth = window.speechSynthesis;
    if (!synth) return resolve();
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "de-DE";
    u.rate = 0.92; // etwas langsamer für Kinderohren
    u.pitch = 1.05;
    const v = pickGermanVoice();
    if (v) u.voice = v;
    u.onend = () => resolve();
    u.onerror = () => resolve();
    synth.speak(u);
    // Sicherheitsnetz: manche Browser feuern onend nicht zuverlässig.
    const ms = Math.min(15000, 1200 + text.length * 90);
    setTimeout(resolve, ms);
  });
}

function playRecording(file: string): Promise<void> {
  return new Promise((resolve) => {
    let audio = cache.get(file);
    if (!audio) {
      audio = new Audio(`/audio/${file}`);
      audio.preload = "auto";
      cache.set(file, audio);
    }
    current = audio;
    audio.currentTime = 0;
    audio.onended = () => resolve();
    audio.onerror = () => resolve();
    audio.play().catch(() => resolve());
  });
}

/**
 * Spricht einen Satz. Löst auf, wenn er zu Ende ist.
 * Ein neuer Satz unterbricht den laufenden.
 */
export async function speak(id: LineId): Promise<void> {
  if (muted) return;
  const meine = ++anforderung;
  stopSpeaking();
  const text = LINES[id];
  if (!text) return;

  const m = await loadManifest();
  // Während des Ladens kann ein neuer Satz angefordert worden sein — dann
  // gehört die Stimme ihm, und dieser hier schweigt.
  if (muted || meine !== anforderung) return;

  const file = m[id];
  if (file) return playRecording(file);
  return speakWithTts(text);
}

/**
 * Spricht nur, wenn es dafür eine echte Aufnahme gibt.
 *
 * Für Sätze, die nachträglich dazugekommen sind — etwa die Begrüßung mit dem
 * Namen. Die Gerätestimme mitten in einer sonst eingesprochenen Umgebung
 * klingt wie ein Fremdkörper; lieber schweigt das Spiel, bis die Aufnahme da
 * ist. Die IDs stehen trotzdem in SPRECHTEXTE.md und im Aufnahmestudio.
 */
export async function speakWennAufgenommen(id: string): Promise<void> {
  if (muted) return;
  /*
   * Die Nummer wird vor dem Warten gezogen, genau wie in speak().
   *
   * Vorher wurde sie erst danach vergeben — damit gewann die ältere
   * Anforderung: Der Gruß „Hallo Luise!" von der Namensauswahl überholte den
   * Einstiegssatz der Station, und die Station begann stumm.
   */
  const meine = ++anforderung;
  const m = await loadManifest();
  if (muted || meine !== anforderung) return;
  const datei = m[id];
  if (!datei) return;
  stopSpeaking();
  return playRecording(datei);
}

/** Sätze nacheinander, mit kleiner Pause dazwischen. */
export async function speakSequence(ids: LineId[], gapMs = 250): Promise<void> {
  for (const id of ids) {
    const vorher = anforderung + 1;
    await speak(id);
    // Hat jemand dazwischengefunkt, bricht die ganze Folge ab.
    if (muted || anforderung !== vorher) return;
    await new Promise((r) => setTimeout(r, gapMs));
    if (anforderung !== vorher) return;
  }
}
