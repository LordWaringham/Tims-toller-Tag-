"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { StationRahmen, type StationProps } from "@/components/StationRahmen";
import { Ablage, Ziehbar } from "@/components/dnd";
import { STATIONS } from "@/lib/stations";
import type { LineId } from "@/lib/lines";
import * as sfx from "@/lib/sfx";
import * as voice from "@/lib/voice";
import { neueSaat, streuIn } from "@/lib/streu";

const STATION = STATIONS[4];

type Sorte = "bausteine" | "kuscheltiere" | "baelle";

interface Spielzeug {
  id: string;
  sorte: Sorte;
  farbe: string;
  x: number;
  y: number;
  name: string;
}

const SPIELZEUG: Spielzeug[] = [
  { id: "b1", sorte: "bausteine", farbe: "#f2b93c", x: 14, y: 34, name: "Baustein" },
  { id: "b2", sorte: "bausteine", farbe: "#4a9cb8", x: 50, y: 30, name: "Baustein" },
  { id: "k1", sorte: "kuscheltiere", farbe: "#d98a4a", x: 86, y: 34, name: "Teddy" },
  { id: "k2", sorte: "kuscheltiere", farbe: "#c47a9c", x: 29, y: 50, name: "Kuschelhase" },
  { id: "l1", sorte: "baelle", farbe: "#d9483a", x: 71, y: 50, name: "Ball" },
  { id: "l2", sorte: "baelle", farbe: "#5a8cd9", x: 50, y: 55, name: "Ball" },
];

const KISTEN: { sorte: Sorte; farbe: string; rand: string; titel: string; x: number }[] = [
  { sorte: "bausteine", farbe: "#d9483a", rand: "#a52f24", titel: "Bausteine", x: 20 },
  { sorte: "kuscheltiere", farbe: "#5a9c3c", rand: "#3f7527", titel: "Kuscheltiere", x: 50 },
  { sorte: "baelle", farbe: "#3e7cbe", rand: "#2a5c94", titel: "Bälle", x: 80 },
];

/**
 * Sortieren nach Kategorien.
 * Landet etwas in der falschen Kiste, hüpft es freundlich zurück — mit einem
 * „Hmm" statt einem Fehlerton.
 */
