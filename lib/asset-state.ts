import { AssetStatus, PrismaClient } from "@prisma/client";
import type { Prisma } from "@prisma/client";

/**
 * ═══════════════════════════════════════════════════════════════
 * THE ASSET STATE MACHINE
 *
 * Four subsystems mutate asset.status: allocation, booking,
 * maintenance, and audit closure. If each one writes
 * `asset.status = "X"` directly, you WILL have a bug swamp by hour 6
 * (an asset allocated AND under maintenance; an audit marking
 * something LOST while it's actively booked).
 *
 * EVERY status change goes through transitionAsset(). No exceptions.
 * Illegal transitions throw. This is ~40 lines and it will save you
 * an hour of debugging.
 * ═══════════════════════════════════════════════════════════════
 */

export type AssetEvent =
  | "ALLOCATE"
  | "RETURN"
  | "RESERVE"
  | "RELEASE_RESERVATION"
  | "MAINTENANCE_APPROVED"
  | "MAINTENANCE_RESOLVED"
  | "MARK_LOST"
  | "MARK_FOUND"
  | "RETIRE"
  | "DISPOSE";

const TRANSITIONS: Record<AssetEvent, { from: AssetStatus[]; to: AssetStatus }> = {
  ALLOCATE:              { from: ["AVAILABLE", "RESERVED"],        to: "ALLOCATED" },
  RETURN:                { from: ["ALLOCATED"],                    to: "AVAILABLE" },
  RESERVE:               { from: ["AVAILABLE"],                    to: "RESERVED" },
  RELEASE_RESERVATION:   { from: ["RESERVED"],                     to: "AVAILABLE" },
  MAINTENANCE_APPROVED:  { from: ["AVAILABLE", "ALLOCATED"],       to: "UNDER_MAINTENANCE" },
  MAINTENANCE_RESOLVED:  { from: ["UNDER_MAINTENANCE"],            to: "AVAILABLE" },
  MARK_LOST:             { from: ["AVAILABLE", "ALLOCATED", "RESERVED", "UNDER_MAINTENANCE"], to: "LOST" },
  MARK_FOUND:            { from: ["LOST"],                         to: "AVAILABLE" },
  RETIRE:                { from: ["AVAILABLE", "UNDER_MAINTENANCE"], to: "RETIRED" },
  DISPOSE:               { from: ["RETIRED", "LOST"],              to: "DISPOSED" },
};

/** Human-readable reason — feed this straight into your error toast. */
const FRIENDLY: Record<AssetStatus, string> = {
  AVAILABLE: "available",
  ALLOCATED: "currently allocated",
  RESERVED: "reserved",
  UNDER_MAINTENANCE: "under maintenance",
  LOST: "marked lost",
  RETIRED: "retired",
  DISPOSED: "disposed",
};

export class IllegalTransitionError extends Error {
  constructor(public assetTag: string, public from: AssetStatus, public event: AssetEvent) {
    super(`Cannot ${event.toLowerCase().replace(/_/g, " ")} ${assetTag}: asset is ${FRIENDLY[from]}.`);
    this.name = "IllegalTransitionError";
  }
}

/**
 * The ONLY place asset.status is ever written.
 * Pass a transaction client when this is part of a larger operation.
 */
export async function transitionAsset(
  tx: Prisma.TransactionClient | PrismaClient,
  assetId: string,
  event: AssetEvent,
  actorId?: string
) {
  const asset = await tx.asset.findUniqueOrThrow({ where: { id: assetId } });
  const rule = TRANSITIONS[event];

  if (!rule.from.includes(asset.status)) {
    throw new IllegalTransitionError(asset.assetTag, asset.status, event);
  }

  const updated = await tx.asset.update({
    where: { id: assetId },
    data: { status: rule.to },
  });

  // Append-only audit trail. Never update, never delete.
  await tx.activityLog.create({
    data: {
      actorId,
      action: `ASSET_${event}`,
      entityType: "Asset",
      entityId: assetId,
      before: { status: asset.status },
      after: { status: rule.to },
    },
  });

  return updated;
}

/** For the UI: which buttons should be enabled on this asset right now? */
export function legalEvents(status: AssetStatus): AssetEvent[] {
  return (Object.keys(TRANSITIONS) as AssetEvent[]).filter((e) =>
    TRANSITIONS[e].from.includes(status)
  );
}

/** For the state-machine diagram on the asset detail page (stretch goal). */
export const STATE_GRAPH = TRANSITIONS;
