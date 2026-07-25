"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Buehne } from "./Buehne";
import { Sprechblase } from "./Sprechblase";
import { Jubel } from "./Jubel";
import { TonKnopf } from "./TonKnopf";
import type { LineId } from "@/lib/lines";
import type { Station } from "@/lib/stations";
import * as voice from "@/lib/voice";

export interface StationProps {
  /** Sofort beim Abschluss aufrufen — merkt den Fortschritt. */
  onGeschafft: () => void;
  /** Weiter zur nächsten Station. */
  onWeiter: () => void;
  /** Zurück zur Tagesübersicht. */
  onZurueck: () => void;
}

/**
 * Gemeinsamer Rahmen aller elf Stationen: Buchillustration als Hintergrund,
 * Hinweistext oben, Zurück- und Tonknopf, und am Ende der Jubel.
 */
export function StationRahmen({
  station,
  satz,
  fertig,
  onWeiter,
  onZurueck,
  children,
  schleier = 0,
  unschaerfe = 0,
  helligkeit = 1,
  hintergrund,
  dunkel = false,
  weiterText,
  abschlussSatz,
  onSatzGesprochen,
  stummerRahmen = false,
}: {
  station: Station;
  /** Der Satz, der gerade oben steht. */
  satz: LineId | null;
  fertig: boolean;
  onWeiter: () => void;
  onZurueck: () => void;
  children: ReactNode;
  schleier?: number;
  unschaerfe?: number;
  helligkeit?: number;
  hintergrund?: string;
  dunkel?: boolean;
  weiterText?: string;
  abschlussSatz: LineId;
  /** Wird aufgerufen, sobald ein Hinweis zu Ende vorgelesen ist. */
  onSatzGesprochen?: (satz: LineId) => void;
  /**
   * Die Station spricht selbst.
   *
   * Nötig, wo auf einen Tipp zwei Sätze folgen — eine Reaktion und der
   * nächste Auftrag. Die müssen nacheinander kommen, und nur die Station
   * kennt ihre Reihenfolge.
   */
  stummerRahmen?: boolean;
}) {
  const gesprochen = useRef<LineId | null>(null);
  // Über eine Ref, damit ein neuer Rückruf den Satz nicht erneut auslöst.
  const fertigGesprochenRef = useRef(onSatzGesprochen);
  useEffect(() => {
    fertigGesprochenRef.current = onSatzGesprochen;
  });

  // Jeder neue Hinweis wird einmal vorgelesen.
  useEffect(() => {
    if (!satz || fertig || stummerRahmen) return;
    if (gesprochen.current === satz) return;
    gesprochen.current = satz;
    let abgebrochen = false;
    void voice.speak(satz).then(() => {
      if (!abgebrochen) fertigGesprochenRef.current?.(satz);
    });
    return () => {
      abgebrochen = true;
    };
  }, [satz, fertig, stummerRahmen]);

  useEffect(() => () => voice.stopSpeaking(true), []);

  return (
    <Buehne
      bild={station.szene}
      schleier={schleier}
      unschaerfe={unschaerfe}
      helligkeit={helligkeit}
      hintergrund={hintergrund}
    >
      <Sprechblase id={fertig ? null : satz} dunkel={dunkel} />

      <button
        type="button"
        onClick={() => {
          voice.stopSpeaking(true);
          onZurueck();
        }}
        aria-label="Zurück zur Übersicht"
        className="absolute top-[2cqw] left-[2cqw] z-40 grid size-[7cqw] place-items-center rounded-full shadow-md transition active:scale-90"
        style={{ background: dunkel ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.82)" }}
      >
        <svg viewBox="0 0 24 24" className="size-[4cqw]" aria-hidden>
          <path
            d="M15 5l-7 7 7 7"
            fill="none"
            stroke={dunkel ? "#fdf6ec" : "#5f6b5c"}
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <TonKnopf dunkel={dunkel} />

      {children}

      <Jubel
        sichtbar={fertig}
        sticker={station.sticker}
        abschlussSatz={abschlussSatz}
        onWeiter={onWeiter}
        weiterText={weiterText}
        dunkel={dunkel}
      />
    </Buehne>
  );
}
