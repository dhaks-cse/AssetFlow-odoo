"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { IllegalTransitionError, transitionAsset } from "@/lib/asset-state";
import {
  allocateSchema,
  requestTransferSchema,
  returnAssetSchema,
  type AllocateInput,
  type RequestTransferInput,
  type ReturnAssetInput,
} from "@/lib/validations/allocations";

const PRIVILEGED_ROLES = ["ASSET_MANAGER", "ADMIN"] as const;

const SIMILAR_ASSET_SELECT = {
  id: true,
  assetTag: true,
  name: true,
  location: true,
  condition: true,
} as const;

function isUniqueConstraintViolation(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

/**
 * "Similar" AVAILABLE assets, closest match first. `categoryId` alone is
 * too coarse — the seed's "Electronics" category covers everything from
 * MacBooks to Dell monitors, so a plain category filter surfaced whichever
 * available electronics happened to sort first, not other MacBooks. Tiered
 * fallback: exact name match, then same product family (first word of the
 * name, e.g. "MacBook"), then same category as a last resort.
 */
async function findSimilarAvailable(asset: { id: string; name: string; categoryId: string }) {
  const excluded = new Set([asset.id]);

  const sameName = await prisma.asset.findMany({
    where: { name: asset.name, status: "AVAILABLE", id: { notIn: [...excluded] } },
    take: 3,
    select: SIMILAR_ASSET_SELECT,
  });
  sameName.forEach((a) => excluded.add(a.id));
  let similar = sameName;

  if (similar.length < 3) {
    const [firstWord] = asset.name.split(" ");
    const sameFamily = await prisma.asset.findMany({
      where: {
        status: "AVAILABLE",
        id: { notIn: [...excluded] },
        name: { startsWith: firstWord },
      },
      take: 3 - similar.length,
      select: SIMILAR_ASSET_SELECT,
    });
    sameFamily.forEach((a) => excluded.add(a.id));
    similar = [...similar, ...sameFamily];
  }

  if (similar.length < 3) {
    const sameCategory = await prisma.asset.findMany({
      where: { categoryId: asset.categoryId, status: "AVAILABLE", id: { notIn: [...excluded] } },
      take: 3 - similar.length,
      select: SIMILAR_ASSET_SELECT,
    });
    similar = [...similar, ...sameCategory];
  }

  return similar;
}

/**
 * Built from the same query shape as SETUP.md §6: the currently active
 * allocation (holder, since, due, overdueDays) plus up to 3 AVAILABLE
 * assets in the same category. This *is* the conflict panel payload —
 * never collapsed into a plain error string.
 */
async function buildConflictPayload(assetId: string) {
  const asset = await prisma.asset.findUniqueOrThrow({ where: { id: assetId } });

  const active = await prisma.allocation.findFirst({
    where: { assetId, returnedAt: null },
    include: { holder: { include: { department: true } } },
  });

  if (!active) {
    // A P2002 fired but there's no active allocation to explain it — the
    // conflict already resolved out from under us. Let the caller retry.
    throw new Error("This asset just became available again — try allocating it now.");
  }

  const similar = await findSimilarAvailable(asset);

  const overdueDays = active.expectedReturnDate
    ? Math.max(0, Math.floor((Date.now() - +active.expectedReturnDate) / 864e5))
    : 0;

  return {
    conflict: true as const,
    assetId: asset.id,
    assetTag: asset.assetTag,
    assetName: asset.name,
    allocationId: active.id,
    holderId: active.holderId,
    holder: active.holder?.name ?? "Unknown",
    holderDept: active.holder?.department?.name ?? null,
    since: active.allocatedAt,
    due: active.expectedReturnDate,
    overdueDays,
    similar,
  };
}

export type ConflictPayload = Awaited<ReturnType<typeof buildConflictPayload>>;

export type AllocateResult =
  | ConflictPayload
  | { conflict: false; success: true }
  | { conflict: false; success: false; error: string };

export async function allocateAssetAction(input: AllocateInput): Promise<AllocateResult> {
  const session = await auth();
  if (!session?.user) return { conflict: false, success: false, error: "Sign in required." };

  const parsed = allocateSchema.safeParse(input);
  if (!parsed.success) {
    return { conflict: false, success: false, error: "Check the fields and try again." };
  }
  const { assetId, holderId, expectedReturnDate } = parsed.data;

  const isSelfAllocation = holderId === session.user.id;
  const isPrivileged = PRIVILEGED_ROLES.includes(
    session.user.role as (typeof PRIVILEGED_ROLES)[number]
  );
  if (!isSelfAllocation && !isPrivileged) {
    return {
      conflict: false,
      success: false,
      error: "Only an Asset Manager or Admin can allocate to someone else.",
    };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Insert first — the partial unique index (one_active_allocation) is
      // what actually enforces "no double-allocation". Only transition the
      // asset's status once we know the insert cleared that gate, so a
      // pre-existing ALLOCATED status never masks the real conflict with an
      // IllegalTransitionError.
      await tx.allocation.create({
        data: {
          assetId,
          holderId,
          allocatedById: session.user.id,
          expectedReturnDate,
        },
      });
      const asset = await transitionAsset(tx, assetId, "ALLOCATE", session.user.id);

      // Only notify when someone else did the assigning — self-allocation
      // needs no "you got a thing you just took" ping.
      if (holderId !== session.user.id) {
        await tx.notification.create({
          data: {
            employeeId: holderId,
            title: "Asset assigned to you",
            body: `${asset.assetTag} has been allocated to you.`,
            link: `/assets/${assetId}`,
          },
        });
      }
    });

    revalidatePath(`/assets/${assetId}`);
    revalidatePath("/allocations");
    return { conflict: false, success: true };
  } catch (error) {
    if (isUniqueConstraintViolation(error)) {
      return await buildConflictPayload(assetId);
    }
    if (error instanceof IllegalTransitionError) {
      return { conflict: false, success: false, error: error.message };
    }
    throw error;
  }
}

