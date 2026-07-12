import { prisma } from "@/lib/prisma";

/**
 * Overdue is derived, never stored: an active allocation whose
 * expectedReturnDate has passed. No boolean column, no cron job.
 */
export async function getOverdueAllocations() {
  const now = Date.now();
  const overdue = await prisma.allocation.findMany({
    where: {
      returnedAt: null,
      expectedReturnDate: { lt: new Date(now) },
    },
    include: { asset: true, holder: { include: { department: true } } },
    orderBy: { expectedReturnDate: "asc" },
  });

  return overdue.map((a) => ({
    ...a,
    overdueDays: a.expectedReturnDate
      ? Math.max(0, Math.floor((now - +a.expectedReturnDate) / 864e5))
      : 0,
  }));
}

/** Active (currently held, not yet returned) allocations for one employee. */
export async function getMyActiveAllocations(employeeId: string) {
  return prisma.allocation.findMany({
    where: { holderId: employeeId, returnedAt: null },
    include: { asset: true },
    orderBy: { allocatedAt: "desc" },
  });
}

/**
 * All transfer requests, newest first — for the Asset Manager queue.
 *
 * TransferRequest only stores requestedById/requestedForId/approvedById as
 * plain scalars (no Employee relations in the locked schema), so names are
 * joined in application code instead of via `include`.
 */
export async function getTransferRequests() {
  const requests = await prisma.transferRequest.findMany({
    include: { allocation: { include: { asset: true } } },
    orderBy: { createdAt: "desc" },
  });

  const employeeIds = Array.from(
    new Set(
      requests.flatMap((r) => [r.requestedById, r.requestedForId, r.approvedById])
    )
  ).filter((id): id is string => !!id);

  const employees = await prisma.employee.findMany({
    where: { id: { in: employeeIds } },
    select: { id: true, name: true },
  });
  const nameById = new Map(employees.map((e) => [e.id, e.name]));

  return requests.map((r) => ({
    ...r,
    requestedByName: nameById.get(r.requestedById) ?? "Unknown",
    requestedForName: nameById.get(r.requestedForId) ?? "Unknown",
    approvedByName: r.approvedById ? (nameById.get(r.approvedById) ?? "Unknown") : null,
  }));
}

export type TransferRequestListItem = Awaited<
  ReturnType<typeof getTransferRequests>
>[number];
