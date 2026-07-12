"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { IllegalTransitionError, transitionAsset } from "@/lib/asset-state";
import {
  raiseMaintenanceSchema,
  approveMaintenanceSchema,
  resolveMaintenanceSchema,
  type RaiseMaintenanceInput,
  type ApproveMaintenanceInput,
  type ResolveMaintenanceInput,
} from "@/lib/validations/maintenance";

export type MaintenanceActionResult = { success: true } | { success: false; error: string };

export async function raiseMaintenanceAction(
  input: RaiseMaintenanceInput
): Promise<MaintenanceActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Sign in required." };

  const parsed = raiseMaintenanceSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Check the fields and try again." };
  }
  const { assetId, issue, priority, photoUrl } = parsed.data;

  await prisma.maintenanceRequest.create({
    data: { assetId, raisedById: session.user.id, issue, priority, photoUrl: photoUrl || undefined },
  });

  revalidatePath("/maintenance");
  revalidatePath(`/assets/${assetId}`);
  return { success: true };
}

export async function approveMaintenanceAction(
  input: ApproveMaintenanceInput
): Promise<MaintenanceActionResult> {
  const session = await requireRole("ASSET_MANAGER", "ADMIN");
  const { maintenanceRequestId, technician } = approveMaintenanceSchema.parse(input);

  const request = await prisma.maintenanceRequest.findUniqueOrThrow({
    where: { id: maintenanceRequestId },
  });
  if (request.status !== "PENDING") {
    return { success: false, error: "This request was already resolved." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.maintenanceRequest.update({
        where: { id: maintenanceRequestId },
        data: { status: "APPROVED", approvedById: session.user.id, technician },
      });
      const asset = await transitionAsset(
        tx,
        request.assetId,
        "MAINTENANCE_APPROVED",
        session.user.id
      );

      await tx.notification.create({
        data: {
          employeeId: request.raisedById,
          title: "Maintenance request approved",
          body: `Your request for ${asset.assetTag} was approved${technician ? ` — ${technician} is on it` : ""}.`,
          link: `/assets/${request.assetId}`,
        },
      });
    });
  } catch (error) {
    if (error instanceof IllegalTransitionError) {
      return { success: false, error: error.message };
    }
    throw error;
  }

  revalidatePath("/maintenance");
  revalidatePath(`/assets/${request.assetId}`);
  return { success: true };
}

export async function rejectMaintenanceAction(
  maintenanceRequestId: string
): Promise<MaintenanceActionResult> {
  await requireRole("ASSET_MANAGER", "ADMIN");

  const request = await prisma.maintenanceRequest.findUniqueOrThrow({
    where: { id: maintenanceRequestId },
    include: { asset: true },
  });
  if (request.status !== "PENDING") {
    return { success: false, error: "This request was already resolved." };
  }

  await prisma.maintenanceRequest.update({
    where: { id: maintenanceRequestId },
    data: { status: "REJECTED" },
  });

  await prisma.notification.create({
    data: {
      employeeId: request.raisedById,
      title: "Maintenance request rejected",
      body: `Your request for ${request.asset.assetTag} (${request.issue}) was rejected.`,
      link: `/assets/${request.assetId}`,
    },
  });

  revalidatePath("/maintenance");
  return { success: true };
}

export async function startMaintenanceAction(
  maintenanceRequestId: string
): Promise<MaintenanceActionResult> {
  await requireRole("ASSET_MANAGER", "ADMIN");

  const request = await prisma.maintenanceRequest.findUniqueOrThrow({
    where: { id: maintenanceRequestId },
  });
  if (request.status !== "APPROVED") {
    return { success: false, error: "Only an approved request can be started." };
  }

  await prisma.maintenanceRequest.update({
    where: { id: maintenanceRequestId },
    data: { status: "IN_PROGRESS" },
  });

  revalidatePath("/maintenance");
  return { success: true };
}

export async function resolveMaintenanceAction(
  input: ResolveMaintenanceInput
): Promise<MaintenanceActionResult> {
  const session = await requireRole("ASSET_MANAGER", "ADMIN");
  const { maintenanceRequestId, resolution } = resolveMaintenanceSchema.parse(input);

  const request = await prisma.maintenanceRequest.findUniqueOrThrow({
    where: { id: maintenanceRequestId },
  });
  if (request.status !== "IN_PROGRESS") {
    return { success: false, error: "Only a request that's in progress can be resolved." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.maintenanceRequest.update({
        where: { id: maintenanceRequestId },
        data: { status: "RESOLVED", resolution, resolvedAt: new Date() },
      });
      await transitionAsset(tx, request.assetId, "MAINTENANCE_RESOLVED", session.user.id);
    });
  } catch (error) {
    if (error instanceof IllegalTransitionError) {
      return { success: false, error: error.message };
    }
    throw error;
  }

  revalidatePath("/maintenance");
  revalidatePath(`/assets/${request.assetId}`);
  return { success: true };
}
