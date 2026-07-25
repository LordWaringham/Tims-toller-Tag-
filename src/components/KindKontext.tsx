"use client";

import { createContext, useContext } from "react";
import type { StationId } from "@/lib/stations";
import type { Kind } from "@/lib/kinder";

/**
 * Wer gerade spielt und wie weit es ist.
 *
 * Die Stickerleiste am unteren Rand braucht den Fortschritt, sitzt aber im
 * Stationsrahmen — also elf Bauteile vom Spiel entfernt. Statt den Stand durch
 * jede einzelne Station durchzureichen, steht er hier zur Verfügung.
 */
export interface KindStand {
  kind: Kind | null;
  istFertig: (id: StationId) => boolean;
}

const Kontext = createContext<KindStand>({ kind: null, istFertig: () => false });

export const KindProvider = Kontext.Provider;

export function useKindStand(): KindStand {
  return useContext(Kontext);
}
