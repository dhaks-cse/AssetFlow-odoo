import { prisma } from "@/lib/prisma";

/** All maintenance requests, newest first — the Asset Manager approval queue. */
export async function getMaintenanceRequests() {
  return prisma.maintenanceRequest.findMany({
    include: { asset: true, raisedBy: true, approvedBy: true },
    orderBy: { createdAt: "desc" },
  });
}
export type MaintenanceRequestListItem = Awaited<
  ReturnType<typeof getMaintenanceRequests>
>[number];

/** Assets worth raising a request against — anything not already retired or disposed. */
export async function getAssetsForMaintenanceSelect() {
  return prisma.asset.findMany({
    where: { status: { notIn: ["RETIRED", "DISPOSED"] } },
    select: { id: true, assetTag: true, name: true },
    orderBy: { assetTag: "asc" },
  });
}
