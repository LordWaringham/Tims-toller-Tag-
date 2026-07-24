"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { STATIONS, type StationId } from "@/lib/stations";
import * as voice from "@/lib/voice";
import * as sfx from "@/lib/sfx";

/**
 * Alle gesammelten Sticker auf einen Blick.
 *
 * Jeder Sticker lässt sich antippen und erzählt dann noch einmal, wie seine
 * Station ausging — mit denselben Sätzen aus dem Buch. So ist das Heft nicht
 * nur eine Bilanz, sondern selbst etwas zum Spielen.
 */
export function Stickerheft({
  istFertig,
  onZurueck,
}: {
  istFertig: (id: StationId) => boolean;
  onZurueck: () => void;
}) {
  const geschafft = STATIONS.filter((s) => istFertig(s.id)).length;
  const [spricht, setSpricht] = useState<StationId | null>(null);

  const erzaehlen = async (id: StationId) => {
    const station = STATIONS.find((s) => s.id === id);
    if (!station) return;
    sfx.chime(STATIONS.indexOf(station) + 2);
    setSpricht(id);
    await voice.speak(station.abschluss);
    setSpricht((jetzt) => (jetzt === id ? null : jetzt));
  };

  return (
    <div className="grid min-h-dvh w-full place-items-center bg-nacht">
      <div
        className="buehne overflow-y-auto"
        style={{ background: "linear-gradient(180deg, #fdf6ec 0%, #f6e6cd 100%)" }}
      >
        <button
          type="button"
          onClick={onZurueck}
          aria-label="Zurück"
          className="absolute top-[2cqw] left-[2cqw] z-40 grid size-[7cqw] place-items-center rounded-full bg-white/85 shadow-md transition active:scale-90"
        >
          <svg viewBox="0 0 24 24" className="size-[4cqw]" aria-hidden>
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

        <div className="flex min-h-full flex-col items-center justify-center gap-[1.3cqw] px-[5cqw] py-[3cqw]">
          <h2 className="text-[4.6cqw] font-bold" style={{ color: "#54604f" }}>
            Deine Sticker
          </h2>
          <p className="text-[2.8cqw]" style={{ color: "#7b8878" }}>
            {geschafft} von {STATIONS.length} gesammelt
          </p>
          {geschafft > 0 && (
            <p className="text-[2.2cqw]" style={{ color: "#a3ada0" }}>
              Tippe einen Sticker an, dann erzählt Tim davon.
            </p>
          )}

          <div className="grid grid-cols-4 gap-[1.5cqw]">
            {STATIONS.map((station, i) => {
              const hat = istFertig(station.id);
              return (
                <motion.button
                  key={station.id}
                  type="button"
                  disabled={!hat}
                  aria-label={
                    hat ? `${station.titel} — nochmal anhören` : `${station.titel} — noch nicht gesammelt`
                  }
                  onClick={() => erzaehlen(station.id)}
                  className="flex flex-col items-center gap-[0.5cqw] border-none bg-transparent p-0"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={
                    spricht === station.id
                      ? { scale: [1, 1.12, 1], opacity: 1 }
                      : { scale: 1, opacity: 1 }
                  }
                  whileTap={hat ? { scale: 0.92 } : undefined}
                  transition={
                    spricht === station.id
                      ? { duration: 0.9, repeat: Infinity, ease: "easeInOut" }
                      : { delay: i * 0.05, type: "spring", stiffness: 260, damping: 18 }
                  }
                >
                  <span
                    className="grid size-[11.5cqw] place-items-center rounded-full shadow-md"
                    style={{
                      background: hat
                        ? "radial-gradient(circle at 35% 30%, #fff9ec, #f4d49c)"
                        : "rgba(0,0,0,0.05)",
                      border: hat
                        ? "0.6cqw solid rgba(255,255,255,0.95)"
                        : "0.4cqw dashed rgba(95,107,92,0.28)",
                    }}
                  >
                    <span
                      className="text-[6cqw] leading-none"
                      style={{ filter: hat ? undefined : "grayscale(1)", opacity: hat ? 1 : 0.25 }}
                    >
                      {station.sticker}
                    </span>
                  </span>
                  <span
                    className="text-center text-[1.9cqw] leading-tight font-medium"
                    style={{ color: hat ? "#5f6b5c" : "#a3ada0" }}
                  >
                    {station.titel}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
