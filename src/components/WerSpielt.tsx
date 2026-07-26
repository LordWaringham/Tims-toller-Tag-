"use client";

import { motion } from "motion/react";
import { KINDER, type Kind } from "@/lib/kinder";
import { useAlleStaende } from "@/lib/progress";
import * as sfx from "@/lib/sfx";
import * as voice from "@/lib/voice";

/**
 * „Wer spielt heute?"
 *
 * Drei Kinder an einem Tablet brauchen drei Spielstände — sonst findet die
 * Zweite alles schon aufgeschlossen vor. Und den eigenen Namen anzutippen ist
 * für ein Kind kein Formular, sondern ein kleines Ritual: Das bin ich.
 */
export function WerSpielt({
  onGewaehlt,
  onZurueck,
}: {
  onGewaehlt: (kind: Kind) => void;
  onZurueck: () => void;
}) {
  /*
   * Der Stand kommt aus dem Speicher und nicht als Eigenschaft herein.
   *
   * Sonst bliebe die Zahl unter dem Gastplatz stehen, nachdem er
   * zurückgesetzt wurde: Diese Seite bekäme davon nichts mit.
   */
  const { staende, einzelnZuruecksetzen } = useAlleStaende();
  const fortschritt = (kindId: string) =>
    staende.find((s) => s.kind.id === kindId)?.anzahl ?? 0;
  const waehlen = (kind: Kind) => {
    sfx.chime(KINDER.indexOf(kind) * 2 + 3);
    // Bleibt still, bis eine eigene Aufnahme dafür vorliegt.
    void voice.speakWennAufgenommen(`hallo-${kind.id}`);
    onGewaehlt(kind);
  };

  /*
   * Vier Plätze passen nur kleiner nebeneinander.
   *
   * 24cqw waren für drei gedacht; zu viert ragten sie über die Bühne hinaus.
   * Die Größe hängt deshalb an der Anzahl und nicht an einer festen Zahl.
   */
  const gross = KINDER.length <= 3;
  const groesse = gross ? 24 : 19;
  const abstand = gross ? 4 : 2.6;

  return (
    <div className="grid min-h-dvh w-full place-items-center bg-nacht">
      <div
        className="buehne"
        style={{ background: "linear-gradient(180deg, #fdf6ec 0%, #f6e6cd 100%)" }}
      >
        <button
          type="button"
          onClick={onZurueck}
          aria-label="Zurück"
          className="absolute top-[2cqw] left-[2cqw] z-40 grid size-[8cqw] place-items-center rounded-full bg-white/85 shadow-md transition active:scale-90"
        >
          <svg viewBox="0 0 24 24" className="size-[4.6cqw]" aria-hidden>
            <path
              d="M15 5l-7 7 7 7"
              fill="none"
              stroke="#5f6b5c"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <div className="absolute inset-0 flex flex-col items-center justify-center gap-[4cqw] px-[6cqw]">
          <h2 className="text-[5.5cqw] font-bold" style={{ color: "#54604f" }}>
            Wer spielt heute?
          </h2>

          <div className="flex items-start" style={{ gap: `${abstand}cqw` }}>
            {KINDER.map((kind, i) => {
              const geschafft = fortschritt(kind.id);
              return (
                <div key={kind.id} className="relative flex flex-col items-center">
                  <motion.button
                    type="button"
                    onClick={() => waehlen(kind)}
                    aria-label={`${kind.name} spielt`}
                    className="flex flex-col items-center gap-[1.4cqw] border-none bg-transparent p-0"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: i * 0.09, type: "spring", stiffness: 240, damping: 16 }}
                    whileTap={{ scale: 0.93 }}
                  >
                    <span
                      className="grid place-items-center rounded-full shadow-lg"
                      style={{
                        width: `${groesse}cqw`,
                        height: `${groesse}cqw`,
                        background: `radial-gradient(circle at 35% 30%, ${kind.hell}, ${kind.farbe})`,
                        border: "0.9cqw solid rgba(255,255,255,0.9)",
                      }}
                    >
                      <span
                        className="px-[1cqw] text-center leading-none font-bold text-white"
                        style={{
                          fontSize: `${groesse * 0.21}cqw`,
                          textShadow: "0 0.3cqw 0.8cqw rgba(0,0,0,0.25)",
                        }}
                      >
                        {kind.name}
                      </span>
                    </span>
                    <span
                      className="text-center text-[2.2cqw]"
                      style={{ color: "#9aa697", maxWidth: `${groesse + 4}cqw` }}
                    >
                      {geschafft === 0
                        ? "noch nicht angefangen"
                        : geschafft === 11
                          ? "ganzer Tag geschafft"
                          : `${geschafft} von 11`}
                    </span>
                  </motion.button>

                  {/*
                    Nur beim Gastplatz und nur, wenn dort etwas steht.

                    Der nächste Besuch ist ein anderes Kind — und das soll den
                    Tag von vorn erleben, nicht bei Station neun einsteigen.
                    Ein Tipp genügt; zu verlieren ist hier nichts, was jemandem
                    gehört.
                  */}
                  {kind.gast && geschafft > 0 && (
                    <button
                      type="button"
                      onClick={() => einzelnZuruecksetzen(kind.id)}
                      aria-label="Gastplatz von vorn beginnen"
                      className="absolute rounded-full bg-white text-[2.4cqw] shadow-md transition active:scale-90"
                      style={{
                        top: `${groesse * 0.04}cqw`,
                        right: `-${groesse * 0.06}cqw`,
                        width: "7cqw",
                        height: "7cqw",
                        color: "#5f6b5c",
                      }}
                    >
                      ↺
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
