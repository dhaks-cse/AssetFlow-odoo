import { prisma } from "@/lib/prisma";

/** Recent notifications for the bell dropdown and the /activity page. */
export async function getNotifications(employeeId: string, take = 20) {
  return prisma.notification.findMany({
    where: { employeeId },
    orderBy: { createdAt: "desc" },
    take,
  });
}
export type NotificationItem = Awaited<ReturnType<typeof getNotifications>>[number];

export async function getUnreadNotificationCount(employeeId: string) {
  return prisma.notification.count({ where: { employeeId, read: false } });
}
