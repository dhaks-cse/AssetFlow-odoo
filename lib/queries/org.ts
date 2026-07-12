import { prisma } from "@/lib/prisma";

export async function getDepartments() {
  return prisma.department.findMany({
    include: {
      head: { select: { id: true, name: true } },
      _count: { select: { employees: true } },
    },
    orderBy: { name: "asc" },
  });
}
export type DepartmentListItem = Awaited<ReturnType<typeof getDepartments>>[number];

export async function getCategories() {
  return prisma.assetCategory.findMany({
    include: { _count: { select: { assets: true } } },
    orderBy: { name: "asc" },
  });
}
export type CategoryListItem = Awaited<ReturnType<typeof getCategories>>[number];

export async function getEmployeeDirectory() {
  return prisma.employee.findMany({
    include: { department: { select: { id: true, name: true } } },
    orderBy: { name: "asc" },
  });
}
export type EmployeeDirectoryItem = Awaited<ReturnType<typeof getEmployeeDirectory>>[number];

/** Active employees eligible to be named a department head. */
export async function getEmployeesForHeadSelect() {
  return prisma.employee.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}
