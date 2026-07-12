"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";

import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/lib/actions/notifications";
import { Button } from "@/components/ui/button";
import type { NotificationSummary } from "@/components/shell/notifications-bell";

export function NotificationsList({ notifications }: { notifications: NotificationSummary[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const unreadCount = notifications.filter((n) => !n.read).length;

  function markRead(id: string) {
    startTransition(async () => {
      await markNotificationReadAction(id);
      router.refresh();
    });
  }

  function markAllRead() {
    startTransition(async () => {
      await markAllNotificationsReadAction();
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Notifications</h2>
        {unreadCount > 0 ? (
          <Button size="xs" variant="outline" disabled={isPending} onClick={markAllRead}>
            Mark all read
          </Button>
        ) : null}
      </div>
      <div className="overflow-hidden rounded-lg border">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No notifications yet.</div>
        ) : (
          <ul className="divide-y">
            {notifications.map((n) => {
              const row = (
                <div
                  className={
                    "flex items-start gap-3 px-4 py-3 text-sm" +
                    (n.read ? "" : " bg-primary/5")
                  }
                >
                  {!n.read ? (
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                  ) : (
                    <span className="mt-1.5 size-1.5 shrink-0" />
                  )}
                  <div className="flex-1 space-y-0.5">
                    <p className="font-medium">{n.title}</p>
                    <p className="text-muted-foreground">{n.body}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(n.createdAt, { addSuffix: true })}
                    </p>
                  </div>
                  {!n.read ? (
                    <Button
                      size="xs"
                      variant="outline"
                      disabled={isPending}
                      onClick={(e) => {
                        e.preventDefault();
                        markRead(n.id);
                      }}
                    >
                      Mark read
                    </Button>
                  ) : null}
                </div>
              );
              return (
                <li key={n.id}>
                  {n.link ? (
                    <Link href={n.link} className="block hover:bg-muted/50">
                      {row}
                    </Link>
                  ) : (
                    row
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
