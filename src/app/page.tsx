import { existsSync } from "node:fs";
import { join } from "node:path";
import { Spiel } from "@/components/Spiel";
import { SCHENKER_BILD } from "@/lib/kinder";

/**
 * Liegt das Bild von Onkel Tom im Ordner?
 *
 * Wird hier beim Bauen nachgesehen, nicht im Browser. Ein Probeladen im
 * Browser hinterlässt bei fehlender Datei eine 404-Meldung in der Konsole —
 * für eine Datei, die absichtlich fehlen darf, ist das der falsche Preis.
 * Das Spiel wird bei jeder Änderung ohnehin neu gebaut.
 */
export default function Home() {
  const schenkerBild = existsSync(join(process.cwd(), "public", SCHENKER_BILD));
  return <Spiel schenkerBild={schenkerBild} />;
}
