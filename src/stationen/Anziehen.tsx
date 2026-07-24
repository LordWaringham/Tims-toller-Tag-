"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { StationRahmen, type StationProps } from "@/components/StationRahmen";
import { Ablage, Ziehbar } from "@/components/dnd";
import { TimFigur } from "@/components/TimFigur";
import { STATIONS } from "@/lib/stations";
import type { LineId } from "@/lib/lines";
import * as sfx from "@/lib/sfx";
import * as voice from "@/lib/voice";

const STATION = STATIONS[1];

interface Kleidungsstueck {
  id: string;
  art: "oberteil" | "hose";
  farbe: string;
  name: string;
}

const KLEIDUNG: Kleidungsstueck[] = [
  { id: "shirt-gruen", art: "oberteil", farbe: "#6fa83c", name: "grünes T-Shirt" },
  { id: "shirt-rot", art: "oberteil", farbe: "#d9483a", name: "rotes T-Shirt" },
  { id: "shirt-blau", art: "oberteil", farbe: "#4a8fc0", name: "blaues T-Shirt" },
  { id: "hose-blau", art: "hose", farbe: "#3e6c9e", name: "blaue Hose" },
  { id: "hose-braun", art: "hose", farbe: "#8a6a44", name: "braune Hose" },
  { id: "hose-gruen", art: "hose", farbe: "#5f8c4a", name: "grüne Hose" },
];

/**
 * Anziehen — es gibt kein Falsch.
 * Jedes Oberteil passt oben, jede Hose passt unten. Wählt das Kind Grün und
 * Blau wie im Buch, gibt es einen kleinen Extra-Applaus.
 */
export function Anziehen({ onGeschafft, onWeiter, onZurueck }: StationProps) {
  const [oberteil, setOberteil] = useState<Kleidungsstueck | null>(null);
  const [hose, setHose] = useState<Kleidungsstueck | null>(null);
  const [fertig, setFertig] = useState(false);

  const satz: LineId = !oberteil ? "s02-oberteil" : !hose ? "s02-hose" : "s02-fertig";

  const anlegen = (stueck: Kleidungsstueck, zone: string | null) => {
    if (zone !== stueck.art) return false;

    sfx.place();
    const neuesOberteil = stueck.art === "oberteil" ? stueck : oberteil;
    const neueHose = stueck.art === "hose" ? stueck : hose;
    if (stueck.art === "oberteil") setOberteil(stueck);
    else setHose(stueck);

    if (neuesOberteil && neueHose) {
      const wieImBuch =
        neuesOberteil.id === "shirt-gruen" && neueHose.id === "hose-blau";
      onGeschafft();
      setTimeout(async () => {
        if (wieImBuch) {
          await voice.speak("s02-buch");
        }
        setFertig(true);
      }, 700);
    }
    return true;
  };

  const abgelegt = (id: string) =>
    (oberteil?.id === id) || (hose?.id === id);

  return (
    <StationRahmen
      station={STATION}
      satz={satz}
      fertig={fertig}
      onWeiter={onWeiter}
      onZurueck={onZurueck}
      abschlussSatz="s02-fertig"
      unschaerfe={1.4}
      schleier={0.55}
    >
      {/* Tim in der Mitte */}
      <div
        className="absolute z-10"
        style={{ left: "50%", top: "54%", transform: "translate(-50%, -50%)" }}
      >
        <TimFigur
          shirtFarbe={oberteil?.farbe}
          hoseFarbe={hose?.farbe}
          pose={oberteil && hose ? "winken" : "stehen"}
          className="h-[62cqh] w-auto drop-shadow-lg"
        />
      </div>

      {/* Ablageflächen auf Tims Körper */}
      <Ablage
        id="oberteil"
        toleranzCqw={6}
        akzeptiert={(id) => KLEIDUNG.find((k) => k.id === id)?.art === "oberteil"}
        style={{
          position: "absolute",
          left: "50%",
          top: "43%",
          width: "26cqw",
          height: "18cqw",
          transform: "translate(-50%, -50%)",
          borderRadius: "3cqw",
          border: oberteil ? "none" : "0.5cqw dashed rgba(95,107,92,0.45)",
          background: oberteil ? "none" : "rgba(255,255,255,0.25)",
          zIndex: 5,
        }}
      />
      <Ablage
        id="hose"
        toleranzCqw={6}
        akzeptiert={(id) => KLEIDUNG.find((k) => k.id === id)?.art === "hose"}
        style={{
          position: "absolute",
          left: "50%",
          top: "68%",
          width: "24cqw",
          height: "20cqw",
          transform: "translate(-50%, -50%)",
          borderRadius: "3cqw",
          border: hose ? "none" : "0.5cqw dashed rgba(95,107,92,0.45)",
          background: hose ? "none" : "rgba(255,255,255,0.25)",
          zIndex: 5,
        }}
      />

      {/* Kleiderstange links (Oberteile) und rechts (Hosen) */}
      {KLEIDUNG.map((stueck, i) => {
        const links = stueck.art === "oberteil";
        const reihe = i % 3;
        if (abgelegt(stueck.id)) return null;
        return (
          <Ziehbar
            key={stueck.id}
            id={stueck.id}
            onAblegen={(zone) => anlegen(stueck, zone)}
            hinweis={!oberteil && links && reihe === 0}
            x={links ? 10 : 90}
            y={30 + reihe * 23}
            breite={16}
          >
            <div className="drop-shadow-md" aria-label={stueck.name}>
              {links ? <ShirtGrafik farbe={stueck.farbe} /> : <HoseGrafik farbe={stueck.farbe} />}
            </div>
          </Ziehbar>
        );
      })}

      {oberteil && hose && !fertig && (
        <motion.div
          className="absolute inset-0 z-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            background:
              "radial-gradient(circle at 50% 50%, rgba(255,240,200,0.45), transparent 60%)",
          }}
          aria-hidden
        />
      )}
    </StationRahmen>
  );
}

function ShirtGrafik({ farbe }: { farbe: string }) {
  return (
    <svg viewBox="0 0 100 84" className="w-full" aria-hidden>
      <path
        d="M32 8 L20 14 L8 28 l14 12 l6 -7 v40 q22 6 44 0 v-40 l6 7 l14 -12 L80 14 L68 8
           q-9 9 -18 9 q-9 0 -18 -9z"
        fill={farbe}
        stroke="rgba(0,0,0,0.28)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M32 8 q9 10 18 10 q9 0 18 -10"
        fill="none"
        stroke="rgba(255,255,255,0.6)"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function HoseGrafik({ farbe }: { farbe: string }) {
  return (
    <svg viewBox="0 0 100 104" className="w-full" aria-hidden>
      <path
        d="M18 6 h64 l6 92 h-24 l-8 -52 h-4 l-8 52 h-24z"
        fill={farbe}
        stroke="rgba(0,0,0,0.28)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <rect x="16" y="4" width="68" height="10" rx="4" fill="rgba(0,0,0,0.14)" />
    </svg>
  );
}
