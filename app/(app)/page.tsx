import Link from "next/link";
import { format } from "date-fns";

import { auth } from "@/auth";
import { getDashboardKpis } from "@/lib/queries/dashboard";
import { getOverdueAllocations } from "@/lib/queries/allocations";
import { getAssetFilterOptions } from "@/lib/queries/assets";
import { getAssetsForMaintenanceSelect } from "@/lib/queries/maintenance";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RegisterAssetDialog } from "@/components/dashboard/register-asset-dialog";
import { RaiseMaintenanceDialog } from "@/components/maintenance/raise-maintenance-dialog";
import { LiveKpis } from "@/components/dashboard/live-kpis";
import { FadeIn } from "@/components/motion/fade-in";

const PRIVILEGED_ROLES = ["ASSET_MANAGER", "ADMIN"];

function fmt(date: Date | null | undefined) {
  return date ? format(date, "MMM d, yyyy") : "—";
}

export default async function DashboardPage() {
  const session = await auth();
  const isPrivileged = PRIVILEGED_ROLES.includes(session?.user.role ?? "");

  const [kpis, overdue, { categories, departments }, maintenanceAssets] = await Promise.all([
    getDashboardKpis(),
    getOverdueAllocations(),
    getAssetFilterOptions(),
    getAssetsForMaintenanceSelect(),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <FadeIn>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome back, {session?.user.name?.split(" ")[0]}
        </h1>
        <p className="text-sm text-muted-foreground">Your organization&apos;s asset snapshot.</p>
      </FadeIn>

      <FadeIn delay={0.05}>
        <LiveKpis initial={kpis} />
      </FadeIn>

      <FadeIn delay={0.1}>
        <section className="space-y-2">
          <h2 className="text-sm font-semibold">Quick Actions</h2>
          <div className="flex flex-wrap gap-2">
            {isPrivileged ? (
              <RegisterAssetDialog categories={categories} departments={departments} />
            ) : null}
            <Button size="sm" variant="outline" render={<Link href="/bookings" />}>
              Book Resource
            </Button>
            <RaiseMaintenanceDialog assets={maintenanceAssets} />
          </div>
        </section>
      </FadeIn>

      <FadeIn delay={0.15}>
        <section className="space-y-2">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-destructive">Overdue Returns</h2>
            {overdue.length > 0 ? <Badge variant="destructive">{overdue.length}</Badge> : null}
          </div>
          <div className="overflow-hidden rounded-lg border border-destructive/30">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>Holder</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Overdue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overdue.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-20 text-center text-muted-foreground">
                      Nothing overdue.
                    </TableCell>
                  </TableRow>
                ) : (
                  overdue.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">
                        <Link href={`/assets/${a.asset.id}`} className="hover:underline">
                          {a.asset.assetTag} — {a.asset.name}
                        </Link>
                      </TableCell>
                      <TableCell>{a.holder?.name ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {a.holder?.department?.name ?? "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {fmt(a.expectedReturnDate)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="destructive">{a.overdueDays}d overdue</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </section>
      </FadeIn>
    </div>
  );
}
