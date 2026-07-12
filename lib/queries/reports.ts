import { prisma } from "@/lib/prisma";

/** Fleet snapshot by status — the simplest honest proxy for "utilization". */
export async function getAssetUtilization() {
  const grouped = await prisma.asset.groupBy({ by: ["status"], _count: { status: true } });
  return grouped.map((g) => ({ status: g.status, count: g._count.status }));
}
export type AssetUtilizationRow = Awaited<ReturnType<typeof getAssetUtilization>>[number];

/** Maintenance request count per asset category. */
export async function getMaintenanceFrequencyByCategory() {
  const requests = await prisma.maintenanceRequest.findMany({
    select: { asset: { select: { category: { select: { name: true } } } } },
  });

  const counts = new Map<string, number>();
  for (const r of requests) {
    const name = r.asset.category.name;
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }

  return Array.from(counts, ([category, count]) => ({ category, count })).sort(
    (a, b) => b.count - a.count
  );
}
export type MaintenanceFrequencyRow = Awaited<
  ReturnType<typeof getMaintenanceFrequencyByCategory>
>[number];

/** Booking count by hour-of-day (0–23) — a single-row "heatmap". */
export async function getBookingHeatmapByHour() {
  const bookings = await prisma.booking.findMany({
    where: { status: { not: "CANCELLED" } },
    select: { startTime: true },
  });

  const counts = new Array(24).fill(0) as number[];
  for (const b of bookings) counts[b.startTime.getHours()]++;

  return counts.map((count, hour) => ({ hour: `${String(hour).padStart(2, "0")}:00`, count }));
}
export type BookingHeatmapRow = Awaited<ReturnType<typeof getBookingHeatmapByHour>>[number];
