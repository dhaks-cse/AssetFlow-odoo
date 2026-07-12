"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import {
  upsertDepartmentSchema,
  upsertCategorySchema,
  promoteEmployeeSchema,
  updateEmployeeStatusSchema,
  type UpsertDepartmentInput,
  type UpsertCategoryInput,
  type PromoteEmployeeInput,
  type UpdateEmployeeStatusInput,
} from "@/lib/validations/org";

export type OrgActionResult = { success: true } | { success: false; error: string };

function isUniqueConstraintViolation(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export async function upsertDepartmentAction(
  input: UpsertDepartmentInput
): Promise<OrgActionResult> {
  await requireRole("ADMIN");

  const parsed = upsertDepartmentSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Check the fields and try again." };
  }
  const { id, name, code, headId, status } = parsed.data;

  try {
    if (id) {
      await prisma.department.update({
        where: { id },
        data: { name, code, headId: headId || null, status },
      });
    } else {
      await prisma.department.create({
        data: { name, code, headId: headId || undefined, status },
      });
    }
  } catch (error) {
    if (isUniqueConstraintViolation(error)) {
      return { success: false, error: "That name or code is already in use." };
    }
    throw error;
  }

  revalidatePath("/org-setup");
  return { success: true };
}

export async function upsertCategoryAction(input: UpsertCategoryInput): Promise<OrgActionResult> {
  await requireRole("ADMIN");

  const parsed = upsertCategorySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Check the fields and try again." };
  }
  const { id, name } = parsed.data;

  try {
    if (id) {
      await prisma.assetCategory.update({ where: { id }, data: { name } });
    } else {
      await prisma.assetCategory.create({ data: { name } });
    }
  } catch (error) {
    if (isUniqueConstraintViolation(error)) {
      return { success: false, error: "That category name is already in use." };
    }
    throw error;
  }

  revalidatePath("/org-setup");
  return { success: true };
}

/** The only place a role is ever assigned outside signup's hardcoded EMPLOYEE default. */
export async function promoteEmployeeAction(input: PromoteEmployeeInput): Promise<OrgActionResult> {
  await requireRole("ADMIN");
  const { employeeId, role } = promoteEmployeeSchema.parse(input);

  await prisma.employee.update({ where: { id: employeeId }, data: { role } });

  revalidatePath("/org-setup");
  return { success: true };
}

export async function updateEmployeeStatusAction(
  input: UpdateEmployeeStatusInput
): Promise<OrgActionResult> {
  await requireRole("ADMIN");
  const { employeeId, status } = updateEmployeeStatusSchema.parse(input);

  await prisma.employee.update({ where: { id: employeeId }, data: { status } });

  revalidatePath("/org-setup");
  return { success: true };
}
