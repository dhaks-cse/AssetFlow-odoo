import { redirect } from "next/navigation";
import { format } from "date-fns";

import { auth } from "@/auth";
import {
  getMyActiveAllocations,
  getOverdueAllocations,
  getTransferRequests,
} from "@/lib/queries/allocations";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ReturnDialog } from "@/components/allocations/return-dialog";
import { TransferRequestActions } from "@/components/allocations/transfer-request-actions";

function fmt(date: Date | null | undefined) {
  return date ? format(date, "MMM d, yyyy") : "—";
}

export default async function AllocationsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const isPrivileged = ["ASSET_MANAGER", "ADMIN"].includes(session.user.role);

  const [myAllocations, overdue, transferRequests] = await Promise.all([
    getMyActiveAllocations(session.user.id),
    getOverdueAllocations(),
    getTransferRequests(),
  ]);

  const pendingTransfers = transferRequests.filter((t) => t.status === "REQUESTED");
  const resolvedTransfers = transferRequests.filter((t) => t.status !== "REQUESTED");
  const allTransfers = [...pendingTransfers, ...resolvedTransfers];

  return (
    <div className="flex flex-1 flex-col gap-8 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Allocations</h1>
        <p className="text-sm text-muted-foreground">
          What you hold, what&apos;s overdue, and pending transfers.
        </p>
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold">My Allocations</h2>
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead>Allocated</TableHead>
                <TableHead>Expected Return</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {myAllocations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-20 text-center text-muted-foreground">
                    You don&apos;t currently hold any assets.
                  </TableCell>
                </TableRow>
              ) : (
                myAllocations.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">
                      {a.asset.assetTag} — {a.asset.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{fmt(a.allocatedAt)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {fmt(a.expectedReturnDate)}
                    </TableCell>
                    <TableCell className="text-right">
                      <ReturnDialog allocationId={a.id} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold">Overdue Returns</h2>
        <div className="overflow-hidden rounded-lg border">
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
                      {a.asset.assetTag} — {a.asset.name}
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

      <section className="space-y-2">
        <h2 className="text-sm font-semibold">Transfer Requests</h2>
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead>Requested By</TableHead>
                <TableHead>For</TableHead>
                <TableHead>Status</TableHead>
                {isPrivileged ? <TableHead className="text-right">Action</TableHead> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {allTransfers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={isPrivileged ? 5 : 4}
                    className="h-20 text-center text-muted-foreground"
                  >
                    No transfer requests.
                  </TableCell>
                </TableRow>
              ) : (
                allTransfers.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">
                      {t.allocation.asset.assetTag} — {t.allocation.asset.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{t.requestedByName}</TableCell>
                    <TableCell className="text-muted-foreground">{t.requestedForName}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          t.status === "REQUESTED"
                            ? "outline"
                            : t.status === "APPROVED"
                              ? "default"
                              : "destructive"
                        }
                      >
                        {t.status}
                      </Badge>
                    </TableCell>
                    {isPrivileged ? (
                      <TableCell className="text-right">
                        {t.status === "REQUESTED" ? (
                          <TransferRequestActions transferRequestId={t.id} />
                        ) : null}
                      </TableCell>
                    ) : null}
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
