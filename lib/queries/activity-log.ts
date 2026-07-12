import { prisma } from "@/lib/prisma";

/** Append-only trail, newest first. Populated exclusively by transitionAsset(). */
export async function getActivityLog(take = 200) {
  return prisma.activityLog.findMany({
    include: { actor: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take,
  });
}
export type ActivityLogEntry = Awaited<ReturnType<typeof getActivityLog>>[number];
