"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { StationRahmen, type StationProps } from "@/components/StationRahmen";
import { Tippziel } from "@/components/Tippziel";
import { STATIONS } from "@/lib/stations";
import type { LineId } from "@/lib/lines";
import * as sfx from "@/lib/sfx";
import * as voice from "@/lib/voice";

const STATION = STATIONS[0];

/**
 * Erste Station: drei einfache Tipps.
 * Sonne wecken → Teddy wecken → Tim wecken. Führt behutsam in die Bedienung ein.
 */
export function Aufwachen({ onGeschafft, onWeiter, onZurueck }: StationProps) {
  const [schritt, setSchritt] = useState(0); // 0 Sonne, 1 Teddy, 2 Tim, 3 fertig
  const [fertig, setFertig] = useState(false);

  const saetze: LineId[] = ["s01-intro", "s01-teddy", "s01-tim"];
  const satz = saetze[Math.min(schritt, 2)];

  /*
   * Diese Station spricht selbst.
   *
   * Auf einen Tipp folgen zwei Sätze: die Reaktion („Die Sonne scheint ins
   * Zimmer") und der nächste Auftrag („Jetzt wecken wir Teddy"). Der Rahmen
   * kennt nur den Auftrag und würde ihn sofort dazwischenreden. Also gibt
   * die Station die Reihenfolge vor — Bild und Hinweistext wechseln dabei
   * ohne Verzögerung, nur die Stimme arbeitet die beiden Sätze nacheinander ab.
   */
  useEffect(() => {
    void voice.speak("s01-intro");
  }, []);

  // Der Raum wird mit jedem Schritt heller.
  const helligkeit = [0.42, 0.68, 0.88, 1][Math.min(schritt, 3)];
  const blaustich = [0.55, 0.32, 0.12, 0][Math.min(schritt, 3)];

  const weiter = async (naechster: number, ton: () => void, gesagt?: LineId) => {
    ton();
    setSchritt(naechster);
    if (naechster === 3) {
      onGeschafft();
      setTimeout(() => setFertig(true), 500);
      return;
    }
    const folge: LineId[] = [];
    if (gesagt) folge.push(gesagt);
    folge.push(saetze[naechster]);
    await voice.speakSequence(folge, 200);
  };

  return (
    <StationRahmen
      station={STATION}
      satz={satz}
      fertig={fertig}
      onWeiter={onWeiter}
      onZurueck={onZurueck}
      abschlussSatz="s01-fertig"
      helligkeit={helligkeit}
      dunkel={schritt < 2}
      stummerRahmen
    >
      {/* Nachtblauer Schleier, der sich mit dem Aufwachen auflöst */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-10"
        animate={{ background: `rgba(24, 38, 82, ${blaustich})` }}
        transition={{ duration: 0.9 }}
        aria-hidden
      />

      {/* Sonnenstrahlen, sobald die Sonne oben ist */}
      {schritt >= 1 && (
        <motion.div
          className="pointer-events-none absolute inset-0 z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2 }}
          style={{
            background:
              "radial-gradient(circle at 82% 12%, rgba(255,224,150,0.6) 0%, rgba(255,224,150,0) 45%)",
          }}
          aria-hidden
        />
      )}

      {/*
        Die Sonne steigt beim Antippen auf. Weil sich hier die Position selbst
        bewegt, ist sie ein eigener Knopf statt eines Tippziels — sonst würden
        sich zwei Animationen um dieselbe Position streiten.
      */}
      <motion.button
        type="button"
        aria-label="Sonne"
        disabled={schritt !== 0}
        onClick={() => weiter(1, () => sfx.chime(5), "s01-sonne")}
        className="absolute z-20 border-none bg-transparent p-0"
        style={{ left: "82%", width: "20cqw", height: "20cqw", x: "-50%", y: "-50%" }}
        animate={{
          top: schritt >= 1 ? "14%" : "40%",
          scale: schritt === 0 ? [1, 1.07, 1] : 1,
        }}
        transition={{
          top: { type: "spring", stiffness: 60, damping: 16 },
          scale: { duration: 1.8, repeat: schritt === 0 ? Infinity : 0, ease: "easeInOut" },
        }}
        whileTap={{ scale: 0.9 }}
      >
        <Sonne strahlend={schritt >= 1} />
      </motion.button>

      {/* --------------------------------------------------------- 2 · Teddy */}
      <Tippziel
        x={25}
        y={62}
        groesse={22}
        aktiv={schritt === 1}
        label="Teddy"
        onTipp={() => weiter(2, () => sfx.chime(2), "s01-teddy-wach")}
        ringHinweis={schritt === 1}
      >
        <motion.span
          className="block size-full rounded-full"
          animate={
            schritt >= 2
              ? { rotate: [0, -12, 12, -6, 0], scale: [1, 1.12, 1] }
              : { rotate: 0, scale: 1 }
          }
          transition={{ duration: 0.9 }}
          style={{
            background:
              schritt === 1 ? "radial-gradient(circle, rgba(255,235,180,0.4), transparent 68%)" : "none",
          }}
        />
      </Tippziel>

      {/* ----------------------------------------------------------- 3 · Tim */}
      <Tippziel
        x={62}
        y={45}
        groesse={26}
        aktiv={schritt === 2}
        label="Tim"
        onTipp={() => weiter(3, () => sfx.chime(7))}
        ringHinweis={schritt === 2}
      >
        <motion.span
          className="block size-full rounded-full"
          animate={schritt >= 3 ? { scale: [1, 1.1, 1] } : { scale: 1 }}
          transition={{ duration: 0.7 }}
          style={{
            background:
              schritt === 2 ? "radial-gradient(circle, rgba(255,235,180,0.4), transparent 68%)" : "none",
          }}
        />
      </Tippziel>

      {/* Ein „Guten Morgen!" über dem Bett */}
      {schritt >= 3 && (
        <motion.div
          className="absolute z-30"
          style={{ left: "62%", top: "18%", translateX: "-50%" }}
          initial={{ scale: 0, rotate: -8 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 240, damping: 14 }}
        >
          <span
            className="rounded-full px-[3cqw] py-[1.4cqw] text-[3.4cqw] font-semibold shadow-lg"
            style={{ background: "rgba(255,255,255,0.94)", color: "#5f6b5c" }}
          >
            Guten Morgen!
          </span>
        </motion.div>
      )}
    </StationRahmen>
  );
}

function Sonne({ strahlend }: { strahlend: boolean }) {
  return (
    <motion.svg
      viewBox="0 0 100 100"
      className="size-full"
      animate={{ rotate: strahlend ? 360 : 0 }}
      transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      aria-hidden
    >
      {Array.from({ length: 12 }, (_, i) => (
        <rect
          key={i}
          x="48"
          y="4"
          width="4"
          height="14"
          rx="2"
          fill="#ffd166"
          transform={`rotate(${i * 30} 50 50)`}
          opacity={strahlend ? 0.95 : 0.5}
        />
      ))}
      <circle cx="50" cy="50" r="26" fill="#ffc94d" />
      <circle cx="50" cy="50" r="26" fill="url(#sonneGlanz)" />
      <defs>
        <radialGradient id="sonneGlanz" cx="35%" cy="30%">
          <stop offset="0%" stopColor="#fff3c4" />
          <stop offset="100%" stopColor="#ffb703" stopOpacity="0.35" />
        </radialGradient>
      </defs>
    </motion.svg>
  );
}
