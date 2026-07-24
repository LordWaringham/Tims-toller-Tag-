"use client";

import { useCallback, useSyncExternalStore } from "react";
import { STATIONS, type StationId } from "./stations";

const KEY = "tims-toller-tag/v1";

export interface Progress {
  /** Stationen, die schon einmal geschafft wurden. */
  fertig: StationId[];
  /** Wurde der ganze Tag schon einmal durchgespielt? */
  tagGeschafft: boolean;
}

const LEER: Progress = { fertig: [], tagGeschafft: false };

/*
 * Der Fortschritt lebt außerhalb von React und wird über useSyncExternalStore
 * gelesen. So gibt es beim ersten Rendern keinen Umweg über einen Effekt, und
 * Server- und Browserstand können nicht auseinanderlaufen.
 */
let stand: Progress | null = null;
const horcher = new Set<() => void>();

function lesen(): Progress {
  if (typeof localStorage === "undefined") return LEER;
  try {
    const roh = localStorage.getItem(KEY);
    if (!roh) return LEER;
    const gelesen = JSON.parse(roh) as Partial<Progress>;
    const gueltig = new Set(STATIONS.map((s) => s.id));
    return {
      fertig: (gelesen.fertig ?? []).filter((id): id is StationId =>
        gueltig.has(id as StationId),
      ),
      tagGeschafft: Boolean(gelesen.tagGeschafft),
    };
  } catch {
    return LEER;
  }
}

function schreiben(neu: Progress) {
  stand = neu;
  try {
    localStorage.setItem(KEY, JSON.stringify(neu));
  } catch {
    /* privater Modus o. ä. — dann eben nur für diese Sitzung */
  }
  horcher.forEach((h) => h());
}

function anmelden(fn: () => void) {
  horcher.add(fn);
  return () => {
    horcher.delete(fn);
  };
}

/** Wird beim ersten Zugriff aus dem Speicher geladen. */
function momentaufnahme(): Progress {
  if (stand === null) stand = lesen();
  return stand;
}

const serverMomentaufnahme = () => LEER;

export function useProgress() {
  const progress = useSyncExternalStore(anmelden, momentaufnahme, serverMomentaufnahme);

  const abschliessen = useCallback((id: StationId) => {
    const alt = momentaufnahme();
    if (alt.fertig.includes(id)) return;
    const fertig = [...alt.fertig, id];
    schreiben({
      fertig,
      tagGeschafft: alt.tagGeschafft || fertig.length === STATIONS.length,
    });
  }, []);

  const zuruecksetzen = useCallback(() => schreiben(LEER), []);

  /**
   * Der Tag wird der Reihe nach gespielt: Station Nummer n ist offen, wenn
   * die Station davor geschafft ist. Einmal geschaffte Stationen bleiben offen.
   */
  const istOffen = useCallback(
    (id: StationId) => {
      const i = STATIONS.findIndex((s) => s.id === id);
      if (i <= 0) return true;
      return progress.fertig.includes(STATIONS[i - 1].id);
    },
    [progress.fertig],
  );

  const istFertig = useCallback(
    (id: StationId) => progress.fertig.includes(id),
    [progress.fertig],
  );

  /** Die Station, bei der es weitergeht. */
  const naechsteOffene = STATIONS.find((s) => !progress.fertig.includes(s.id)) ?? null;

  return {
    progress,
    abschliessen,
    zuruecksetzen,
    istOffen,
    istFertig,
    naechsteOffene,
    anzahlFertig: progress.fertig.length,
  };
}
