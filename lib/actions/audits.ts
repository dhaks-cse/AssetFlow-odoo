"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { IllegalTransitionError, transitionAsset } from "@/lib/asset-state";
import { getAuditItemByTag } from "@/lib/queries/audits";
import {
  submitAuditResultSchema,
  type SubmitAuditResultInput,
} from "@/lib/validations/audits";

const PRIVILEGED_ROLES = ["ASSET_MANAGER", "ADMIN"] as const;

export type SubmitAuditResultResult =
  | { success: true; assetTag: string; assetName: string }
  | { success: false; error: string };

export async function submitAuditResultAction(
  input: SubmitAuditResultInput
): Promise<SubmitAuditResultResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Sign in required." };

  const parsed = submitAuditResultSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid scan." };
  }
  const { auditCycleId, assetTag, result, notes } = parsed.data;

  const isPrivileged = PRIVILEGED_ROLES.includes(
    session.user.role as (typeof PRIVILEGED_ROLES)[number]
  );
  if (!isPrivileged) {
    const isAuditor = await prisma.auditCycle.count({
      where: { id: auditCycleId, auditors: { some: { id: session.user.id } } },
    });
    if (!isAuditor) return { success: false, error: "You're not an auditor on this cycle." };
  }

  const cycle = await prisma.auditCycle.findUniqueOrThrow({ where: { id: auditCycleId } });
  if (cycle.status !== "OPEN") {
    return { success: false, error: "This audit cycle is closed." };
  }

  const lookup = await getAuditItemByTag(auditCycleId, assetTag);
  if (!lookup) {
    return { success: false, error: `${assetTag} isn't part of this audit cycle.` };
  }

  await prisma.auditItem.update({
    where: { id: lookup.item.id },
    data: { result, notes, auditedById: session.user.id, auditedAt: new Date() },
  });

  revalidatePath(`/audit/${auditCycleId}/scan`);
  revalidatePath("/audits");
  return { success: true, assetTag: lookup.asset.assetTag, assetName: lookup.asset.name };
}

export type CloseAuditCycleResult =
  | { success: true; verified: number; missing: number; damaged: number; pending: number }
  | { success: false; error: string };

/**
 * The one multi-entity transaction in the spec: lock the cycle, then cascade
 * every MISSING item to LOST through transitionAsset — never a direct
 * asset.status write. PENDING/DAMAGED items are reported but not mutated;
 * only an explicit MISSING scan result triggers the LOST transition.
 */
export async function closeAuditCycleAction(cycleId: string): Promise<CloseAuditCycleResult> {
  const session = await requireRole("ASSET_MANAGER", "ADMIN");

  const cycle = await prisma.auditCycle.findUniqueOrThrow({ where: { id: cycleId } });
  if (cycle.status !== "OPEN") {
    return { success: false, error: "This audit cycle is already closed." };
  }

  const items = await prisma.auditItem.findMany({ where: { auditCycleId: cycleId } });
  const missingItems = items.filter((i) => i.result === "MISSING");

  try {
    await prisma.$transaction(async (tx) => {
      await tx.auditCycle.update({
        where: { id: cycleId },
        data: { status: "CLOSED", closedAt: new Date() },
      });
      for (const item of missingItems) {
        await transitionAsset(tx, item.assetId, "MARK_LOST", session.user.id);
      }
    });
  } catch (error) {
    if (error instanceof IllegalTransitionError) {
      return { success: false, error: error.message };
    }
    throw error;
  }

  revalidatePath("/audits");
  revalidatePath(`/audit/${cycleId}/scan`);
  return {
    success: true,
    verified: items.filter((i) => i.result === "VERIFIED").length,
    missing: missingItems.length,
    damaged: items.filter((i) => i.result === "DAMAGED").length,
    pending: items.filter((i) => i.result === "PENDING").length,
  };
}
