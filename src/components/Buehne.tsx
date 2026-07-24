"use client";

import type { CSSProperties, ReactNode } from "react";
import { DropBereich } from "./dnd";

/**
 * Die Spielfläche. Passt sich jedem Bildschirm an und behält dabei ihr
 * Seitenverhältnis, damit alle Elemente immer an derselben Stelle sitzen.
 */
export function Buehne({
  bild,
  children,
  schleier = 0,
  unschaerfe = 0,
  helligkeit = 1,
  hintergrund,
  className = "",
}: {
  /** Illustration aus dem Buch. */
  bild?: string;
  children: ReactNode;
  /** Weißer Schleier über dem Bild (0–1), damit Spielelemente lesbar bleiben. */
  schleier?: number;
  /** Weichzeichner in Prozent der Bühnenbreite. */
  unschaerfe?: number;
  helligkeit?: number;
  hintergrund?: string;
  className?: string;
}) {
  const bildStil: CSSProperties = {
    backgroundImage: bild ? `url(${bild})` : undefined,
    backgroundSize: "cover",
    backgroundPosition: "center",
    filter:
      unschaerfe || helligkeit !== 1
        ? `blur(${unschaerfe}cqw) brightness(${helligkeit})`
        : undefined,
    transform: unschaerfe ? "scale(1.06)" : undefined,
  };

  return (
    <div className="grid min-h-dvh w-full place-items-center bg-nacht">
      <div className={`buehne ${className}`} style={{ background: hintergrund }}>
        {bild && <div className="absolute inset-0" style={bildStil} aria-hidden />}
        {schleier > 0 && (
          <div
            className="absolute inset-0"
            style={{ background: `rgba(253, 246, 236, ${schleier})` }}
            aria-hidden
          />
        )}
        <DropBereich>{children}</DropBereich>
      </div>
    </div>
  );
}

/** Positioniert ein Element in Prozent auf der Bühne. */
export function bei(x: number, y: number): CSSProperties {
  return {
    position: "absolute",
    left: `${x}%`,
    top: `${y}%`,
    transform: "translate(-50%, -50%)",
  };
}
