import { redirect } from "next/navigation";
import { format } from "date-fns";
import type { MaintenanceStatus, Priority } from "@prisma/client";

import { auth } from "@/auth";
import { getMaintenanceRequests, getAssetsForMaintenanceSelect } from "@/lib/queries/maintenance";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RaiseMaintenanceDialog } from "@/components/maintenance/raise-maintenance-dialog";
import { MaintenanceRequestActions } from "@/components/maintenance/maintenance-request-actions";

const PRIVILEGED_ROLES = ["ASSET_MANAGER", "ADMIN"];

const PRIORITY_VARIANT: Record<Priority, "outline" | "secondary" | "default" | "destructive"> = {
  LOW: "outline",
  MEDIUM: "secondary",
  HIGH: "default",
  CRITICAL: "destructive",
};

const STATUS_VARIANT: Record<MaintenanceStatus, "outline" | "secondary" | "default" | "destructive"> = {
  PENDING: "outline",
  APPROVED: "secondary",
  REJECTED: "destructive",
  IN_PROGRESS: "default",
  RESOLVED: "secondary",
};

function fmt(date: Date | null | undefined) {
  return date ? format(date, "MMM d, yyyy") : "—";
}

export default async function MaintenancePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const isPrivileged = PRIVILEGED_ROLES.includes(session.user.role);

  const [requests, assets] = await Promise.all([
    getMaintenanceRequests(),
    getAssetsForMaintenanceSelect(),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Maintenance</h1>
          <p className="text-sm text-muted-foreground">
            Repair requests, routed through approval before work starts.
          </p>
        </div>
        <div className="ml-auto">
          <RaiseMaintenanceDialog assets={assets} />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Asset</TableHead>
              <TableHead>Issue</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Technician</TableHead>
              <TableHead>Raised By</TableHead>
              <TableHead>Raised</TableHead>
              {isPrivileged ? <TableHead className="text-right">Action</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={isPrivileged ? 8 : 7}
                  className="h-24 text-center text-muted-foreground"
                >
                  No maintenance requests.
                </TableCell>
              </TableRow>
            ) : (
              requests.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">
                    {r.asset.assetTag} — {r.asset.name}
                  </TableCell>
                  <TableCell className="max-w-64 truncate text-muted-foreground">{r.issue}</TableCell>
                  <TableCell>
                    <Badge variant={PRIORITY_VARIANT[r.priority]}>{r.priority}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[r.status]}>{r.status.replace(/_/g, " ")}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{r.technician ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{r.raisedBy.name}</TableCell>
                  <TableCell className="text-muted-foreground">{fmt(r.createdAt)}</TableCell>
                  {isPrivileged ? (
                    <TableCell className="text-right">
                      <MaintenanceRequestActions requestId={r.id} status={r.status} />
                    </TableCell>
                  ) : null}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
