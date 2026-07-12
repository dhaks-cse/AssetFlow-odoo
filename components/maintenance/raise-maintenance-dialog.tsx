"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Priority } from "@prisma/client";

import { raiseMaintenanceAction } from "@/lib/actions/maintenance";
import { raiseMaintenanceSchema, type RaiseMaintenanceInput } from "@/lib/validations/maintenance";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const PRIORITIES: Priority[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

export function RaiseMaintenanceDialog({
  assets,
}: {
  assets: { id: string; assetTag: string; name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const defaultValues: RaiseMaintenanceInput = {
    assetId: "",
    issue: "",
    priority: "MEDIUM",
    photoUrl: "",
  };

  const form = useForm<RaiseMaintenanceInput>({
    resolver: zodResolver(raiseMaintenanceSchema),
    defaultValues,
  });

  function onSubmit(values: RaiseMaintenanceInput) {
    startTransition(async () => {
      const result = await raiseMaintenanceAction(values);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Maintenance request raised.");
      setOpen(false);
      form.reset(defaultValues);
      router.refresh();
    });
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) form.reset(defaultValues);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button size="sm" />}>Raise Request</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Raise a maintenance request</DialogTitle>
          <DialogDescription>
            Describe the issue — an Asset Manager will review it.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="assetId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Asset</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select an asset" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {assets.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.assetTag} — {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="issue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Issue</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Screen flickers on startup…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PRIORITIES.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="photoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Photo URL (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Submitting…" : "Raise request"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
