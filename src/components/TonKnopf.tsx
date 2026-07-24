"use client";

import { useEffect, useSyncExternalStore } from "react";
import * as voice from "@/lib/voice";

/** Ton an/aus — klein und oben rechts, damit er nicht zum Spielzeug wird. */
export function TonKnopf({ dunkel = false }: { dunkel?: boolean }) {
  const stumm = useSyncExternalStore(
    voice.subscribeMuted,
    voice.getMutedSnapshot,
    voice.getMutedServerSnapshot,
  );

  // Beim ersten Mal die gespeicherte Einstellung übernehmen.
  useEffect(() => {
    voice.restoreMuted();
  }, []);

  const farbe = dunkel ? "#fdf6ec" : "#5f6b5c";

  return (
    <button
      type="button"
      onClick={() => voice.setMuted(!stumm)}
      aria-label={stumm ? "Ton einschalten" : "Ton ausschalten"}
      className="absolute top-[2cqw] right-[2cqw] z-40 grid size-[7cqw] place-items-center rounded-full shadow-md transition active:scale-90"
      style={{ background: dunkel ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.82)" }}
    >
      <svg viewBox="0 0 24 24" className="size-[4cqw]" aria-hidden>
        <path d="M4 9.5h3.2L12 5.6v12.8L7.2 14.5H4z" fill={farbe} />
        {stumm ? (
          <path
            d="M16 9.5l5 5m0-5l-5 5"
            fill="none"
            stroke={farbe}
            strokeWidth="2"
            strokeLinecap="round"
          />
        ) : (
          <path
            d="M15.4 8.6a4.6 4.6 0 0 1 0 6.8M17.9 6a8 8 0 0 1 0 12"
            fill="none"
            stroke={farbe}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        )}
      </svg>
    </button>
  );
}