export function Aufraeumen({ onGeschafft, onWeiter, onZurueck }: StationProps) {
  // Das Durcheinander liegt jedes Mal etwas anders — sortiert wird dasselbe.
  const [saat] = useState(neueSaat);
  const durcheinander = SPIELZEUG.map((s, i) => ({
    ...s,
    x: s.x + streuIn(i, saat, -5, 5),
    y: s.y + streuIn(i, saat + 1, -4, 4),
  }));

  const [weggeraeumt, setWeggeraeumt] = useState<Record<string, Sorte>>({});
  const [danebenGetippt, setDanebenGetippt] = useState(0);
  const [fertig, setFertig] = useState(false);

  const anzahl = Object.keys(weggeraeumt).length;
  const satz: LineId = anzahl === 0 ? "s05-intro" : "s05-erklaerung";

  const einraeumen = (spielzeug: Spielzeug, zone: string | null) => {
    if (!zone) return false;
    if (zone !== spielzeug.sorte) {
      setDanebenGetippt((n) => n + 1);
      void voice.speak("s05-falsch");
      return false;
    }

    sfx.place();
    const neu = { ...weggeraeumt, [spielzeug.id]: spielzeug.sorte };
    setWeggeraeumt(neu);

    if (Object.keys(neu).length >= SPIELZEUG.length) {
      onGeschafft();
      setTimeout(() => setFertig(true), 700);
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
      abschlussSatz="s05-fertig"
      onSatzGesprochen={(gesagt) => {
        if (gesagt === "s05-intro") void voice.speakWennAufgenommen("tim-freunde");
      }}
      unschaerfe={1.2}
      schleier={0.5}
    >
      {/* ------------------------------------------------------- Die Kisten */}
      {KISTEN.map((kiste) => {
        const drin = Object.entries(weggeraeumt).filter(([, s]) => s === kiste.sorte);
        return (
          <Ablage
            key={kiste.sorte}
            id={kiste.sorte}
            toleranzCqw={5}
            akzeptiert={() => true}
            style={{
              position: "absolute",
              left: `${kiste.x}%`,
              top: "80%",
              width: "26cqw",
              height: "24cqw",
              transform: "translate(-50%, -50%)",
              zIndex: 10,
            }}
          >
            <div
              className="relative size-full"
              style={{
                borderRadius: "2cqw 2cqw 3cqw 3cqw",
                background: `linear-gradient(180deg, ${kiste.farbe}, ${kiste.rand})`,
                boxShadow: "inset 0 1cqw 0 rgba(255,255,255,0.22), 0 0.8cqw 1.6cqw rgba(0,0,0,0.2)",
              }}
            >
              {/* Symbol auf der Kiste, damit auch ohne Lesen klar ist, was hinein soll */}
              <div className="absolute inset-x-0 top-[14%] grid place-items-center opacity-90">
                <div className="w-[9cqw]">
                  <SpielzeugGrafik sorte={kiste.sorte} farbe="rgba(255,255,255,0.9)" />
                </div>
              </div>
              <span
                className="absolute inset-x-0 bottom-[8%] text-center text-[2.2cqw] font-semibold text-white/95"
              >
                {kiste.titel}
              </span>

              {/* Was schon drin ist, guckt oben heraus */}
              {drin.map(([id], i) => {
                const s = SPIELZEUG.find((t) => t.id === id)!;
                return (
                  <motion.div
                    key={id}
                    className="absolute w-[8cqw]"
                    style={{ left: `${18 + i * 30}%`, top: "-14%" }}
                    initial={{ y: "-6cqw", scale: 0.6, opacity: 0 }}
                    animate={{ y: 0, scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 320, damping: 20 }}
                  >
                    <SpielzeugGrafik sorte={s.sorte} farbe={s.farbe} />
                  </motion.div>
                );
              })}
            </div>
          </Ablage>
        );
      })}

      {/* --------------------------------------------------- Das Durcheinander */}
      {durcheinander.filter((s) => !weggeraeumt[s.id]).map((spielzeug, i) => (
        <Ziehbar
          key={spielzeug.id}
          id={spielzeug.id}
          onAblegen={(zone) => einraeumen(spielzeug, zone)}
          hinweis={danebenGetippt >= 2 && i === 0}
          x={spielzeug.x}
          y={spielzeug.y}
          breite={13}
        >
          <div className="drop-shadow-md" aria-label={spielzeug.name}>
            <SpielzeugGrafik sorte={spielzeug.sorte} farbe={spielzeug.farbe} />
          </div>
        </Ziehbar>
      ))}
    </StationRahmen>
  );
}

function SpielzeugGrafik({ sorte, farbe }: { sorte: Sorte; farbe: string }) {
  if (sorte === "bausteine") {
    return (
      <svg viewBox="0 0 100 100" className="w-full" aria-hidden>
        <rect x="10" y="30" width="80" height="58" rx="8" fill={farbe} />
        <rect x="10" y="30" width="80" height="14" rx="7" fill="rgba(255,255,255,0.25)" />
        {[26, 50, 74].map((x) => (
          <rect key={x} x={x - 9} y="16" width="18" height="16" rx="5" fill={farbe} />
        ))}
        <rect
          x="10"
          y="30"
          width="80"
          height="58"
          rx="8"
          fill="none"
          stroke="rgba(0,0,0,0.22)"
          strokeWidth="3"
        />
      </svg>
    );
  }

  if (sorte === "kuscheltiere") {
    return (
      <svg viewBox="0 0 100 100" className="w-full" aria-hidden>
        <circle cx="26" cy="26" r="14" fill={farbe} stroke="rgba(0,0,0,0.22)" strokeWidth="3" />
        <circle cx="74" cy="26" r="14" fill={farbe} stroke="rgba(0,0,0,0.22)" strokeWidth="3" />
        <ellipse cx="50" cy="72" rx="30" ry="26" fill={farbe} stroke="rgba(0,0,0,0.22)" strokeWidth="3" />
        <circle cx="50" cy="40" r="26" fill={farbe} stroke="rgba(0,0,0,0.22)" strokeWidth="3" />
        <ellipse cx="50" cy="48" rx="11" ry="8" fill="rgba(255,255,255,0.55)" />
        <circle cx="41" cy="36" r="3.4" fill="#3d2a1c" />
        <circle cx="59" cy="36" r="3.4" fill="#3d2a1c" />
        <ellipse cx="50" cy="45" rx="4" ry="3" fill="#3d2a1c" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 100 100" className="w-full" aria-hidden>
      <circle cx="50" cy="50" r="40" fill={farbe} stroke="rgba(0,0,0,0.22)" strokeWidth="3" />
      <path
        d="M10 50 q40 -22 80 0 M10 50 q40 22 80 0"
        fill="none"
        stroke="rgba(255,255,255,0.75)"
        strokeWidth="5"
      />
      <ellipse cx="36" cy="34" rx="11" ry="8" fill="rgba(255,255,255,0.35)" />
    </svg>
  );
}
