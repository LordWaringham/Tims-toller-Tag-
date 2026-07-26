"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { STATIONS, type StationId } from "@/lib/stations";

/**
 * Die gesammelten Sticker, klein am unteren Rand des Spiels.
 *
 * Am Ende jeder Station heißt es „Dafür bekommst du einen Sticker" — bisher
 * war danach nicht zu sehen, wo der Sticker eigentlich hinkommt. Jetzt liegen
 * alle elf sichtbar am Rand: die verdienten in Farbe, die kommenden als blasse
 * Punkte. Ein Kind, das noch nicht lesen kann, sieht damit auf einen Blick,
 * wie weit der Tag ist und wie viel noch vor ihm liegt.
 *
 * Die Leiste nimmt keine Tipps an — sie liegt über der Bühne und dürfte sonst
 * ein Spielelement darunter blockieren.
 */
export function Stickerleiste({
  istFertig,
  gerade,
  dunkel = false,
}: {
  istFertig: (id: StationId) => boolean;
  /** Die Station, die gerade gespielt wird — bekommt einen Ring. */
  gerade?: StationId;
  dunkel?: boolean;
}) {
  /*
   * Welcher Sticker ist gerade eben dazugekommen?
   *
   * Der Fortschritt wird in dem Moment vermerkt, in dem die Aufgabe gelöst
   * ist — zwei Sekunden bevor der Jubel kommt. Damit das Kind sofort merkt,
   * dass es geschafft hat, springt genau dieser eine Sticker sichtbar in die
   * Leiste, statt nur still zu erscheinen.
   */
  const [frisch, setFrisch] = useState<StationId | null>(null);
  const bekannt = useRef<Set<StationId> | null>(null);
  const fertigeIds = STATIONS.filter((st) => istFertig(st.id))
    .map((st) => st.id)
    .join(",");

  useEffect(() => {
    const jetzt = new Set(STATIONS.filter((st) => istFertig(st.id)).map((st) => st.id));
    if (bekannt.current === null) {
      // Beim ersten Rendern ist nichts „neu" — sonst hüpfte die halbe Leiste.
      bekannt.current = jetzt;
      return;
    }
    const neu = [...jetzt].find((id) => !bekannt.current?.has(id));
    bekannt.current = jetzt;
    if (!neu) return;
    setFrisch(neu);
    const t = setTimeout(() => setFrisch(null), 1400);
    return () => clearTimeout(t);
    // fertigeIds ist der eigentliche Auslöser: eine Zeichenkette, die sich
    // genau dann ändert, wenn ein Sticker dazukommt.
  }, [fertigeIds, istFertig]);

  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0 z-[60] flex justify-center pb-[0.8cqw]"
      aria-hidden
    >
      <div
        className="flex items-center gap-[0.7cqw] rounded-full px-[1.4cqw] py-[0.6cqw]"
        style={{
          background: dunkel ? "rgba(20,28,56,0.34)" : "rgba(255,255,255,0.42)",
          backdropFilter: "blur(3px)",
        }}
      >
        {STATIONS.map((station) => {
          const geschafft = istFertig(station.id);
          return (
            <motion.span
              key={station.id}
              className="grid place-items-center rounded-full"
              style={{
                width: "3.4cqw",
                height: "3.4cqw",
                background: geschafft
                  ? "rgba(255,255,255,0.9)"
                  : dunkel
                    ? "rgba(255,255,255,0.16)"
                    : "rgba(0,0,0,0.08)",
                boxShadow:
                  station.id === frisch
                    ? "0 0 0 0.6cqw rgba(255,214,102,0.95), 0 0 2.4cqw rgba(255,200,80,0.9)"
                    : station.id === gerade
                      ? "0 0 0 0.45cqw rgba(240,129,60,0.85)"
                      : "none",
              }}
              initial={false}
              animate={
                station.id === frisch
                  ? { scale: [0.8, 1.9, 1.15, 1], opacity: 1, y: ["0cqw", "-2.4cqw", "0cqw"] }
                  : { scale: geschafft ? 1 : 0.8, opacity: geschafft ? 1 : 0.62, y: 0 }
              }
              transition={
                station.id === frisch
                  ? { duration: 1.1, times: [0, 0.35, 0.6, 1], ease: "easeOut" }
                  : { type: "spring", stiffness: 260, damping: 18 }
              }
            >
              <span
                className="leading-none"
                style={{ fontSize: "2.2cqw", filter: geschafft ? "none" : "grayscale(1)" }}
              >
                {geschafft ? station.sticker : "•"}
              </span>
            </motion.span>
          );
        })}
      </div>
    </div>
  );
}
