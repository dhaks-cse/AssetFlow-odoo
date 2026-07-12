"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { cancelBookingAction } from "@/lib/actions/bookings";
import { Button } from "@/components/ui/button";

export function CancelBookingButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function onCancel() {
    startTransition(async () => {
      try {
        await cancelBookingAction(bookingId);
        toast.success("Booking cancelled.");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Couldn't cancel the booking.");
      }
    });
  }

  return (
    <Button size="xs" variant="outline" disabled={isPending} onClick={onCancel}>
      {isPending ? "Cancelling…" : "Cancel"}
    </Button>
  );
}
