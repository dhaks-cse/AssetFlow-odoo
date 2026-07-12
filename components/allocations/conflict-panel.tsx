"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "sonner";
import { TriangleAlertIcon } from "lucide-react";

import type { ConflictPayload } from "@/lib/actions/allocations";
import { notifyHolderAction, requestTransferAction } from "@/lib/actions/allocations";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

// This *is* Innovation #2 from the brief: a conflict becomes a resolution
// panel — holder, overdue flag, similar alternatives — never a red toast.
export function ConflictPanel({
  conflict,
  onClose,
}: {
  conflict: ConflictPayload;
  onClose?: () => void;
}) {
  const [showSimilar, setShowSimilar] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [pendingAction, setPendingAction] = useState<"transfer" | "notify" | null>(null);

  function handleRequestTransfer() {
    setPendingAction("transfer");
    startTransition(async () => {
      try {
        await requestTransferAction({ allocationId: conflict.allocationId });
        toast.success("Transfer requested — pending Asset Manager approval.");
      } catch {
        toast.error("Couldn't request the transfer. Try again.");
      } finally {
        setPendingAction(null);
      }
    });
  }

  function handleNotify() {
    setPendingAction("notify");
    startTransition(async () => {
      const result = await notifyHolderAction(conflict.allocationId);
      if (result.success) {
        toast.success(`${conflict.holder} notified.`);
      } else {
        toast.error(result.error ?? "Couldn't send the notification.");
      }
      setPendingAction(null);
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <p className="text-sm font-medium">
          {conflict.assetTag} · {conflict.assetName} — held by{" "}
          <span className="font-semibold">{conflict.holder}</span>
          {conflict.holderDept ? ` (${conflict.holderDept})` : ""}
        </p>
        <p className="text-xs text-muted-foreground">
          Allocated {format(new Date(conflict.since), "MMM d")}
          {conflict.due ? ` · Due ${format(new Date(conflict.due), "MMM d")}` : ""}
        </p>
      </div>

      {conflict.overdueDays > 0 ? (
        <Alert variant="destructive">
          <TriangleAlertIcon />
          <AlertTitle>{conflict.overdueDays} days overdue</AlertTitle>
          <AlertDescription>This asset should have been returned already.</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button size="sm" disabled={isPending} onClick={handleRequestTransfer}>
          {pendingAction === "transfer" ? "Requesting…" : "Request Transfer"}
        </Button>
        <Button size="sm" variant="outline" disabled={isPending} onClick={handleNotify}>
          {pendingAction === "notify" ? "Notifying…" : `Notify ${conflict.holder.split(" ")[0]}`}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setShowSimilar((v) => !v)}>
          Find Similar Available
        </Button>
      </div>

      {showSimilar ? (
        <div className="space-y-1.5 rounded-lg border p-2">
          {conflict.similar.length === 0 ? (
            <p className="p-1 text-sm text-muted-foreground">
              No similar assets are available right now.
            </p>
          ) : (
            conflict.similar.map((asset) => (
              <Link
                key={asset.id}
                href={`/assets/${asset.id}`}
                onClick={onClose}
                className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted"
              >
                <span>
                  <span className="font-medium">{asset.assetTag}</span> — {asset.name}
                </span>
                <Badge variant="outline">{asset.location}</Badge>
              </Link>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
