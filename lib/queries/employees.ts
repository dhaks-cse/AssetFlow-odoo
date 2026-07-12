import { prisma } from "@/lib/prisma";

/** For "who is this asset going to" selects — active employees only. */
export async function getEmployeesForSelect() {
  return prisma.employee.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, name: true, email: true, departmentId: true },
    orderBy: { name: "asc" },
  });
}
