import { notFound, redirect } from "next/navigation";
import { format } from "date-fns";

import { auth } from "@/auth";
import { getAssetDetail } from "@/lib/queries/assets";
import { getEmployeesForSelect } from "@/lib/queries/employees";
import { getBookingsForAssetOnDate } from "@/lib/queries/bookings";
import { AssetStatusBadge } from "@/components/assets/asset-status-badge";
import { AllocateDialog } from "@/components/allocations/allocate-dialog";
import { ReturnDialog } from "@/components/allocations/return-dialog";
import { BookingDatePicker } from "@/components/bookings/booking-date-picker";
import { BookingDialog } from "@/components/bookings/booking-dialog";
import { TimeSlotList } from "@/components/bookings/time-slot-list";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const NOT_ALLOCATABLE = new Set(["UNDER_MAINTENANCE", "LOST", "RETIRED", "DISPOSED"]);
const PRIVILEGED_ROLES = ["ASSET_MANAGER", "ADMIN"];

function fmt(date: Date | null | undefined) {
  return date ? format(date, "MMM d, yyyy") : "—";
}

function parseDateParam(value: string | undefined) {
  if (!value) return new Date();
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

export default async function AssetDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const { id } = await params;
  const { date: dateParam } = await searchParams;
  const [asset, session] = await Promise.all([getAssetDetail(id), auth()]);

  if (!asset) notFound();
  if (!session?.user) redirect("/login");

  const activeAllocation = asset.allocations.find((a) => a.returnedAt === null);
  const isHolder = activeAllocation?.holderId === session.user.id;
  const canAllocate = !NOT_ALLOCATABLE.has(asset.status);
  const employees = canAllocate && !isHolder ? await getEmployeesForSelect() : [];
  const isPrivileged = PRIVILEGED_ROLES.includes(session.user.role);

  const selectedDate = parseDateParam(dateParam);
  const bookings = asset.isBookable
    ? await getBookingsForAssetOnDate(asset.id, selectedDate)
    : [];

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{asset.name}</h1>
        <Badge variant="secondary">{asset.assetTag}</Badge>
        <AssetStatusBadge status={asset.status} />
        <div className="ml-auto">
          {isHolder ? (
            <ReturnDialog allocationId={activeAllocation!.id} />
          ) : canAllocate ? (
            <AllocateDialog
              assetId={asset.id}
              currentUser={{ id: session.user.id, role: session.user.role }}
              employees={employees}
            />
          ) : null}
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {asset.isBookable ? <TabsTrigger value="bookings">Bookings</TabsTrigger> : null}
          <TabsTrigger value="allocation">Allocation History</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <dl className="grid grid-cols-1 gap-x-8 gap-y-4 rounded-lg border p-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Category" value={asset.category.name} />
            <Field label="Department" value={asset.department?.name ?? "—"} />
            <Field label="Serial Number" value={asset.serialNumber ?? "—"} />
            <Field label="Location" value={asset.location} />
            <Field label="Condition" value={asset.condition.replace(/_/g, " ")} />
            <Field label="Bookable" value={asset.isBookable ? "Yes" : "No"} />
            <Field label="Acquisition Date" value={fmt(asset.acquisitionDate)} />
            <Field label="Acquisition Cost" value={`$${asset.acquisitionCost.toString()}`} />
            <Field
              label="Current Holder"
              value={activeAllocation?.holder?.name ?? activeAllocation?.department?.name ?? "—"}
            />
          </dl>
        </TabsContent>

        {asset.isBookable ? (
          <TabsContent value="bookings" className="mt-4 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <BookingDatePicker date={selectedDate} />
              <div className="ml-auto">
                <BookingDialog assetId={asset.id} date={selectedDate} />
              </div>
            </div>
            <TimeSlotList
              date={selectedDate}
              bookings={bookings}
              currentUserId={session.user.id}
              canCancelAny={isPrivileged}
            />
          </TabsContent>
        ) : null}

        <TabsContent value="allocation" className="mt-4">
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Holder</TableHead>
                  <TableHead>Allocated By</TableHead>
                  <TableHead>Allocated</TableHead>
                  <TableHead>Expected Return</TableHead>
                  <TableHead>Returned</TableHead>
                  <TableHead>Return Condition</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {asset.allocations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No allocation history.
                    </TableCell>
                  </TableRow>
                ) : (
                  asset.allocations.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">
                        {a.holder?.name ?? a.department?.name ?? "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{a.allocatedBy.name}</TableCell>
                      <TableCell className="text-muted-foreground">{fmt(a.allocatedAt)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {fmt(a.expectedReturnDate)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {a.returnedAt ? fmt(a.returnedAt) : <Badge variant="outline">Current</Badge>}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {a.returnCondition?.replace(/_/g, " ") ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="maintenance" className="mt-4">
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Issue</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Raised By</TableHead>
                  <TableHead>Raised</TableHead>
                  <TableHead>Resolved</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {asset.maintenance.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No maintenance history.
                    </TableCell>
                  </TableRow>
                ) : (
                  asset.maintenance.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="max-w-64 truncate font-medium">{m.issue}</TableCell>
                      <TableCell className="text-muted-foreground">{m.priority}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {m.status.replace(/_/g, " ")}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{m.raisedBy.name}</TableCell>
                      <TableCell className="text-muted-foreground">{fmt(m.createdAt)}</TableCell>
                      <TableCell className="text-muted-foreground">{fmt(m.resolvedAt)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{value}</dd>
    </div>
  );
}
