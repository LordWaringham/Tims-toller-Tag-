"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { StationRahmen, type StationProps } from "@/components/StationRahmen";
import { Tippziel } from "@/components/Tippziel";
import { GeschlossenesAuge } from "@/components/GeschlossenesAuge";
import { ERFOLGSPAUSE, STATIONS } from "@/lib/stations";
import type { LineId } from "@/lib/lines";
import * as sfx from "@/lib/sfx";
import * as voice from "@/lib/voice";

const STATION = STATIONS[10];

/**
 * Der kleine Bär — groß und mitten auf der Bühne.
 *
 * Die Sterne standen erst klein am rechten Rand, damit sie Tims Gesicht frei
 * lassen. Groß in der Mitte sind sie das, was sie sein sollen: das Bild, das
 * das Kind zusammensetzt. Die Abstände sind so gewählt, dass sich bei 12 cqw
 * keine zwei Tippflächen überlappen — sonst trifft ein Tipp den Nachbarn, und
 * ein Stern bleibt für immer dunkel.
 */
const STERNE = [
  { id: 0, x: 20, y: 58 },
  { id: 1, x: 32, y: 52 },
  { id: 2, x: 44, y: 46 },
  { id: 3, x: 57, y: 42 },
  { id: 4, x: 72, y: 46 },
  { id: 5, x: 70, y: 62 },
  { id: 6, x: 52, y: 59 },
];

const LINIEN: [number, number][] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [4, 5],
  [5, 6],
  [6, 3],
];

type Phase = "sterne" | "decke";

/**
 * Der ruhige Abschluss des Tages.
 * Bewusst langsam: leise Glocken, kein Konfetti bis zum Schluss — das Spiel
 * soll auch als Einschlafritual taugen.
 */
