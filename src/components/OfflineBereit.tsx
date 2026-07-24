"use client";

import { useEffect } from "react";

/** Meldet den Service Worker an, damit das Spiel offline funktioniert. */
export function OfflineBereit() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    const anmelden = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* offline zu können ist schön, aber nicht nötig */
      });
    };
    if (document.readyState === "complete") anmelden();
    else window.addEventListener("load", anmelden, { once: true });
  }, []);

  return null;
}
