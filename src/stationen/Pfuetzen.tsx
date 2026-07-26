"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { StationRahmen, type StationProps } from "@/components/StationRahmen";
import { Tippziel } from "@/components/Tippziel";
import { ERFOLGSPAUSE, STATIONS } from "@/lib/stations";
import type { LineId } from "@/lib/lines";
import * as sfx from "@/lib/sfx";
import * as voice from "@/lib/voice";
import { streuIn } from "@/lib/streu";

const STATION = STATIONS[7];

/**
 * Tim ist schon auf dem Bild — er stapft in Gummistiefeln durch den Regen.
 * Hier kommen nur die Pfützen dazu, in die das Kind ihn springen lässt.
 */
const PFUETZEN = [
  { id: "p1", x: 11, y: 80, breite: 17 },
  { id: "p2", x: 30, y: 87, breite: 20 },
  { id: "p3", x: 50, y: 79, breite: 16 },
  { id: "p4", x: 70, y: 87, breite: 19 },
  { id: "p5", x: 89, y: 80, breite: 17 },
  { id: "p6", x: 50, y: 94, breite: 21 },
];

export function Pfuetzen({ onGeschafft, onWeiter, onZurueck }: StationProps) {
  const [gesprungen, setGesprungen] = useState<string[]>([]);
  const [fertig, setFertig] = useState(false);

  const satz: LineId = gesprungen.length === 0 ? "s08-erklaerung" : "s08-platsch";

  const hineinspringen = (id: string) => {
    if (gesprungen.includes(id)) return;
    sfx.splash();
    void voice.speak("s08-platsch");
    const neu = [...gesprungen, id];
    setGesprungen(neu);
    if (neu.length >= PFUETZEN.length) {
      onGeschafft();
      setTimeout(() => setFertig(true), ERFOLGSPAUSE);
    }
  };

  const regen = useMemo(
    () =>
      Array.from({ length: 44 }, (_, i) => ({
        id: i,
        x: streuIn(i, 1, 0, 100),
        verzoegerung: streuIn(i, 2, 0, 1.6),
        dauer: streuIn(i, 3, 0.7, 1.2),
        laenge: streuIn(i, 4, 2, 4.5),
      })),
    [],
  );

  return (
    <StationRahmen
      station={STATION}
      satz={satz}
      fertig={fertig}
      onWeiter={onWeiter}
      onZurueck={onZurueck}
      abschlussSatz="s08-fertig"
      onSatzGesprochen={(gesagt) => {
        if (gesagt === "s08-intro") void voice.speakWennAufgenommen("tim-coco");
      }}
      schleier={0.12}
    >
      {/* ---------------------------------------------------------- Regen */}
      <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden" aria-hidden>
        {regen.map((tropfen) => (
          <motion.span
            key={tropfen.id}
            className="absolute rounded-full"
            style={{
              left: `${tropfen.x}%`,
              top: "-8%",
              width: "0.35cqw",
              height: `${tropfen.laenge}cqw`,
              background: "rgba(180,210,235,0.8)",
            }}
            animate={{ y: ["0cqh", "112cqh"] }}
            transition={{
              duration: tropfen.dauer,
              delay: tropfen.verzoegerung,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}
      </div>

      {/* Nasser Weg */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[26%]"
        style={{
          background:
            "linear-gradient(180deg, rgba(120,135,145,0) 0%, rgba(95,110,120,0.5) 40%, rgba(70,85,95,0.68) 100%)",
        }}
        aria-hidden
      />

      {/* -------------------------------------------------------- Pfützen */}
      {PFUETZEN.map((pfuetze) => {
        const drin = gesprungen.includes(pfuetze.id);
        return (
          <div key={pfuetze.id}>
            <Tippziel
              x={pfuetze.x}
              y={pfuetze.y}
              groesse={pfuetze.breite}
              aktiv={!drin}
              label="Pfütze"
              onTipp={() => hineinspringen(pfuetze.id)}
              hinweisNach={gesprungen.length === 0 ? 4000 : 0}
              ringHinweis={false}
              style={{ zIndex: 20, height: `${pfuetze.breite * 0.46}cqw` }}
            >
              <PfuetzeGrafik gesprungen={drin} />
            </Tippziel>

            {/* Spritzer beim Hineinspringen */}
            <AnimatePresence>
              {drin && (
                <div
                  className="huelle pointer-events-none z-30"
                  style={{ left: `${pfuetze.x}%`, top: `${pfuetze.y}%` }}
                  aria-hidden
                >
                  {Array.from({ length: 10 }, (_, i) => {
                    const winkel = (i / 9) * Math.PI - Math.PI;
                    return (
                      <motion.span
                        key={i}
                        className="absolute rounded-full"
                        style={{
                          width: "1.7cqw",
                          height: "1.7cqw",
                          background: "rgba(200,228,245,0.95)",
                        }}
                        initial={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
                        animate={{
                          x: `${Math.cos(winkel) * 15}cqw`,
                          y: `${Math.sin(winkel) * 11}cqw`,
                          opacity: [0, 1, 0],
                          scale: [0.4, 1, 0.6],
                        }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      />
                    );
                  })}
                </div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      {/* Zähler */}
      <div
        className="pointer-events-none absolute z-30 flex items-center gap-[1.2cqw] rounded-full px-[2.6cqw] py-[1.2cqw] shadow-md"
        style={{
          left: "12%",
          top: "26%",
          transform: "translate(-50%, -50%)",
          background: "rgba(255,255,255,0.9)",
        }}
      >
        <span className="text-[3.4cqw] leading-none">👢</span>
        <span className="text-[3cqw] font-bold" style={{ color: "#e8622a" }}>
          {gesprungen.length} von {PFUETZEN.length}
        </span>
      </div>
    </StationRahmen>
  );
}

function PfuetzeGrafik({ gesprungen }: { gesprungen: boolean }) {
  return (
    <svg viewBox="0 0 100 46" className="w-full" aria-hidden>
      <ellipse
        cx="50"
        cy="24"
        rx="47"
        ry="19"
        fill={gesprungen ? "rgba(160,200,222,0.5)" : "rgba(110,168,205,0.85)"}
        stroke="rgba(255,255,255,0.6)"
        strokeWidth="2"
      />
      <ellipse cx="36" cy="17" rx="15" ry="5" fill="rgba(255,255,255,0.4)" />
      {gesprungen && (
        <>
          <ellipse
            cx="50"
            cy="24"
            rx="31"
            ry="11"
            fill="none"
            stroke="rgba(255,255,255,0.6)"
            strokeWidth="1.8"
          />
          <ellipse
            cx="50"
            cy="24"
            rx="17"
            ry="6"
            fill="none"
            stroke="rgba(255,255,255,0.45)"
            strokeWidth="1.5"
          />
        </>
      )}
    </svg>
  );
}
