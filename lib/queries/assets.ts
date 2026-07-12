import type { AssetStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type AssetFilters = {
  q?: string;
  categoryId?: string;
  status?: AssetStatus;
  departmentId?: string;
};

/** List view: assets + category/department names + current holder (if any). */
export async function getAssets(filters: AssetFilters) {
  const where: Prisma.AssetWhereInput = {
    ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.departmentId ? { departmentId: filters.departmentId } : {}),
    ...(filters.q
      ? {
          OR: [
            { assetTag: { contains: filters.q, mode: "insensitive" } },
            { serialNumber: { contains: filters.q, mode: "insensitive" } },
            { name: { contains: filters.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  return prisma.asset.findMany({
    where,
    include: {
      category: true,
      department: true,
      allocations: {
        where: { returnedAt: null },
        include: { holder: true, department: true },
        take: 1,
      },
    },
    orderBy: { assetTag: "asc" },
  });
}

export type AssetListItem = Awaited<ReturnType<typeof getAssets>>[number];

export async function getAssetFilterOptions() {
  const [categories, departments] = await Promise.all([
    prisma.assetCategory.findMany({ orderBy: { name: "asc" } }),
    prisma.department.findMany({ orderBy: { name: "asc" } }),
  ]);
  return { categories, departments };
}

/** Detail view: asset + full allocation history + maintenance history. */
export async function getAssetDetail(id: string) {
  return prisma.asset.findUnique({
    where: { id },
    include: {
      category: true,
      department: true,
      allocations: {
        include: { holder: true, department: true, allocatedBy: true },
        orderBy: { allocatedAt: "desc" },
      },
      maintenance: {
        include: { raisedBy: true, approvedBy: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export type AssetDetail = NonNullable<Awaited<ReturnType<typeof getAssetDetail>>>;
