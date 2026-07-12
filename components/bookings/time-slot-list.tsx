import { format } from "date-fns";

import type { BookingListItem } from "@/lib/queries/bookings";
import { Badge } from "@/components/ui/badge";
import { CancelBookingButton } from "@/components/bookings/cancel-booking-button";

const DAY_START_HOUR = 7;
const DAY_END_HOUR = 21; // exclusive — last row is 20:00-21:00

const STATUS_VARIANT: Record<BookingListItem["derivedStatus"], "outline" | "default" | "secondary" | "destructive"> = {
  UPCOMING: "outline",
  ONGOING: "default",
  COMPLETED: "secondary",
  CANCELLED: "destructive",
};

function hourBounds(date: Date, hour: number) {
  const start = new Date(date);
  start.setHours(hour, 0, 0, 0);
  const end = new Date(date);
  end.setHours(hour + 1, 0, 0, 0);
  return { start, end };
}

export function TimeSlotList({
  date,
  bookings,
  currentUserId,
  canCancelAny,
}: {
  date: Date;
  bookings: BookingListItem[];
  currentUserId: string;
  canCancelAny: boolean;
}) {
  const rows = [];
  for (let hour = DAY_START_HOUR; hour < DAY_END_HOUR; hour++) {
    const { start, end } = hourBounds(date, hour);
    const covering = bookings.find((b) => b.startTime < end && b.endTime > start);
    const isStartHour = covering && covering.startTime >= start && covering.startTime < end;
    rows.push({ hour, covering, isStartHour });
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      {rows.map(({ hour, covering, isStartHour }) => (
        <div
          key={hour}
          className="flex items-center gap-3 border-b px-3 py-2 text-sm last:border-b-0"
        >
          <span className="w-16 shrink-0 text-xs text-muted-foreground">
            {format(hourBounds(date, hour).start, "h a")}
          </span>

          {!covering ? (
            <span className="text-muted-foreground">Free</span>
          ) : isStartHour ? (
            <div className="flex flex-1 flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-medium">
                  {format(covering.startTime, "h:mm a")}–{format(covering.endTime, "h:mm a")} ·{" "}
                  {covering.bookedBy.name}
                </p>
                {covering.purpose ? (
                  <p className="text-xs text-muted-foreground">{covering.purpose}</p>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={STATUS_VARIANT[covering.derivedStatus]}>
                  {covering.derivedStatus}
                </Badge>
                {covering.derivedStatus !== "CANCELLED" &&
                covering.derivedStatus !== "COMPLETED" &&
                (covering.bookedById === currentUserId || canCancelAny) ? (
                  <CancelBookingButton bookingId={covering.id} />
                ) : null}
              </div>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground italic">continued…</span>
          )}
        </div>
      ))}
    </div>
  );
}
