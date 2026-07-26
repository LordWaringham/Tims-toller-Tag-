"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { StationRahmen, type StationProps } from "@/components/StationRahmen";
import { Ablage, Ziehbar } from "@/components/dnd";
import { ERFOLGSPAUSE, STATIONS } from "@/lib/stations";
import type { LineId } from "@/lib/lines";
import * as sfx from "@/lib/sfx";
import { mischen, neueSaat } from "@/lib/streu";

const STATION = STATIONS[9];

interface Farbe {
  id: string;
  name: string;
  ton: string;
  hell: string;
  satz: LineId;
}

const FARBEN: Farbe[] = [
  { id: "rot", name: "rot", ton: "#d9483a", hell: "#f08a7e", satz: "s10-rot" },
  { id: "gelb", name: "gelb", ton: "#f2c33c", hell: "#ffe79a", satz: "s10-gelb" },
  { id: "blau", name: "blau", ton: "#4a8fc0", hell: "#9cc9e8", satz: "s10-blau" },
  { id: "lila", name: "lila", ton: "#a06bc4", hell: "#d3b0e6", satz: "s10-lila" },
  { id: "orange", name: "orange", ton: "#e8853a", hell: "#f8bd88", satz: "s10-orange" },
];

/** Die Schmetterlinge sitzen oben, die Blumen unten — in anderer Reihenfolge. */
const SCHMETTERLING_X = [12, 31, 50, 69, 88];
const BLUMEN_ORDNUNG = ["blau", "orange", "lila", "rot", "gelb"];

/**
 * Farben zuordnen.
 * Landet ein Schmetterling auf der falschen Blume, flattert er einfach
 * zurück — freundlich, ohne Ton der Enttäuschung.
 */