export function GuteNacht({ onGeschafft, onWeiter, onZurueck }: StationProps) {
  const [phase, setPhase] = useState<Phase>("sterne");
  const [leuchtend, setLeuchtend] = useState<number[]>([]);
  const [zugedeckt, setZugedeckt] = useState(false);
  const [fertig, setFertig] = useState(false);

  /*
   * Der Auftrag steht von Anfang an oben.
   *
   * Vorher hieß es zuerst nur „Es ist Abend …" — dass man die Sterne antippen
   * soll, erfuhr das Kind erst nach dem ersten Tipp. Jetzt steht der Auftrag
   * gleich da, und die Einleitung wird davor gesprochen.
   */
  const satz: LineId = phase === "sterne" ? "s11-erklaerung" : "s11-decke";

  useEffect(() => {
    void voice.speakSequence(["s11-intro", "s11-erklaerung"], 250);
  }, []);

  const alleSterne = leuchtend.length >= STERNE.length;

  const sternAntippen = (id: number) => {
    if (leuchtend.includes(id)) return;
    const neu = [...leuchtend, id];
    setLeuchtend(neu);
    sfx.nightBell(neu.length + 1);

    if (neu.length >= STERNE.length) {
      setTimeout(async () => {
        await voice.speak("s11-baer");
        setPhase("decke");
      }, 900);
    }
  };

  const zudecken = () => {
    if (zugedeckt) return;
    setZugedeckt(true);
    sfx.nightBell(0);
    onGeschafft();
    setTimeout(() => setFertig(true), ERFOLGSPAUSE + 400);
  };

  return (
    <StationRahmen
      station={STATION}
      satz={satz}
      fertig={fertig}
      onWeiter={onWeiter}
      onZurueck={onZurueck}
      abschlussSatz="s11-fertig"
      weiterText="Das war ein toller Tag"
      helligkeit={zugedeckt ? 0.6 : 0.44}
      dunkel
      stummerRahmen={phase === "sterne"}
    >
      {/* Nachtblau über der Szene */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-10"
        animate={{ background: `rgba(14, 22, 48, ${zugedeckt ? 0.42 : 0.55})` }}
        transition={{ duration: 1.6 }}
        aria-hidden
      />

      {/* ------------------------------------------------- Das Sternbild */}
      <svg viewBox="0 0 100 75" className="pointer-events-none absolute inset-0 z-20 size-full" aria-hidden>
        {LINIEN.map(([a, b], i) => {
          const sichtbar = leuchtend.includes(a) && leuchtend.includes(b);
          return (
            <motion.line
              key={i}
              x1={STERNE[a].x}
              y1={STERNE[a].y * 0.75}
              x2={STERNE[b].x}
              y2={STERNE[b].y * 0.75}
              stroke="rgba(255,236,180,0.75)"
              strokeWidth="0.35"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={sichtbar ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
              transition={{ duration: 0.7 }}
            />
          );
        })}
      </svg>

      {/* ---------------------------------------------------- Die Sterne */}
      {STERNE.map((stern) => {
        const an = leuchtend.includes(stern.id);
        return (
          <Tippziel
            key={stern.id}
            x={stern.x}
            y={stern.y}
            groesse={12}
            aktiv={phase === "sterne" && !an}
            label="Stern"
            onTipp={() => sternAntippen(stern.id)}
            hinweisNach={leuchtend.length === 0 ? 4500 : 0}
            ringHinweis={false}
            style={{ zIndex: 25 }}
          >
            <motion.div
              className="size-full"
              animate={
                an
                  ? { scale: 1, opacity: 1, filter: "drop-shadow(0 0 1.6cqw rgba(255,230,150,0.95))" }
                  : { scale: [0.6, 0.74, 0.6], opacity: 0.42 }
              }
              transition={
                an
                  ? { type: "spring", stiffness: 240, damping: 14 }
                  : { duration: 2.6, repeat: Infinity, ease: "easeInOut" }
              }
            >
              <SternGrafik an={an} />
            </motion.div>
          </Tippziel>
        );
      })}

      {/* Ein „Kleiner Bär"-Schild, wenn das Bild fertig ist */}
      <AnimatePresence>
        {alleSterne && phase === "sterne" && (
          <motion.span
            className="absolute z-30 rounded-full px-[3cqw] py-[1.2cqw] text-[2.8cqw] font-semibold"
            style={{
              left: "50%",
              top: "80%",
              transform: "translate(-50%, -50%)",
              background: "rgba(255,255,255,0.16)",
              color: "#fdf6ec",
            }}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            Der kleine Bär ⭐
          </motion.span>
        )}
      </AnimatePresence>

      {/*
        Zugedeckt schläft Tim auch.

        Im Buch schaut er mit offenen Augen aus dem Bett — er soll ja noch
        wach sein. Wenn das Kind ihn zudeckt und „Schlaf gut" hört, gehören
        die Augen zu, sonst liegt er mit Zzz über dem Kopf hellwach da.
        Ausgemessen an der Illustration: 43,9/22,7 und 55,1/22,5.
      */}
      <GeschlossenesAuge
        x={43.9}
        y={22.7}
        breite={4.4}
        hoehe={3.0}
        oben="#e7c79b"
        unten="#ecd4b1"
        wimper="#7b5238"
        offen={!zugedeckt}
        helligkeit={zugedeckt ? 0.6 : 0.44}
      />
      <GeschlossenesAuge
        x={55.1}
        y={22.5}
        breite={4.4}
        hoehe={3.0}
        oben="#e8b987"
        unten="#eac7a3"
        wimper="#7b5238"
        offen={!zugedeckt}
        verzoegerung={0.09}
        helligkeit={zugedeckt ? 0.6 : 0.44}
      />

      {/* ----------------------------------------------------- Die Decke */}
      {phase === "decke" && (
        <motion.div
          className="absolute inset-x-0 z-30"
          style={{ bottom: 0, height: "46cqw", touchAction: "none", cursor: "grab" }}
          drag={zugedeckt ? false : "y"}
          dragConstraints={{ top: -1, bottom: 0 }}
          dragElastic={{ top: 0.55, bottom: 0 }}
          dragMomentum={false}
          onDrag={(_, info) => {
            if (info.offset.y < -60) zudecken();
          }}
          /*
           * Nur bis zur Brust, nicht über den Kopf.
           *
           * Vorher fuhr die Decke 26cqw nach oben — Tim verschwand samt
           * Gesicht darunter, und die Zzz stiegen aus einem leeren Bett auf.
           */
          animate={zugedeckt ? { y: "-4cqw" } : { y: 0 }}
          transition={{ type: "spring", stiffness: 90, damping: 20 }}
        >
          <Decke />
          {!zugedeckt && (
            <motion.div
              className="pointer-events-none absolute inset-x-0 top-[-7cqw] flex justify-center"
              animate={{ y: ["0cqw", "-1.6cqw", "0cqw"] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            >
              <span className="text-[6cqw]" aria-hidden>
                ☝️
              </span>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Ein paar Zzz, wenn Tim zugedeckt ist */}
      <AnimatePresence>
        {zugedeckt && (
          <motion.div
            className="pointer-events-none absolute z-40"
            style={{ left: "62%", top: "38%" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {["z", "z", "z"].map((z, i) => (
              <motion.span
                key={i}
                className="absolute font-bold"
                style={{
                  left: `${i * 3.4}cqw`,
                  fontSize: `${3 + i * 1.4}cqw`,
                  color: "rgba(253,246,236,0.85)",
                }}
                animate={{ y: ["2cqw", "-6cqw"], opacity: [0, 1, 0] }}
                transition={{ duration: 3, repeat: Infinity, delay: i * 0.8 }}
              >
                {z}
              </motion.span>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </StationRahmen>
  );
}

function SternGrafik({ an }: { an: boolean }) {
  return (
    <svg viewBox="0 0 100 100" className="size-full" aria-hidden>
      <path
        d="M50 6 L61 38 L95 38 L67 58 L78 92 L50 71 L22 92 L33 58 L5 38 L39 38z"
        fill={an ? "#ffe6a0" : "rgba(226,236,255,0.75)"}
        stroke={an ? "#ffd166" : "none"}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {an && <circle cx="50" cy="50" r="14" fill="rgba(255,255,255,0.6)" />}
    </svg>
  );
}

function Decke() {
  return (
    <svg viewBox="0 0 400 180" preserveAspectRatio="none" className="size-full" aria-hidden>
      <path
        d="M0 34 q40 -18 80 -4 q44 15 88 -2 q46 -18 92 2 q42 16 84 -6 q30 -16 56 -2 V180 H0z"
        fill="#3f5a96"
        stroke="#2c406e"
        strokeWidth="3"
      />
      <path
        d="M0 34 q40 -18 80 -4 q44 15 88 -2 q46 -18 92 2 q42 16 84 -6 q30 -16 56 -2"
        fill="none"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="6"
      />
      {[70, 150, 230, 310].map((x) => (
        <path
          key={x}
          d={`M${x} 60 q10 46 -6 112`}
          fill="none"
          stroke="rgba(255,255,255,0.14)"
          strokeWidth="8"
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}
