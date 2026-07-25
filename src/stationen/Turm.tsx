"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { StationRahmen, type StationProps } from "@/components/StationRahmen";
import { Ablage, Ziehbar } from "@/components/dnd";
import { STATIONS } from "@/lib/stations";
import { zahl, type LineId } from "@/lib/lines";
import * as sfx from "@/lib/sfx";
import * as voice from "@/lib/voice";
import { mischen, neueSaat } from "@/lib/streu";

const STATION = STATIONS[3];

const ZIEL = 6;
const STEIN_BREITE = 15; // in cqw
const STEIN_HOEHE = 7; // in cqw
const BODEN = 88; // Prozent der Bühnenhöhe

interface Stein {
  id: string;
  farbe: string;
  schatten: string;
  /** Startplatz im Vorrat, in Prozent. */
  x: number;
  y: number;
}

const STEINE: Stein[] = [
  { id: "s1", farbe: "#f2b93c", schatten: "#c88f1c", x: 10, y: 42 },
  { id: "s2", farbe: "#4a9cb8", schatten: "#2d7590", x: 27, y: 42 },
  { id: "s3", farbe: "#e0663a", schatten: "#b8451d", x: 10, y: 60 },
  { id: "s4", farbe: "#7fb03c", schatten: "#5a8c28", x: 27, y: 60 },
  { id: "s5", farbe: "#d9483a", schatten: "#a52f24", x: 10, y: 78 },
  { id: "s6", farbe: "#8a6fb8", schatten: "#63499a", x: 27, y: 78 },
];

/**
 * Der Turm wächst mit jedem Stein und fällt nie um.
 * Ein Kind, das gerade zählen lernt, soll stolz sein — nicht vorsichtig.
 */
