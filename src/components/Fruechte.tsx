"use client";

/** Früchte fürs Müsli — schlicht und klar erkennbar. */

export type FruchtArt = "erdbeere" | "banane" | "heidelbeere";

export function Frucht({
  art,
  className,
  geschaelt = false,
}: {
  art: FruchtArt;
  className?: string;
  /** Banane ohne Schale — so, wie sie in die Schüssel gehört. */
  geschaelt?: boolean;
}) {
  if (art === "erdbeere") {
    return (
      <svg viewBox="0 0 100 110" className={className} aria-hidden>
        <path
          d="M50 28 q26 0 26 24 q0 30 -26 52 q-26 -22 -26 -52 q0 -24 26 -24z"
          fill="#e03d3d"
          stroke="#a52323"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {[
          [40, 46],
          [58, 44],
          [50, 58],
          [37, 63],
          [62, 62],
          [50, 76],
          [42, 88],
          [59, 87],
        ].map(([x, y], i) => (
          <ellipse key={i} cx={x} cy={y} rx="2.6" ry="3.6" fill="#ffe28a" />
        ))}
        <path
          d="M50 30 l-18 -8 l6 12 l-16 -2 l14 10 q7 -6 14 -6 q7 0 14 6 l14 -10 l-16 2 l6 -12z"
          fill="#4f9c3a"
          stroke="#3a7529"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d="M50 30 v-18" stroke="#3a7529" strokeWidth="4" strokeLinecap="round" />
        <ellipse cx="40" cy="46" rx="7" ry="9" fill="rgba(255,255,255,0.28)" />
      </svg>
    );
  }

  if (art === "banane") {
    /*
     * In der Schüssel liegt sie ohne Schale.
     *
     * Eine ganze Banane mit Schale ins Müsli zu legen, macht niemand — und ein
     * Kind sieht das sofort. Im Korb links liegt sie deshalb ungeschält, in der
     * Schüssel geschält: hellcreme statt gelb, ohne den braunen Stiel, mit den
     * dunkleren Enden und der feinen Rille, die eine geschälte Banane hat.
     */
    if (geschaelt) {
      return (
        <svg viewBox="0 0 110 100" className={className} aria-hidden>
          <path
            d="M16 24 q4 44 40 56 q34 11 46 -14 q-6 6 -18 4 q-30 -5 -44 -30 q-6 -11 -6 -18z"
            fill="#f8ecc0"
            stroke="#dcc78a"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <path
            d="M24 30 q6 34 36 46"
            fill="none"
            stroke="rgba(255,255,255,0.75)"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <path
            d="M30 38 q8 28 32 40"
            fill="none"
            stroke="rgba(200,175,110,0.5)"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          {/* Die beiden Schnittenden sind etwas dunkler. */}
          <ellipse cx="18" cy="25" rx="4.5" ry="3.4" fill="#e6d29a" transform="rotate(-28 18 25)" />
          <ellipse cx="99" cy="68" rx="4.5" ry="3.4" fill="#e6d29a" transform="rotate(24 99 68)" />
        </svg>
      );
    }
    return (
      <svg viewBox="0 0 110 100" className={className} aria-hidden>
        <path
          d="M16 24 q4 44 40 56 q34 11 46 -14 q-6 6 -18 4 q-30 -5 -44 -30 q-6 -11 -6 -18z"
          fill="#f5cf3f"
          stroke="#c69f14"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path
          d="M22 28 q6 36 38 48"
          fill="none"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path d="M14 20 l8 -8 l6 10z" fill="#8a6a2c" />
        <path d="M100 68 q6 4 4 10" stroke="#8a6a2c" strokeWidth="4" strokeLinecap="round" fill="none" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <circle cx="50" cy="54" r="34" fill="#4a5fb0" stroke="#2f3f85" strokeWidth="2.5" />
      <circle cx="50" cy="54" r="34" fill="url(#beereGlanz)" />
      <path
        d="M50 24 l-7 -8 l7 3 l7 -3z"
        fill="#3a4a90"
      />
      <circle cx="50" cy="30" r="7" fill="#38488f" />
      <path
        d="M45 27 l5 5 l5 -5"
        fill="none"
        stroke="#2a3670"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <ellipse cx="38" cy="44" rx="9" ry="7" fill="rgba(255,255,255,0.3)" />
      <defs>
        <radialGradient id="beereGlanz" cx="35%" cy="32%">
          <stop offset="0%" stopColor="#8f9fe0" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#2f3f85" stopOpacity="0.25" />
        </radialGradient>
      </defs>
    </svg>
  );
}

export const FRUCHT_NAME: Record<FruchtArt, string> = {
  erdbeere: "Erdbeere",
  banane: "Banane",
  heidelbeere: "Heidelbeere",
};
