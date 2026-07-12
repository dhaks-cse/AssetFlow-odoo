import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ReportsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground">Three fixed views. No builder, no export.</p>
      </div>

      <Card className="w-fit">
        <CardHeader>
          <CardTitle>Coming soon</CardTitle>
          <CardDescription>
            Asset utilization, maintenance frequency, and booking heatmap charts land here.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
