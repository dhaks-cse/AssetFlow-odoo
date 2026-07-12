import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import type { Role } from "@prisma/client";

import { auth } from "@/auth";
import { getAuditCycles, getAuditProgress } from "@/lib/queries/audits";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuditProgressBar } from "@/components/audits/audit-progress-bar";
import { CloseCycleButton } from "@/components/audits/close-cycle-button";

const PRIVILEGED_ROLES: Role[] = ["ASSET_MANAGER", "ADMIN"];

export default async function AuditsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const isPrivileged = PRIVILEGED_ROLES.includes(session.user.role);
  const cycles = await getAuditCycles();
  const withProgress = await Promise.all(
    cycles.map(async (cycle) => ({ cycle, progress: await getAuditProgress(cycle.id) }))
  );

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Audit Cycles</h1>
        <p className="text-sm text-muted-foreground">
          Scope, scan, and close physical verification cycles.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {withProgress.length === 0 ? (
          <p className="text-sm text-muted-foreground">No audit cycles yet.</p>
        ) : (
          withProgress.map(({ cycle, progress }) => {
            const isAuditor = cycle.auditors.some((a) => a.id === session.user.id);
            const canScan = isPrivileged || isAuditor;

            return (
              <Card key={cycle.id}>
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base">{cycle.name}</CardTitle>
                    <Badge variant={cycle.status === "OPEN" ? "outline" : "secondary"}>
                      {cycle.status}
                    </Badge>
                  </div>
                  <CardDescription>
                    {cycle.scopeLoc ?? cycle.scopeDept ?? "All assets"} ·{" "}
                    {format(cycle.startDate, "MMM d")}–{format(cycle.endDate, "MMM d")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <AuditProgressBar scanned={progress.scanned} total={progress.total} />
                  <p className="text-xs text-muted-foreground">
                    {progress.VERIFIED} verified · {progress.MISSING} missing ·{" "}
                    {progress.DAMAGED} damaged · {progress.PENDING} pending
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Auditors: {cycle.auditors.map((a) => a.name).join(", ") || "—"}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {cycle.status === "OPEN" && canScan ? (
                      <Button size="sm" render={<Link href={`/audit/${cycle.id}/scan`} />}>
                        Scan
                      </Button>
                    ) : null}
                    {cycle.status === "OPEN" && isPrivileged ? (
                      <CloseCycleButton cycleId={cycle.id} />
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
