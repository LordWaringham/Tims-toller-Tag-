"use client";

import { useState } from "react";
import { STATIONS } from "@/lib/stations";

/** Kurze Erklärseite für Eltern — bewusst schlicht und ohne Spielreize. */
export function Elternseite({
  onZurueck,
  onZuruecksetzen,
  anzahlFertig,
}: {
  onZurueck: () => void;
  onZuruecksetzen: () => void;
  anzahlFertig: number;
}) {
  const [sicher, setSicher] = useState(false);

  return (
    <div className="min-h-dvh w-full bg-creme px-5 py-8">
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold" style={{ color: "#54604f" }}>
            Erläuterungen für Erwachsene
          </h1>
          <button
            type="button"
            onClick={onZurueck}
            className="rounded-full bg-white px-5 py-2 text-sm font-semibold shadow-sm"
            style={{ color: "#5f6b5c" }}
          >
            Zurück
          </button>
        </div>

        <section className="rounded-2xl bg-white/70 p-5 text-sm leading-relaxed">
          <p>
            Dieses Spiel folgt dem Bilderbuch <em>„Tims toller Tag“</em>. Jede Buchseite ist eine
            Station — vom Aufwachen bis zum Gutenachtgruß. Die Stationen werden der Reihe nach
            freigeschaltet.
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5">
            <li>Man kann nicht verlieren. Es gibt keine Zeit, keine Punkte, kein Rot.</li>
            <li>Alles wird vorgelesen — Lesen ist nicht nötig.</li>
            <li>Keine Werbung, keine Käufe, keine Verbindung nach außen.</li>
            <li>Der Fortschritt bleibt nur auf diesem Gerät.</li>
          </ul>
        </section>

        <section className="rounded-2xl bg-white/70 p-5">
          <h2 className="mb-3 text-base font-semibold" style={{ color: "#54604f" }}>
            Was dabei geübt wird
          </h2>
          <ul className="space-y-1.5 text-sm">
            {STATIONS.map((s, i) => (
              <li key={s.id} className="flex gap-3">
                <span className="w-5 shrink-0 text-right tabular-nums opacity-60">{i + 1}.</span>
                <span className="w-32 shrink-0 font-medium">{s.titel}</span>
                <span className="opacity-75">{s.lernziel}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl bg-white/70 p-5">
          <h2 className="mb-2 text-base font-semibold" style={{ color: "#54604f" }}>
            Fortschritt
          </h2>
          <p className="mb-3 text-sm">
            {anzahlFertig} von {STATIONS.length} Stationen geschafft.
          </p>
          {sicher ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  onZuruecksetzen();
                  setSicher(false);
                }}
                className="rounded-full bg-[#d9541c] px-5 py-2 text-sm font-semibold text-white"
              >
                Ja, alles zurücksetzen
              </button>
              <button
                type="button"
                onClick={() => setSicher(false)}
                className="rounded-full bg-black/5 px-5 py-2 text-sm font-semibold"
                style={{ color: "#5f6b5c" }}
              >
                Abbrechen
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setSicher(true)}
              className="rounded-full bg-black/5 px-5 py-2 text-sm font-semibold"
              style={{ color: "#5f6b5c" }}
            >
              Von vorne beginnen
            </button>
          )}
        </section>
      </div>
    </div>
  );
}
