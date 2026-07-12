import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getNotifications } from "@/lib/queries/notifications";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NotificationsList } from "@/components/activity/notifications-list";

export default async function ActivityPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const notifications = await getNotifications(session.user.id, 100);

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
        <Card className="w-full">
          <CardHeader className="items-center gap-1 py-10 text-center">
            <CardTitle className="text-sm text-muted-foreground">Coming soon</CardTitle>
            <CardDescription className="max-w-sm">
              Every action is already being recorded — this view just isn&apos;t shown yet.
            </CardDescription>
          </CardHeader>
        </Card>
      </section>
    </div>
  );
}