export function Schmetterlinge({ onGeschafft, onWeiter, onZurueck }: StationProps) {
  /*
   * Die Blumen stehen bei jedem Besuch in anderer Reihenfolge.
   *
   * Sonst merkt sich ein Kind nach ein paar Runden die Plätze statt der
   * Farben — und übt dann Gedächtnis statt Farbzuordnung.
   */
  const [saat] = useState(neueSaat);
  const blumenOrdnung = useMemo(() => mischen(BLUMEN_ORDNUNG, saat), [saat]);

  const [gelandet, setGelandet] = useState<string[]>([]);
  const [regelGesagt, setRegelGesagt] = useState(false);
  const [fertig, setFertig] = useState(false);

  const offen = FARBEN.filter((f) => !gelandet.includes(f.id));
  // Erst die Einladung, dann die Spielregel, dann die Farbhinweise.
  const satz: LineId =
    gelandet.length > 0
      ? (offen[0]?.satz ?? "s10-fertig")
      : regelGesagt
        ? "s10-erklaerung"
        : "s10-intro";

  const landen = (farbe: Farbe, zone: string | null) => {
    if (zone !== `blume-${farbe.id}`) return false;
    sfx.flutter(); // die Flügel kommen zur Ruhe
    sfx.sparkle();
    sfx.chime(gelandet.length + 3);
    const neu = [...gelandet, farbe.id];
    setGelandet(neu);
    if (neu.length >= FARBEN.length) {
      onGeschafft();
      setTimeout(() => setFertig(true), ERFOLGSPAUSE);
    }
    return true;
  };

  return (
    <StationRahmen
      station={STATION}
      satz={satz}
      fertig={fertig}
      onWeiter={onWeiter}
      onZurueck={onZurueck}
      abschlussSatz="s10-fertig"
      onSatzGesprochen={(gesagt) => {
        if (gesagt === "s10-intro") setRegelGesagt(true);
      }}
      unschaerfe={0.8}
      schleier={0.4}
    >
      {/* ------------------------------------------------------- Die Blumen */}
      {blumenOrdnung.map((farbId, i) => {
        const farbe = FARBEN.find((f) => f.id === farbId)!;
        const besetzt = gelandet.includes(farbId);
        return (
          <Ablage
            key={farbId}
            id={`blume-${farbId}`}
            toleranzCqw={5}
            style={{
              position: "absolute",
              left: `${SCHMETTERLING_X[i]}%`,
              top: "74%",
              width: "18cqw",
              height: "22cqw",
              transform: "translate(-50%, -50%)",
              zIndex: 10,
            }}
          >
            <div className="relative size-full" aria-label={`Blume ${farbe.name}`}>
              <BlumeGrafik farbe={farbe} />
              {besetzt && (
                <motion.div
                  className="absolute"
                  style={{ left: "50%", top: "10%", width: "13cqw", translateX: "-50%" }}
                  initial={{ scale: 0.4, y: "-6cqw", opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 18 }}
                >
                  <SchmetterlingGrafik farbe={farbe} ruhend />
                </motion.div>
              )}
            </div>
          </Ablage>
        );
      })}

      {/* ------------------------------------------------ Die Schmetterlinge */}
      {FARBEN.map((farbe, i) => {
        if (gelandet.includes(farbe.id)) return null;
        return (
          <Ziehbar
            key={farbe.id}
            id={farbe.id}
            onAblegen={(zone) => landen(farbe, zone)}
            x={SCHMETTERLING_X[i]}
            y={26}
            breite={16}
          >
            <motion.div
              aria-label={`Schmetterling ${farbe.name}`}
              animate={{ y: ["0cqw", "-1.8cqw", "0cqw"], rotate: [-4, 4, -4] }}
              transition={{
                duration: 2.4 + i * 0.3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <SchmetterlingGrafik farbe={farbe} />
            </motion.div>
          </Ziehbar>
        );
      })}

      {/* Zähler */}
      <div
        className="pointer-events-none absolute z-30 flex items-center gap-[1.2cqw] rounded-full px-[2.6cqw] py-[1.2cqw] shadow-md"
        style={{
          left: "50%",
          // Über der Stickerleiste, sonst steckt der Zähler dahinter.
          bottom: "9.5%",
          transform: "translateX(-50%)",
          background: "rgba(255,255,255,0.88)",
        }}
      >
        <span className="text-[3.4cqw] leading-none">🦋</span>
        <span className="text-[3cqw] font-bold" style={{ color: "#e8622a" }}>
          {gelandet.length} von {FARBEN.length}
        </span>
      </div>
    </StationRahmen>
  );
}

function SchmetterlingGrafik({ farbe, ruhend = false }: { farbe: Farbe; ruhend?: boolean }) {
  return (
    <svg viewBox="0 0 120 100" className="w-full drop-shadow-md" aria-hidden>
      <motion.g
        animate={ruhend ? { scaleX: 0.72 } : { scaleX: [1, 0.82, 1] }}
        transition={
          ruhend ? { duration: 0.4 } : { duration: 0.9, repeat: Infinity, ease: "easeInOut" }
        }
        style={{ transformOrigin: "60px 50px" }}
      >
        {/* Flügel links */}
        <path
          d="M58 48 q-32 -34 -46 -18 q-12 14 6 28 q-14 8 -4 20 q12 14 44 -14z"
          fill={farbe.ton}
          stroke="rgba(0,0,0,0.22)"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {/* Flügel rechts */}
        <path
          d="M62 48 q32 -34 46 -18 q12 14 -6 28 q14 8 4 20 q-12 14 -44 -14z"
          fill={farbe.ton}
          stroke="rgba(0,0,0,0.22)"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {/* Musterpunkte */}
        <circle cx="30" cy="36" r="7" fill={farbe.hell} />
        <circle cx="90" cy="36" r="7" fill={farbe.hell} />
        <circle cx="26" cy="66" r="4.5" fill={farbe.hell} />
        <circle cx="94" cy="66" r="4.5" fill={farbe.hell} />
      </motion.g>

      {/* Körper */}
      <ellipse cx="60" cy="52" rx="5" ry="22" fill="#5a4632" />
      <circle cx="60" cy="30" r="7" fill="#5a4632" />
      <path
        d="M57 24 q-6 -12 -14 -14 M63 24 q6 -12 14 -14"
        fill="none"
        stroke="#5a4632"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <circle cx="43" cy="10" r="3" fill="#5a4632" />
      <circle cx="77" cy="10" r="3" fill="#5a4632" />
      <circle cx="57.5" cy="28" r="1.6" fill="#fff" />
      <circle cx="62.5" cy="28" r="1.6" fill="#fff" />
    </svg>
  );
}

function BlumeGrafik({ farbe }: { farbe: Farbe }) {
  return (
    <svg viewBox="0 0 100 130" className="size-full drop-shadow-md" aria-hidden>
      <path
        d="M50 130 q-4 -40 0 -62"
        fill="none"
        stroke="#5a8c28"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path d="M50 104 q-20 -12 -24 3 q17 9 24 -3z" fill="#6ba32f" />
      <path d="M50 88 q20 -12 24 3 q-17 9 -24 -3z" fill="#6ba32f" />
      {Array.from({ length: 8 }, (_, i) => (
        <ellipse
          key={i}
          cx="50"
          cy="26"
          rx="10"
          ry="19"
          fill={farbe.ton}
          stroke="rgba(0,0,0,0.14)"
          strokeWidth="1.5"
          transform={`rotate(${i * 45} 50 52)`}
        />
      ))}
      <circle cx="50" cy="52" r="12" fill={farbe.hell} />
      <circle cx="50" cy="52" r="12" fill="rgba(0,0,0,0.05)" />
    </svg>
  );
}
