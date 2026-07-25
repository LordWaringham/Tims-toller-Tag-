"use client";

import { motion } from "motion/react";
import { STATIONS, type StationId } from "@/lib/stations";
import * as voice from "@/lib/voice";
import * as sfx from "@/lib/sfx";
import { TonKnopf } from "./TonKnopf";
import type { Kind } from "@/lib/kinder";

/** Wo die elf Stationen auf der Bühne liegen (in Prozent). */
const PLAETZE: { x: number; y: number }[] = [
  { x: 15, y: 27 },
  { x: 38, y: 27 },
  { x: 62, y: 27 },
  { x: 85, y: 27 },
  { x: 85, y: 51 },
  { x: 62, y: 51 },
  { x: 38, y: 51 },
  { x: 15, y: 51 },
  { x: 22, y: 75 },
  { x: 50, y: 75 },
  { x: 78, y: 75 },
];

/** Der Weg durch den Tag — im SVG-Koordinatensystem 100 × 75 (4:3). */
const WEG =
  "M15 20.25 L85 20.25 Q93 20.25 93 29.25 Q93 38.25 85 38.25 L15 38.25 Q7 38.25 7 47.25 Q7 56.25 22 56.25 L78 56.25";

export function Tageskarte({
  kind,
  istOffen,
  istFertig,
  naechste,
  onStation,
  onSticker,
  onTitel,
}: {
  kind: Kind | null;
  istOffen: (id: StationId) => boolean;
  istFertig: (id: StationId) => boolean;
  naechste: StationId | null;
  onStation: (id: StationId) => void;
  onSticker: () => void;
  onTitel: () => void;
}) {
  // Der Himmel färbt sich mit dem Tagesfortschritt.
  const geschafft = STATIONS.filter((s) => istFertig(s.id)).length;
  const stand = STATIONS[Math.min(geschafft, STATIONS.length - 1)];
  const [oben, unten] = stand.himmel;
  const spaet = geschafft >= STATIONS.length - 1;

  const antippen = (id: StationId, offen: boolean) => {
    if (!offen) {
      sfx.nope();
      void voice.speak("gesperrt");
      return;
    }
    sfx.pop();
    onStation(id);
  };

  return (
    <div className="grid min-h-dvh w-full place-items-center bg-nacht">
      <div
        className="buehne"
        style={{ background: `linear-gradient(180deg, ${oben} 0%, ${unten} 100%)` }}
      >
        {/* Wiese am unteren Rand */}
        <div
          className="absolute inset-x-0 bottom-0 h-[22%]"
          style={{
            background: `linear-gradient(180deg, ${spaet ? "#2c4a3a" : "#8fbf46"} 0%, ${spaet ? "#1d3328" : "#5f9c2c"} 100%)`,
            borderTopLeftRadius: "50% 18%",
            borderTopRightRadius: "50% 18%",
          }}
          aria-hidden
        />

        <button
          type="button"
          onClick={onTitel}
          aria-label="Zum Titelbild"
          className="absolute top-[2cqw] left-[2cqw] z-40 grid size-[7cqw] place-items-center rounded-full bg-white/80 shadow-md transition active:scale-90"
        >
          <svg viewBox="0 0 24 24" className="size-[4cqw]" aria-hidden>
            <path
              d="M4 11.5 12 4l8 7.5M6.5 10v9h11v-9"
              fill="none"
              stroke="#5f6b5c"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <TonKnopf dunkel={spaet} />

        <div className="absolute inset-x-0 top-[2.5cqw] z-30 flex justify-center">
          <h2
            className="rounded-full px-[4cqw] py-[1cqw] text-[3.4cqw] font-semibold shadow-sm"
            style={{ background: "rgba(255,255,255,0.85)", color: "#4f5c4c" }}
          >
            {kind ? `${kind.name}s Tag mit Tim` : "Tims Tag"}
          </h2>
        </div>

        {/* Der Weg */}
        <svg viewBox="0 0 100 75" className="absolute inset-0 size-full" aria-hidden>
          <path
            d={WEG}
            fill="none"
            stroke={spaet ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.55)"}
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          <path
            d={WEG}
            fill="none"
            stroke={spaet ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.95)"}
            strokeWidth="1.1"
            strokeLinecap="round"
            strokeDasharray="2 3"
          />
        </svg>

        {/* Die Stationen */}
        {STATIONS.map((station, i) => {
          const platz = PLAETZE[i];
          const offen = istOffen(station.id);
          const fertig = istFertig(station.id);
          const dran = station.id === naechste;

          return (
            <motion.button
              key={station.id}
              type="button"
              onClick={() => antippen(station.id, offen)}
              aria-label={`${i + 1}. ${station.titel}${offen ? "" : " — noch geschlossen"}`}
              className="absolute z-20 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-[0.6cqw]"
              style={{ left: `${platz.x}%`, top: `${platz.y}%` }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: dran ? [1, 1.09, 1] : 1,
                opacity: 1,
              }}
              transition={
                dran
                  ? { scale: { duration: 1.6, repeat: Infinity, ease: "easeInOut" } }
                  : { delay: i * 0.025, type: "spring", stiffness: 300, damping: 20 }
              }
              whileTap={{ scale: 0.9 }}
            >
              <span
                className="grid size-[13cqw] place-items-center rounded-full shadow-lg"
                style={{
                  background: fertig
                    ? "radial-gradient(circle at 35% 30%, #fff7e6, #f4d49c)"
                    : offen
                      ? "radial-gradient(circle at 35% 30%, #ffffff, #dfe9d8)"
                      : "rgba(74, 84, 78, 0.55)",
                  border: dran
                    ? "0.8cqw solid #f0813c"
                    : "0.5cqw solid rgba(255,255,255,0.9)",
                  opacity: offen ? 1 : 0.85,
                }}
              >
                {fertig || offen ? (
                  <span className="text-[7cqw] leading-none">
                    {fertig ? station.sticker : i + 1}
                  </span>
                ) : (
                  <svg viewBox="0 0 24 24" className="size-[6cqw]" aria-hidden>
                    <path
                      d="M7 10V7.5a5 5 0 0 1 10 0V10M5.5 10h13v9.5h-13z"
                      fill="none"
                      stroke="rgba(255,255,255,0.9)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </span>
              <span
                className="rounded-full px-[1.4cqw] py-[0.3cqw] text-[2.1cqw] font-medium whitespace-nowrap"
                style={{
                  background: "rgba(255,255,255,0.82)",
                  color: "#5f6b5c",
                  opacity: offen ? 1 : 0.7,
                }}
              >
                {station.titel}
              </span>
            </motion.button>
          );
        })}

        {/* Stickerheft */}
        <button
          type="button"
          onClick={onSticker}
          className="absolute right-[2.5cqw] bottom-[2.5cqw] z-30 flex items-center gap-[1.4cqw] rounded-full bg-white/88 px-[3.2cqw] py-[1.6cqw] shadow-lg transition active:scale-95"
        >
          <span className="text-[4cqw] leading-none">🌟</span>
          <span className="text-[2.8cqw] font-semibold" style={{ color: "#5f6b5c" }}>
            {geschafft} von {STATIONS.length}
          </span>
        </button>
      </div>
    </div>
  );
}
