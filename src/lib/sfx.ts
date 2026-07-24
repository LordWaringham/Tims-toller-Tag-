/**
 * Geräusche werden direkt im Browser erzeugt (Web Audio API).
 * Keine Audiodateien, nichts wird nachgeladen, funktioniert offline.
 *
 * Alle Klänge liegen auf einer pentatonischen Tonleiter — dadurch klingt
 * jede Kombination harmonisch, egal in welcher Reihenfolge getippt wird.
 */

import { isMuted } from "./voice";

let ctx: AudioContext | null = null;

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** Aus einer Nutzergeste heraus aufrufen, damit Töne auf iOS erlaubt sind. */
export function unlockSfx() {
  ac();
}

/** C-Dur-Pentatonik über zwei Oktaven. */
const PENTATONIC = [
  261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66,
];

type ToneOptions = {
  freq: number;
  duration?: number;
  type?: OscillatorType;
  gain?: number;
  delay?: number;
  attack?: number;
  glideTo?: number;
};

function tone({
  freq,
  duration = 0.3,
  type = "sine",
  gain = 0.18,
  delay = 0,
  attack = 0.01,
  glideTo,
}: ToneOptions) {
  const c = ac();
  if (!c || isMuted()) return;
  const t0 = c.currentTime + delay;
  const osc = c.createOscillator();
  const env = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, t0 + duration);
  env.gain.setValueAtTime(0.0001, t0);
  env.gain.exponentialRampToValueAtTime(gain, t0 + attack);
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(env).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
}

function noise(duration: number, filterFreq: number, gain = 0.15, delay = 0, sweepTo?: number) {
  const c = ac();
  if (!c || isMuted()) return;
  const t0 = c.currentTime + delay;
  const frames = Math.floor(c.sampleRate * duration);
  const buffer = c.createBuffer(1, frames, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buffer;
  const filter = c.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(filterFreq, t0);
  if (sweepTo) filter.frequency.exponentialRampToValueAtTime(sweepTo, t0 + duration);
  filter.Q.value = 1.2;
  const env = c.createGain();
  env.gain.setValueAtTime(0.0001, t0);
  env.gain.exponentialRampToValueAtTime(gain, t0 + 0.02);
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  src.connect(filter).connect(env).connect(c.destination);
  src.start(t0);
  src.stop(t0 + duration);
}

/** Weiches Blubb beim Aufnehmen eines Gegenstands. */
export function pop() {
  tone({ freq: 440, glideTo: 880, duration: 0.12, type: "sine", gain: 0.14 });
}

/** Zufriedenes Einrasten. */
export function place() {
  tone({ freq: 392, duration: 0.18, type: "triangle", gain: 0.16 });
  tone({ freq: 523.25, duration: 0.22, type: "sine", gain: 0.12, delay: 0.05 });
}

/** Aufsteigende Glocke — der Index bestimmt die Tonhöhe. */
export function chime(step = 0) {
  const freq = PENTATONIC[Math.min(step, PENTATONIC.length - 1)];
  tone({ freq, duration: 0.5, type: "sine", gain: 0.18 });
  tone({ freq: freq * 2, duration: 0.35, type: "sine", gain: 0.06 });
}

/** Funkeln. */
export function sparkle() {
  for (let i = 0; i < 3; i++) {
    tone({
      freq: PENTATONIC[7 + i],
      duration: 0.25,
      type: "sine",
      gain: 0.08,
      delay: i * 0.06,
    });
  }
}

/** Platsch in die Pfütze. */
export function splash() {
  noise(0.35, 900, 0.22, 0, 300);
  tone({ freq: 300, glideTo: 120, duration: 0.25, type: "sine", gain: 0.12 });
  noise(0.5, 2500, 0.07, 0.06, 1200);
}

/** Gießen — kurzer Wasserstrahl, wird wiederholt aufgerufen. */
export function water() {
  noise(0.28, 1800, 0.05, 0, 2600);
}

/** Dumpfes Setzen eines Bausteins. */
export function thud() {
  tone({ freq: 160, glideTo: 90, duration: 0.16, type: "triangle", gain: 0.2 });
  noise(0.08, 400, 0.06);
}

/** Kleine Erfolgsfanfare für ein abgeschlossenes Spiel. */
export function fanfare() {
  [0, 2, 4, 5].forEach((step, i) => {
    tone({
      freq: PENTATONIC[step + 3],
      duration: 0.45,
      type: "triangle",
      gain: 0.16,
      delay: i * 0.13,
    });
  });
  sparkleBurst();
}

function sparkleBurst() {
  for (let i = 0; i < 6; i++) {
    tone({
      freq: PENTATONIC[6 + (i % 6)],
      duration: 0.3,
      type: "sine",
      gain: 0.05,
      delay: 0.5 + i * 0.07,
    });
  }
}

/** Freundliches „hmm?" — nie tadelnd, nur ein Hinweis. */
export function nope() {
  tone({ freq: 330, glideTo: 294, duration: 0.22, type: "sine", gain: 0.1 });
}

/** Schafsblöken. */
export function bleat() {
  const c = ac();
  if (!c || isMuted()) return;
  const t0 = c.currentTime;
  const osc = c.createOscillator();
  const vibrato = c.createOscillator();
  const vibratoGain = c.createGain();
  const filter = c.createBiquadFilter();
  const env = c.createGain();

  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(420, t0);
  osc.frequency.exponentialRampToValueAtTime(330, t0 + 0.5);

  vibrato.frequency.setValueAtTime(22, t0); // schnelles Meckern
  vibratoGain.gain.setValueAtTime(28, t0);
  vibrato.connect(vibratoGain).connect(osc.frequency);

  filter.type = "bandpass";
  filter.frequency.setValueAtTime(1100, t0);
  filter.Q.value = 4;

  env.gain.setValueAtTime(0.0001, t0);
  env.gain.exponentialRampToValueAtTime(0.1, t0 + 0.05);
  env.gain.setValueAtTime(0.1, t0 + 0.35);
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.55);

  osc.connect(filter).connect(env).connect(c.destination);
  osc.start(t0);
  vibrato.start(t0);
  osc.stop(t0 + 0.6);
  vibrato.stop(t0 + 0.6);
}

/** Flügelschlag. */
export function flutter() {
  noise(0.18, 700, 0.05, 0, 1400);
}

/** Weicher Gong für die Gute-Nacht-Station. */
export function nightBell(step = 0) {
  const freq = PENTATONIC[Math.min(step, PENTATONIC.length - 1)];
  tone({ freq, duration: 1.6, type: "sine", gain: 0.14, attack: 0.04 });
  tone({ freq: freq * 1.5, duration: 1.2, type: "sine", gain: 0.05, attack: 0.04 });
}
