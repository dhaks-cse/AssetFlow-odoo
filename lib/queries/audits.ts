import { prisma } from "@/lib/prisma";

/** Every audit cycle, newest first — for the /audits index. */
export async function getAuditCycles() {
  return prisma.auditCycle.findMany({
    include: {
      auditors: { select: { id: true, name: true } },
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}
export type AuditCycleListItem = Awaited<ReturnType<typeof getAuditCycles>>[number];

/** One cycle, with auditors — used for the scan page's permission check. */
export async function getAuditCycle(cycleId: string) {
  return prisma.auditCycle.findUnique({
    where: { id: cycleId },
    include: { auditors: { select: { id: true, name: true } } },
  });
}

const EMPTY_COUNTS = { PENDING: 0, VERIFIED: 0, MISSING: 0, DAMAGED: 0 };

export async function getAuditProgress(cycleId: string) {
  const grouped = await prisma.auditItem.groupBy({
    by: ["result"],
    where: { auditCycleId: cycleId },
    _count: { result: true },
  });

  const counts = { ...EMPTY_COUNTS };
  for (const row of grouped) counts[row.result] = row._count.result;

  const total = counts.PENDING + counts.VERIFIED + counts.MISSING + counts.DAMAGED;
  const scanned = total - counts.PENDING;

  return { ...counts, total, scanned };
}
export type AuditProgress = Awaited<ReturnType<typeof getAuditProgress>>;

/**
 * Looks up the AuditItem for a scanned asset tag within this cycle. Returns
 * null both when the tag doesn't match any asset AND when the asset exists
 * but was never staged into this cycle's scope — either way, the scanner
 * treats it as "not part of this audit."
 */
export async function getAuditItemByTag(cycleId: string, assetTag: string) {
  const asset = await prisma.asset.findUnique({ where: { assetTag } });
  if (!asset) return null;

  const item = await prisma.auditItem.findUnique({
    where: { auditCycleId_assetId: { auditCycleId: cycleId, assetId: asset.id } },
  });
  if (!item) return null;

  return { item, asset };
}
export type AuditItemLookup = NonNullable<Awaited<ReturnType<typeof getAuditItemByTag>>>;

/** Every non-VERIFIED item in a cycle — the discrepancy report. */
export async function getDiscrepancyReport(cycleId: string) {
  return prisma.auditItem.findMany({
    where: { auditCycleId: cycleId, result: { not: "VERIFIED" } },
    include: { asset: true, auditedBy: { select: { name: true } } },
    orderBy: { result: "asc" },
  });
}
export type DiscrepancyItem = Awaited<ReturnType<typeof getDiscrepancyReport>>[number];
