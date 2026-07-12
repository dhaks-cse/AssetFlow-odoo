"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { closeAuditCycleAction } from "@/lib/actions/audits";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function CloseCycleButton({ cycleId }: { cycleId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function onConfirm() {
    startTransition(async () => {
      const result = await closeAuditCycleAction(cycleId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(
        `Cycle closed — ${result.verified} verified, ${result.missing} now marked LOST, ${result.damaged} damaged, ${result.pending} never scanned.`
      );
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="destructive" size="sm" />}>
        Close Cycle
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Close this audit cycle?</DialogTitle>
          <DialogDescription>
            Every item still marked Missing will flip to LOST. This can&apos;t be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="destructive" disabled={isPending} onClick={onConfirm}>
            {isPending ? "Closing…" : "Close cycle"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
