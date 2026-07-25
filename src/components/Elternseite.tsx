"use client";

import { useState } from "react";
import { STATIONS } from "@/lib/stations";
import { useAlleStaende } from "@/lib/progress";

/** Kurze Erklärseite für Eltern — bewusst schlicht und ohne Spielreize. */
export function Elternseite({ onZurueck }: { onZurueck: () => void }) {
  const [sicher, setSicher] = useState(false);
  // Die Seite wird vom Titelbild aus geöffnet, also bevor ein Kind gewählt ist.
  // Sie zeigt deshalb alle drei Stände statt eines einzelnen.
  const { staende, einzelnZuruecksetzen, allesZuruecksetzen } = useAlleStaende();

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
          <ul className="mb-4 space-y-2">
            {staende.map(({ kind, anzahl }) => (
              <li key={kind.id} className="flex items-center gap-3 text-sm">
                <span
                  className="grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold text-white"
                  style={{ background: kind.farbe }}
                >
                  {kind.name[0]}
                </span>
                <span className="w-16 font-medium">{kind.name}</span>
                <span className="flex-1 opacity-75">
                  {anzahl} von {STATIONS.length} Stationen
                </span>
                {anzahl > 0 && (
                  <button
                    type="button"
                    onClick={() => einzelnZuruecksetzen(kind.id)}
                    className="rounded-full bg-black/5 px-3 py-1 text-xs font-medium"
                    style={{ color: "#8b978a" }}
                  >
                    zurücksetzen
                  </button>
                )}
              </li>
            ))}
          </ul>
          {sicher ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  allesZuruecksetzen();
                  setSicher(false);
                }}
                className="rounded-full bg-[#d9541c] px-5 py-2 text-sm font-semibold text-white"
              >
                Ja, bei allen dreien
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
              Bei allen dreien von vorne beginnen
            </button>
          )}
        </section>
      </div>
    </div>
  );
}
