import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "date-fns";

import { auth } from "@/auth";
import { getBookableAssets, getMyBookings } from "@/lib/queries/bookings";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CancelBookingButton } from "@/components/bookings/cancel-booking-button";

function fmtRange(start: Date, end: Date) {
  return `${format(start, "MMM d, h:mm a")} – ${format(end, "h:mm a")}`;
}

export default async function BookingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [myBookings, resources] = await Promise.all([
    getMyBookings(session.user.id),
    getBookableAssets(),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-8 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Bookings</h1>
        <p className="text-sm text-muted-foreground">
          Your upcoming reservations and every bookable resource.
        </p>
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold">My Bookings</h2>
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Resource</TableHead>
                <TableHead>When</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {myBookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-20 text-center text-muted-foreground">
                    No upcoming bookings.
                  </TableCell>
                </TableRow>
              ) : (
                myBookings.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">
                      <Link href={`/assets/${b.assetId}?date=${format(b.startTime, "yyyy-MM-dd")}`}>
                        {b.asset.assetTag} — {b.asset.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {fmtRange(b.startTime, b.endTime)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{b.purpose ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={b.derivedStatus === "ONGOING" ? "default" : "outline"}>
                        {b.derivedStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {b.derivedStatus === "UPCOMING" || b.derivedStatus === "ONGOING" ? (
                        <CancelBookingButton bookingId={b.id} />
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold">Bookable Resources</h2>
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tag</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Location</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resources.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-20 text-center text-muted-foreground">
                    No bookable resources yet.
                  </TableCell>
                </TableRow>
              ) : (
                resources.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell className="font-medium">
                      <Link href={`/assets/${asset.id}`}>{asset.assetTag}</Link>
                    </TableCell>
                    <TableCell>
                      <Link href={`/assets/${asset.id}`}>{asset.name}</Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{asset.location}</TableCell>
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