export async function requestTransferAction(input: RequestTransferInput) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized: sign in required");

  const { allocationId, reason } = requestTransferSchema.parse(input);

  await prisma.transferRequest.create({
    data: {
      allocationId,
      requestedById: session.user.id,
      requestedForId: session.user.id,
      reason,
    },
  });

  revalidatePath("/allocations");
  return { success: true };
}

export async function approveTransferAction(transferRequestId: string) {
  const session = await requireRole("ASSET_MANAGER", "ADMIN");

  await prisma.$transaction(async (tx) => {
    const transfer = await tx.transferRequest.findUniqueOrThrow({
      where: { id: transferRequestId },
      include: { allocation: { include: { asset: true } } },
    });

    if (transfer.status !== "REQUESTED") {
      throw new Error("This transfer request was already resolved.");
    }

    // Close the old allocation before opening the new one — the partial
    // unique index only tolerates one row with returnedAt IS NULL per
    // asset, even transiently inside this transaction.
    await tx.allocation.update({
      where: { id: transfer.allocationId },
      data: { returnedAt: new Date() },
    });

    await tx.allocation.create({
      data: {
        assetId: transfer.allocation.assetId,
        holderId: transfer.requestedForId,
        departmentId: transfer.allocation.departmentId,
        allocatedById: session.user.id,
      },
    });

    await tx.transferRequest.update({
      where: { id: transferRequestId },
      data: { status: "APPROVED", approvedById: session.user.id, resolvedAt: new Date() },
    });
    // Asset stays ALLOCATED throughout a transfer — only the holder
    // changes — so transitionAsset is never called here.

    await tx.notification.create({
      data: {
        employeeId: transfer.requestedForId,
        title: "Transfer approved",
        body: `${transfer.allocation.asset.assetTag} is now yours.`,
        link: `/assets/${transfer.allocation.assetId}`,
      },
    });
  });

  revalidatePath("/allocations");
  return { success: true };
}

export async function rejectTransferAction(transferRequestId: string) {
  const session = await requireRole("ASSET_MANAGER", "ADMIN");

  const transfer = await prisma.transferRequest.findUniqueOrThrow({
    where: { id: transferRequestId },
    include: { allocation: { include: { asset: true } } },
  });
  if (transfer.status !== "REQUESTED") {
    throw new Error("This transfer request was already resolved.");
  }

  await prisma.transferRequest.update({
    where: { id: transferRequestId },
    data: { status: "REJECTED", approvedById: session.user.id, resolvedAt: new Date() },
  });

  await prisma.notification.create({
    data: {
      employeeId: transfer.requestedForId,
      title: "Transfer request rejected",
      body: `Your request for ${transfer.allocation.asset.assetTag} was rejected.`,
      link: `/assets/${transfer.allocation.assetId}`,
    },
  });

  revalidatePath("/allocations");
  return { success: true };
}

export async function notifyHolderAction(allocationId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized: sign in required");

  const allocation = await prisma.allocation.findUniqueOrThrow({
    where: { id: allocationId },
    include: { asset: true },
  });

  if (!allocation.holderId) {
    return { success: false, error: "This allocation has no individual holder to notify." };
  }

  await prisma.notification.create({
    data: {
      employeeId: allocation.holderId,
      title: "Someone is waiting on your asset",
      body: `${session.user.name} is waiting on ${allocation.asset.assetTag} (${allocation.asset.name}). Please return it or request an extension.`,
      link: `/assets/${allocation.assetId}`,
    },
  });

  return { success: true };
}

export async function returnAssetAction(input: ReturnAssetInput) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized: sign in required");

  const { allocationId, checkInNotes, returnCondition } = returnAssetSchema.parse(input);

  const allocation = await prisma.allocation.findUniqueOrThrow({ where: { id: allocationId } });

  const isPrivileged = PRIVILEGED_ROLES.includes(
    session.user.role as (typeof PRIVILEGED_ROLES)[number]
  );
  if (allocation.holderId !== session.user.id && !isPrivileged) {
    throw new Error("Forbidden: you don't hold this asset.");
  }
  if (allocation.returnedAt) {
    throw new Error("This allocation was already returned.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.allocation.update({
      where: { id: allocationId },
      data: { returnedAt: new Date(), checkInNotes, returnCondition },
    });
    await transitionAsset(tx, allocation.assetId, "RETURN", session.user.id);
  });

  revalidatePath(`/assets/${allocation.assetId}`);
  revalidatePath("/allocations");
  return { success: true };
}