export function Turm({ onGeschafft, onWeiter, onZurueck }: StationProps) {
  // Jeder Turm bekommt eine andere Farbfolge — sechs Steine bleiben es immer.
  const [saat] = useState(neueSaat);
  const steine = useMemo(() => {
    const farben = mischen(
      STEINE.map((s) => ({ farbe: s.farbe, schatten: s.schatten })),
      saat,
    );
    return STEINE.map((stein, i) => ({ ...stein, ...farben[i] }));
  }, [saat]);

  const [gestapelt, setGestapelt] = useState<Stein[]>([]);
  const [fertig, setFertig] = useState(false);
  const [wackelt, setWackelt] = useState(false);

  const satz: LineId = gestapelt.length === 0 ? "s04-intro" : "s04-weiter";

  const stapeln = (stein: Stein, zone: string | null) => {
    if (zone !== "turm") return false;

    const neu = [...gestapelt, stein];
    setGestapelt(neu);
    sfx.thud();
    setWackelt(true);
    setTimeout(() => setWackelt(false), 600);

    const zahlSatz = zahl(neu.length);
    if (zahlSatz) void voice.speak(zahlSatz);

    if (neu.length >= ZIEL) {
      onGeschafft();
      setTimeout(() => setFertig(true), 1200);
    }
    return true;
  };

  const gestapeltIds = new Set(gestapelt.map((s) => s.id));

  return (
    <StationRahmen
      station={STATION}
      satz={satz}
      fertig={fertig}
      onWeiter={onWeiter}
      onZurueck={onZurueck}
      abschlussSatz="s04-fertig"
      unschaerfe={1.2}
      schleier={0.42}
    >
      {/* Zielmarke: so hoch soll der Turm werden */}
      <div
        className="pointer-events-none absolute z-10 flex items-center gap-[1.4cqw]"
        style={{
          left: "50%",
          top: `${BODEN - (ZIEL * STEIN_HOEHE * 4) / 3}%`,
          width: "88cqw",
          transform: "translate(-50%, -50%)",
        }}
        aria-hidden
      >
        <div
          className="h-0 flex-1"
          style={{ borderTop: "0.5cqw dashed rgba(95,107,92,0.45)" }}
        />
        <span
          className="rounded-full px-[2cqw] py-[0.8cqw] text-[2.3cqw] font-semibold whitespace-nowrap"
          style={{ background: "rgba(255,255,255,0.85)", color: "#5f6b5c" }}
        >
          ⭐ So hoch!
        </span>
      </div>

      {/* ------------------------------------------------------- Der Turm */}
      <Ablage
        id="turm"
        toleranzCqw={9}
        style={{
          position: "absolute",
          left: "68%",
          top: `${BODEN - 24}%`,
          width: "26cqw",
          height: "62cqw",
          transform: "translate(-50%, -100%)",
          zIndex: 5,
        }}
      />

      {/* Bodenlinie */}
      <div
        className="pointer-events-none absolute z-10"
        style={{
          left: "68%",
          top: `${BODEN}%`,
          width: "30cqw",
          height: "1.2cqw",
          transform: "translate(-50%, -50%)",
          borderRadius: "9999px",
          background: "rgba(120,90,60,0.25)",
        }}
        aria-hidden
      />

      <motion.div
        className="pointer-events-none absolute z-20"
        style={{
          left: "68%",
          top: `${BODEN}%`,
          // `translate` statt `transform` — Motion würde `transform` beim
          // Wackeln überschreiben und die Zentrierung mitnehmen.
          translate: "-50%",
          transformOrigin: "bottom center",
        }}
        animate={wackelt ? { rotate: [0, -1.6, 1.4, -0.7, 0] } : { rotate: 0 }}
        transition={{ duration: 0.6 }}
        aria-hidden
      >
        {gestapelt.map((stein, i) => (
          <motion.div
            key={stein.id}
            className="absolute"
            style={{
              left: "50%",
              bottom: `${i * STEIN_HOEHE}cqw`,
              translate: "-50%",
            }}
            initial={{ y: "-14cqw", opacity: 0, scale: 1.1 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 420, damping: 22 }}
          >
            <SteinGrafik stein={stein} nummer={i + 1} />
          </motion.div>
        ))}
      </motion.div>

      {/* ------------------------------------------------------- Der Vorrat */}
      {steine.filter((s) => !gestapeltIds.has(s.id)).map((stein, i) => (
        <Ziehbar
          key={stein.id}
          id={stein.id}
          onAblegen={(zone) => stapeln(stein, zone)}
          hinweis={gestapelt.length === 0 && i === 0}
          x={stein.x}
          y={stein.y}
          breite={STEIN_BREITE}
        >
          <SteinGrafik stein={stein} />
        </Ziehbar>
      ))}

      {/* Zähler */}
      <div
        className="pointer-events-none absolute z-30 flex items-center gap-[1.2cqw] rounded-full px-[2.6cqw] py-[1.2cqw] shadow-md"
        style={{
          left: "68%",
          top: "24%",
          transform: "translate(-50%, -50%)",
          background: "rgba(255,255,255,0.88)",
        }}
      >
        <span className="text-[5cqw] leading-none font-bold" style={{ color: "#e8622a" }}>
          {gestapelt.length}
        </span>
        <span className="text-[2.4cqw] font-semibold" style={{ color: "#5f6b5c" }}>
          von {ZIEL}
        </span>
      </div>
    </StationRahmen>
  );
}

function SteinGrafik({ stein, nummer }: { stein: Stein; nummer?: number }) {
  return (
    <div
      className="relative grid place-items-center"
      style={{
        width: `${STEIN_BREITE}cqw`,
        height: `${STEIN_HOEHE}cqw`,
        borderRadius: "1.4cqw",
        background: `linear-gradient(180deg, ${stein.farbe}, ${stein.schatten})`,
        boxShadow: `inset 0 0.6cqw 0 rgba(255,255,255,0.35), 0 0.6cqw 1.2cqw rgba(0,0,0,0.22)`,
      }}
    >
      {nummer !== undefined && (
        <span className="text-[3.6cqw] font-bold text-white/85">{nummer}</span>
      )}
    </div>
  );
}
