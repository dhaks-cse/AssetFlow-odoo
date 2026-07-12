"use client";

import Image from "next/image";
import { AlertTriangleIcon, CheckCircle2Icon, WifiOffIcon, XCircleIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AuditResultValue } from "@/lib/offline-audit-queue";

export type ScanCardAsset = {
  assetTag: string;
  name: string;
  photoUrl: string | null;
  location: string;
  status: string;
};

export function ScanResultCard({
  asset,
  pending,
  queuedOffline,
  onVerdict,
}: {
  asset: ScanCardAsset;
  pending: boolean;
  queuedOffline: boolean;
  onVerdict: (result: AuditResultValue) => void;
}) {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle>{asset.name}</CardTitle>
            <p className="text-sm text-muted-foreground">{asset.assetTag}</p>
          </div>
          {queuedOffline ? (
            <Badge variant="secondary" className="gap-1">
              <WifiOffIcon className="size-3" />
              Pending sync
            </Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {asset.photoUrl ? (
          <div className="relative h-40 w-full overflow-hidden rounded-lg bg-muted">
            <Image
              src={asset.photoUrl}
              alt={asset.name}
              fill
              unoptimized
              className="object-cover"
            />
          </div>
        ) : (
          <div className="flex h-40 w-full items-center justify-center rounded-lg bg-muted text-sm text-muted-foreground">
            No photo
          </div>
        )}

        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">Expected location</dt>
            <dd className="font-medium">{asset.location}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Current status</dt>
            <dd className="font-medium">{asset.status.replace(/_/g, " ")}</dd>
          </div>
        </dl>

        <div className="grid grid-cols-3 gap-2">
          <Button
            size="lg"
            className="h-16 flex-col gap-1 bg-emerald-600 text-white hover:bg-emerald-700"
            disabled={pending}
            onClick={() => onVerdict("VERIFIED")}
          >
            <CheckCircle2Icon className="size-5" />
            Verified
          </Button>
          <Button
            size="lg"
            variant="destructive"
            className="h-16 flex-col gap-1"
            disabled={pending}
            onClick={() => onVerdict("MISSING")}
          >
            <XCircleIcon className="size-5" />
            Missing
          </Button>
          <Button
            size="lg"
            className="h-16 flex-col gap-1 bg-amber-500 text-white hover:bg-amber-600"
            disabled={pending}
            onClick={() => onVerdict("DAMAGED")}
          >
            <AlertTriangleIcon className="size-5" />
            Damaged
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
