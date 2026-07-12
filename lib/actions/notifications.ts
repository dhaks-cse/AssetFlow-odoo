"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function markNotificationReadAction(notificationId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized: sign in required");

  // Scoped to the caller's own employeeId — updateMany silently no-ops
  // instead of leaking whether another employee's notification exists.
  await prisma.notification.updateMany({
    where: { id: notificationId, employeeId: session.user.id },
    data: { read: true },
  });

  revalidatePath("/");
  revalidatePath("/activity");
  return { success: true };
}

export async function markAllNotificationsReadAction() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized: sign in required");

  await prisma.notification.updateMany({
    where: { employeeId: session.user.id, read: false },
    data: { read: true },
  });

  revalidatePath("/");
  revalidatePath("/activity");
  return { success: true };
}
