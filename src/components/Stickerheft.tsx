"use client";

import { motion } from "motion/react";
import { STATIONS, type StationId } from "@/lib/stations";

/** Alle gesammelten Sticker auf einen Blick. */
export function Stickerheft({
  istFertig,
  onZurueck,
}: {
  istFertig: (id: StationId) => boolean;
  onZurueck: () => void;
}) {
  const geschafft = STATIONS.filter((s) => istFertig(s.id)).length;

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

        <div className="flex min-h-full flex-col items-center justify-center gap-[1.8cqw] px-[6cqw] py-[9cqw]">
          <h2 className="text-[4.6cqw] font-bold" style={{ color: "#54604f" }}>
            Deine Sticker
          </h2>
          <p className="text-[2.8cqw]" style={{ color: "#7b8878" }}>
            {geschafft} von {STATIONS.length} gesammelt
          </p>

          <div className="grid grid-cols-4 gap-[1.8cqw]">
            {STATIONS.map((station, i) => {
              const hat = istFertig(station.id);
              return (
                <motion.div
                  key={station.id}
                  className="flex flex-col items-center gap-[0.5cqw]"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.05, type: "spring", stiffness: 260, damping: 18 }}
                >
                  <span
                    className="grid size-[12.5cqw] place-items-center rounded-full shadow-md"
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
                      className="text-[6.6cqw] leading-none"
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
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
