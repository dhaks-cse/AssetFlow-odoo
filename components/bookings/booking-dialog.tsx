"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { format } from "date-fns";
import { z } from "zod";

import { createBookingAction } from "@/lib/actions/bookings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Collects plain "HH:mm" strings from native time inputs — converted to
// real Date objects (combined with the selected day) only at submit time,
// so this schema never touches z.date()/z.coerce.date() input/output
// mismatches with the RHF resolver.
const timeFormSchema = z
  .object({
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
    purpose: z.string().max(500).optional(),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  });
type TimeFormInput = z.infer<typeof timeFormSchema>;

function combine(date: Date, time: string) {
  const [h, m] = time.split(":").map(Number);
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d;
}

export function BookingDialog({ assetId, date }: { assetId: string; date: Date }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<TimeFormInput>({
    resolver: zodResolver(timeFormSchema),
    defaultValues: { startTime: "", endTime: "", purpose: "" },
  });

  function onSubmit(values: TimeFormInput) {
    startTransition(async () => {
      const result = await createBookingAction({
        assetId,
        startTime: combine(date, values.startTime),
        endTime: combine(date, values.endTime),
        purpose: values.purpose,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Booking created.");
      setOpen(false);
      form.reset({ startTime: "", endTime: "", purpose: "" });
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>New Booking</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Book this resource</DialogTitle>
          <DialogDescription>{format(date, "EEEE, MMMM d")}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="purpose"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purpose (optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Design sync…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Booking…" : "Confirm booking"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
