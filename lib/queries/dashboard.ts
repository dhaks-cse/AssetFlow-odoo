import { prisma } from "@/lib/prisma";

/**
 * Six KPI counts for the dashboard. Upcoming Returns and Overdue Returns are
 * deliberately split queries (not one list filtered client-side) — overdue
 * is derived the same way everywhere else in the app: an active allocation
 * whose expectedReturnDate has already passed.
 */
export async function getDashboardKpis() {
  const now = new Date();

  const [available, allocated, underMaintenance, activeBookings, pendingTransfers, upcomingReturns] =
    await Promise.all([
      prisma.asset.count({ where: { status: "AVAILABLE" } }),
      prisma.asset.count({ where: { status: "ALLOCATED" } }),
      prisma.asset.count({ where: { status: "UNDER_MAINTENANCE" } }),
      prisma.booking.count({ where: { status: { in: ["UPCOMING", "ONGOING"] } } }),
      prisma.transferRequest.count({ where: { status: "REQUESTED" } }),
      prisma.allocation.count({
        where: { returnedAt: null, expectedReturnDate: { gte: now } },
      }),
    ]);

  return { available, allocated, underMaintenance, activeBookings, pendingTransfers, upcomingReturns };
}
export type DashboardKpis = Awaited<ReturnType<typeof getDashboardKpis>>;
