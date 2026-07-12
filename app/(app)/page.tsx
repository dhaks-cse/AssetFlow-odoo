import Link from "next/link";

import { auth } from "@/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome back, {session?.user.name?.split(" ")[0]}
        </h1>
        <p className="text-sm text-muted-foreground">
          KPI cards and overdue-return alerts land here in a later slice.
        </p>
      </div>
      <Card className="w-fit">
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Quick link</CardTitle>
        </CardHeader>
        <CardContent>
          <Link href="/assets" className="text-sm font-medium text-primary hover:underline">
            Go to Asset Directory →
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
