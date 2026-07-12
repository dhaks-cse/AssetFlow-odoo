"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { approveTransferAction, rejectTransferAction } from "@/lib/actions/allocations";
import { Button } from "@/components/ui/button";

export function TransferRequestActions({ transferRequestId }: { transferRequestId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function approve() {
    startTransition(async () => {
      try {
        await approveTransferAction(transferRequestId);
        toast.success("Transfer approved and reallocated.");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Couldn't approve the transfer.");
      }
    });
  }

  function reject() {
    startTransition(async () => {
      try {
        await rejectTransferAction(transferRequestId);
        toast.success("Transfer rejected.");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Couldn't reject the transfer.");
      }
    });
  }

  return (
    <div className="flex justify-end gap-2">
      <Button size="xs" disabled={isPending} onClick={approve}>
        Approve
      </Button>
      <Button size="xs" variant="outline" disabled={isPending} onClick={reject}>
        Reject
      </Button>
    </div>
  );
}
