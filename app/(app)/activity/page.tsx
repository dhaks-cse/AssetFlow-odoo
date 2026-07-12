import { redirect } from "next/navigation";
import { format } from "date-fns";
import type { Prisma } from "@prisma/client";

import { auth } from "@/auth";
import { getNotifications } from "@/lib/queries/notifications";
import { getActivityLog } from "@/lib/queries/activity-log";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { NotificationsList } from "@/components/activity/notifications-list";

/**
 * transitionAsset() always writes {status: X} on both sides — render that
 * shape as a readable arrow. Anything else (future event shapes) falls back
 * to raw JSON so nothing is silently dropped.
 */
function formatChange(before: Prisma.JsonValue, after: Prisma.JsonValue) {
  if (
    before &&
    after &&
    typeof before === "object" &&
    typeof after === "object" &&
    !Array.isArray(before) &&
    !Array.isArray(after)
  ) {
    const keys = Object.keys(before as Record<string, unknown>);
    if (keys.length === 1 && keys[0] in (after as Record<string, unknown>)) {
      const key = keys[0];
      const b = (before as Record<string, unknown>)[key];
      const a = (after as Record<string, unknown>)[key];
      return `${key}: ${String(b)} → ${String(a)}`;
    }
  }
  return `${JSON.stringify(before)} → ${JSON.stringify(after)}`;
}

export default async function ActivityPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [notifications, activityLog] = await Promise.all([
    getNotifications(session.user.id, 100),
    getActivityLog(),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-8 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Activity & Notifications</h1>
        <p className="text-sm text-muted-foreground">
          What&apos;s happened, and what needs your attention.
        </p>
      </div>

      <NotificationsList notifications={notifications} />

      <section className="space-y-2">
        <h2 className="text-sm font-semibold">Activity Log</h2>
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Change</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activityLog.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No activity yet.
                  </TableCell>
                </TableRow>
              ) : (
                activityLog.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-muted-foreground">
                      {format(entry.createdAt, "MMM d, h:mm a")}
                    </TableCell>
                    <TableCell className="font-medium">{entry.actor?.name ?? "System"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {entry.action.replace(/_/g, " ")}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {entry.entityType} · {entry.entityId.slice(0, 8)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {entry.before != null && entry.after != null
                        ? formatChange(entry.before, entry.after)
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}
