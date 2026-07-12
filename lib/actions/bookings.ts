"use server";

import { format } from "date-fns";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createBookingSchema, type CreateBookingInput } from "@/lib/validations/bookings";

const PRIVILEGED_ROLES = ["ASSET_MANAGER", "ADMIN"] as const;

/**
 * The no_booking_overlap rule is a raw-SQL GiST exclusion constraint (not
 * modeled in schema.prisma), so Prisma has no P2xxx mapping for it — it
 * surfaces as a PrismaClientUnknownRequestError with the driver's raw
 * Postgres error text, not a `code` field. Confirmed empirically: it is
 * NOT P2010 despite what constraints.sql's comment claims.
 */
function isExclusionViolation(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientUnknownRequestError &&
    error.message.includes("23P01")
  );
}

export type CreateBookingResult =
  | { success: true }
  | { success: false; error: string };

export async function createBookingAction(
  input: CreateBookingInput
): Promise<CreateBookingResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Sign in required." };

  const parsed = createBookingSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Check the fields and try again." };
  }
  const { assetId, startTime, endTime, purpose } = parsed.data;

  const asset = await prisma.asset.findUniqueOrThrow({ where: { id: assetId } });
  if (!asset.isBookable) {
    return { success: false, error: `${asset.assetTag} isn't a bookable resource.` };
  }

  try {
    // The GiST exclusion constraint (no_booking_overlap) is the source of
    // truth here — no JS-side overlap check before this insert.
    await prisma.booking.create({
      data: { assetId, bookedById: session.user.id, startTime, endTime, purpose },
    });

    revalidatePath(`/assets/${assetId}`);
    revalidatePath("/bookings");
    return { success: true };
  } catch (error) {
    if (isExclusionViolation(error)) {
      // Constraint already rejected the write; this read is only to name
      // the conflicting slot in the error message, not to gate the insert.
      const conflicting = await prisma.booking.findFirst({
        where: {
          assetId,
          status: { not: "CANCELLED" },
          startTime: { lt: endTime },
          endTime: { gt: startTime },
        },
        orderBy: { startTime: "asc" },
      });

      const slot = conflicting
        ? `${format(conflicting.startTime, "h:mm a")}–${format(conflicting.endTime, "h:mm a")}`
        : "an existing booking";
      return { success: false, error: `That time overlaps ${slot}. Pick a different slot.` };
    }
    throw error;
  }
}

export async function cancelBookingAction(bookingId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized: sign in required");

  const booking = await prisma.booking.findUniqueOrThrow({
    where: { id: bookingId },
    include: { asset: true },
  });

  const isPrivileged = PRIVILEGED_ROLES.includes(
    session.user.role as (typeof PRIVILEGED_ROLES)[number]
  );
  if (booking.bookedById !== session.user.id && !isPrivileged) {
    throw new Error("Forbidden: this isn't your booking.");
  }
  if (booking.status === "CANCELLED") {
    throw new Error("This booking is already cancelled.");
  }

  await prisma.booking.update({ where: { id: bookingId }, data: { status: "CANCELLED" } });

  // Only notify when someone else cancelled it — the booker doesn't need a
  // ping for their own action.
  if (booking.bookedById !== session.user.id) {
    await prisma.notification.create({
      data: {
        employeeId: booking.bookedById,
        title: "Your booking was cancelled",
        body: `${booking.asset.assetTag} — ${format(booking.startTime, "MMM d, h:mm a")} was cancelled by ${session.user.name}.`,
        link: `/assets/${booking.assetId}`,
      },
    });
  }

  revalidatePath(`/assets/${booking.assetId}`);
  revalidatePath("/bookings");
  return { success: true };
}
