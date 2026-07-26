"use client";

import { useEffect, useMemo } from "react";
import { motion } from "motion/react";
import { STATIONS } from "@/lib/stations";
import { LINES } from "@/lib/lines";
import * as voice from "@/lib/voice";
import * as sfx from "@/lib/sfx";
import { streuIn } from "@/lib/streu";
import { SCHENKER, type Kind } from "@/lib/kinder";

/** Der Abschluss des ganzen Tages — ruhig, warm, ohne Punktestand. */
export function Finale({
  kind,
  onKarte,
  onNochmal,
}: {
  kind: Kind | null;
  onKarte: () => void;
  onNochmal: () => void;
}) {
  const sterne = useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => ({
        id: i,
        x: streuIn(i, 1, 0, 100),
        y: streuIn(i, 2, 0, 62),
        r: streuIn(i, 3, 0.25, 0.8),
        dauer: streuIn(i, 4, 2, 5),
        verzoegerung: streuIn(i, 5, 0, 3),
      })),
    [],
  );

  useEffect(() => {
    sfx.nightBell(3);
    void (async () => {
      await voice.speakSequence(["finale", "finale-stolz"], 400);
      // Tims Freunde aus den Büchern — still, bis es eine Aufnahme gibt.
      await voice.speakWennAufgenommen("tim-morgen");
    })();
    return () => voice.stopSpeaking(true);
  }, []);

  return (
    <div className="grid min-h-dvh w-full place-items-center bg-nacht">
      <div
        className="buehne"
        style={{ background: "linear-gradient(180deg, #101832 0%, #2c3a66 55%, #46527e 100%)" }}
      >
        {sterne.map((s) => (
          <motion.span
            key={s.id}
            className="absolute rounded-full bg-white"
            style={{ left: `${s.x}%`, top: `${s.y}%`, width: `${s.r}cqw`, height: `${s.r}cqw` }}
            animate={{ opacity: [0.25, 1, 0.25] }}
            transition={{ duration: s.dauer, delay: s.verzoegerung, repeat: Infinity }}
          />
        ))}

        <div className="absolute inset-0 flex flex-col items-center justify-center gap-[2.4cqw] px-[8cqw] text-center">
          <motion.p
            initial={{ opacity: 0, y: "2cqw" }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-[5.2cqw] leading-tight font-semibold"
            style={{ color: "#fdf6ec" }}
          >
            {LINES["finale"]}
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4, duration: 1 }}
            className="text-[3cqw] leading-snug"
            style={{ color: "rgba(253,246,236,0.78)" }}
          >
            {kind && !kind.gast ? `Schlaf gut, ${kind.name}.` : "Schlaf gut."} Bis zum nächsten Mal —
            dein {SCHENKER}
          </motion.p>

          <motion.div
            className="flex max-w-[76cqw] flex-wrap justify-center gap-[1.4cqw]"
            initial="aus"
            animate="an"
            variants={{ an: { transition: { staggerChildren: 0.09, delayChildren: 0.5 } } }}
          >
            {STATIONS.map((s) => (
              <motion.span
                key={s.id}
                variants={{
                  aus: { scale: 0, opacity: 0 },
                  an: { scale: 1, opacity: 1 },
                }}
                transition={{ type: "spring", stiffness: 260, damping: 16 }}
                className="grid size-[10cqw] place-items-center rounded-full"
                style={{
                  background: "radial-gradient(circle at 35% 30%, #fff9ec, #f0cd94)",
                  boxShadow: "0 0 2.5cqw rgba(255,224,160,0.5)",
                }}
              >
                <span className="text-[5.5cqw] leading-none">{s.sticker}</span>
              </motion.span>
            ))}
          </motion.div>

          <motion.div
            className="mt-[2cqw] flex flex-wrap justify-center gap-[2cqw]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
          >
            <button
              type="button"
              onClick={onKarte}
              className="rounded-full px-[5.5cqw] py-[2.2cqw] text-[3.2cqw] font-semibold shadow-lg"
              style={{ background: "rgba(255,255,255,0.9)", color: "#3a4560" }}
            >
              Zur Tageskarte
            </button>
            <button
              type="button"
              onClick={onNochmal}
              className="rounded-full px-[5.5cqw] py-[2.2cqw] text-[3.2cqw] font-semibold text-white shadow-lg"
              style={{ background: "linear-gradient(180deg, #f0813c, #d9541c)" }}
            >
              Noch einmal
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
