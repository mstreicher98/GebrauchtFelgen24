import { db } from "@/db";
import { adminLog } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import { vehicleRowsToCsv } from "@/lib/vehicle-csv";
import { loadVehicleRows } from "@/lib/vehicle-transfer";

export const dynamic = "force-dynamic";

/** CSV-Export der Fahrzeugdatenbank: ?typ=auto | motorrad (ohne = alle). Nur für Admins. */
export async function GET(req: Request) {
  const me = await getCurrentUser();
  if (!me || me.role !== "admin") return new Response("Keine Berechtigung", { status: 403 });
  const typ = new URL(req.url).searchParams.get("typ");
  const type = typ === "auto" || typ === "motorrad" ? typ : undefined;
  const rows = await loadVehicleRows(type);
  await db.insert(adminLog).values({ adminId: me.id, action: "Fahrzeugliste exportiert", targetType: "vehicle_make", details: `${type ?? "alle"} · ${rows.length} Zeilen` });
  const date = new Date().toISOString().slice(0, 10);
  return new Response(vehicleRowsToCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="fahrzeuge-${type ?? "alle"}-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
