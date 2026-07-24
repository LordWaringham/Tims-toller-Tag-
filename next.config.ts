import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Das Spiel läuft vollständig im Browser — kein Server nötig.
   * Als statischer Export lässt es sich überall ablegen und funktioniert
   * offline zuverlässig.
   */
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
