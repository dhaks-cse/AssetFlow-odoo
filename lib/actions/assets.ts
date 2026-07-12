"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { registerAssetSchema, type RegisterAssetInput } from "@/lib/validations/assets";

export type RegisterAssetResult =
  | { success: true; assetTag: string }
  | { success: false; error: string };

/** AF-0001-style tags, auto-incremented from the highest existing number. */
async function nextAssetTag() {
  const last = await prisma.asset.findFirst({
    orderBy: { assetTag: "desc" },
    select: { assetTag: true },
  });
  const lastNumber = last ? Number(last.assetTag.replace("AF-", "")) : 0;
  return `AF-${String(lastNumber + 1).padStart(4, "0")}`;
}

export async function registerAssetAction(
  input: RegisterAssetInput
): Promise<RegisterAssetResult> {
  await requireRole("ASSET_MANAGER", "ADMIN");

  const parsed = registerAssetSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Check the fields and try again." };
  }
  const data = parsed.data;

  const assetTag = await nextAssetTag();

  await prisma.asset.create({
    data: {
      assetTag,
      name: data.name,
      categoryId: data.categoryId,
      serialNumber: data.serialNumber || undefined,
      acquisitionDate: data.acquisitionDate,
      acquisitionCost: data.acquisitionCost,
      condition: data.condition,
      location: data.location,
      isBookable: data.isBookable,
      departmentId: data.departmentId || undefined,
      status: "AVAILABLE",
    },
  });

  revalidatePath("/assets");
  revalidatePath("/");
  return { success: true, assetTag };
}
