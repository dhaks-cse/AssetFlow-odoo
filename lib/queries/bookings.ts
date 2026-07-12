import type { BookingStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

/**
 * ONGOING/COMPLETED are derived from the current time, never stored — only
 * CANCELLED is a real write. Same "derived, no cron job" rule this codebase
 * already applies to overdue allocations.
 */
export function deriveBookingStatus(booking: {
  status: BookingStatus;
  startTime: Date;
  endTime: Date;
}): BookingStatus {
  if (booking.status === "CANCELLED") return "CANCELLED";
  const now = Date.now();
  if (now < +booking.startTime) return "UPCOMING";
  if (now < +booking.endTime) return "ONGOING";
  return "COMPLETED";
}

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/** Every booking (including cancelled, so the day view can show them struck through) touching one calendar day for one asset. */
export async function getBookingsForAssetOnDate(assetId: string, date: Date) {
  const bookings = await prisma.booking.findMany({
    where: {
      assetId,
      startTime: { lt: endOfDay(date) },
      endTime: { gt: startOfDay(date) },
    },
    include: { bookedBy: { select: { name: true } } },
    orderBy: { startTime: "asc" },
  });

  return bookings.map((b) => ({ ...b, derivedStatus: deriveBookingStatus(b) }));
}

export type BookingListItem = Awaited<ReturnType<typeof getBookingsForAssetOnDate>>[number];

/** Upcoming (not completed, not cancelled) bookings made by one employee. */
export async function getMyBookings(employeeId: string) {
  const bookings = await prisma.booking.findMany({
    where: {
      bookedById: employeeId,
      status: { not: "CANCELLED" },
      endTime: { gt: new Date() },
    },
    include: { asset: true },
    orderBy: { startTime: "asc" },
  });

  return bookings.map((b) => ({ ...b, derivedStatus: deriveBookingStatus(b) }));
}

export type MyBookingListItem = Awaited<ReturnType<typeof getMyBookings>>[number];

/** Every bookable resource, for the /bookings index. */
export async function getBookableAssets() {
  return prisma.asset.findMany({
    where: { isBookable: true },
    orderBy: { name: "asc" },
  });
}
