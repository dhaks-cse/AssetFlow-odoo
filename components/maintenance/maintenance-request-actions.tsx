"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { MaintenanceStatus } from "@prisma/client";

import {
  approveMaintenanceAction,
  rejectMaintenanceAction,
  resolveMaintenanceAction,
  startMaintenanceAction,
} from "@/lib/actions/maintenance";
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

function ApproveDialog({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [technician, setTechnician] = useState("");
  const [isPending, startTransition] = useTransition();

  function approve() {
    startTransition(async () => {
      const result = await approveMaintenanceAction({
        maintenanceRequestId: requestId,
        technician: technician || undefined,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Request approved — asset is now under maintenance.");
      setOpen(false);
      setTechnician("");
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="xs" />}>Approve</DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Approve request</DialogTitle>
          <DialogDescription>The asset flips to Under Maintenance.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <label className="text-sm font-medium">Technician (optional)</label>
          <Input
            placeholder="e.g. Ramesh, IT support"
            value={technician}
            onChange={(e) => setTechnician(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button disabled={isPending} onClick={approve}>
            {isPending ? "Approving…" : "Approve"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ResolveDialog({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [resolution, setResolution] = useState("");
  const [isPending, startTransition] = useTransition();

  function resolve() {
    startTransition(async () => {
      const result = await resolveMaintenanceAction({
        maintenanceRequestId: requestId,
        resolution: resolution || undefined,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Resolved — asset is available again.");
      setOpen(false);
      setResolution("");
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="xs" />}>Resolve</DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Resolve request</DialogTitle>
          <DialogDescription>The asset reverts to Available.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <label className="text-sm font-medium">Resolution notes (optional)</label>
          <Textarea
            placeholder="Replaced the screen…"
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button disabled={isPending} onClick={resolve}>
            {isPending ? "Resolving…" : "Resolve"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function MaintenanceRequestActions({
  requestId,
  status,
}: {
  requestId: string;
  status: MaintenanceStatus;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function reject() {
    startTransition(async () => {
      const result = await rejectMaintenanceAction(requestId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Request rejected.");
      router.refresh();
    });
  }

  function start() {
    startTransition(async () => {
      const result = await startMaintenanceAction(requestId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Work started.");
      router.refresh();
    });
  }

  if (status === "PENDING") {
    return (
      <div className="flex justify-end gap-2">
        <ApproveDialog requestId={requestId} />
        <Button size="xs" variant="outline" disabled={isPending} onClick={reject}>
          Reject
        </Button>
      </div>
    );
  }

  if (status === "APPROVED") {
    return (
      <div className="flex justify-end">
        <Button size="xs" disabled={isPending} onClick={start}>
          Start Work
        </Button>
      </div>
    );
  }

  if (status === "IN_PROGRESS") {
    return (
      <div className="flex justify-end">
        <ResolveDialog requestId={requestId} />
      </div>
    );
  }

  return null;
}
