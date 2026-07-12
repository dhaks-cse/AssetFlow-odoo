"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { XIcon } from "lucide-react";

import { lookupAuditItemAction, submitAuditResultAction } from "@/lib/actions/audits";
import {
  enqueue,
  flushQueue,
  getQueue,
  type AuditResultValue,
} from "@/lib/offline-audit-queue";
import { QrScanner, type QrScannerControls } from "@/components/audits/qr-scanner";
import { ScanResultCard, type ScanCardAsset } from "@/components/audits/scan-result-card";
import { AuditProgressBar } from "@/components/audits/audit-progress-bar";
import { Button } from "@/components/ui/button";

type Mode = "scanning" | "loading" | "result" | "error";

export function AuditScannerView({
  cycleId,
  cycleName,
  initialScanned,
  total,
}: {
  cycleId: string;
  cycleName: string;
  initialScanned: number;
  total: number;
}) {
  const [mode, setMode] = useState<Mode>("scanning");
  const [asset, setAsset] = useState<ScanCardAsset | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [queuedCount, setQueuedCount] = useState(() =>
    typeof window === "undefined" ? 0 : getQueue(cycleId).length
  );
  const [isOffline, setIsOffline] = useState(() =>
    typeof window === "undefined" ? false : !navigator.onLine
  );
  const [scanned, setScanned] = useState(initialScanned);

  const controlsRef = useRef<QrScannerControls | null>(null);
  const lastScanRef = useRef<string | null>(null);

  const refreshQueuedCount = useCallback(() => {
    setQueuedCount(getQueue(cycleId).length);
  }, [cycleId]);

  const doFlush = useCallback(() => {
    flushQueue(cycleId, (entry) =>
      submitAuditResultAction({
        auditCycleId: entry.auditCycleId,
        assetTag: entry.assetTag,
        result: entry.result,
        notes: entry.notes,
      })
    ).then((flushed) => {
      refreshQueuedCount();
      if (flushed > 0) {
        toast.success(`Synced ${flushed} queued scan${flushed === 1 ? "" : "s"}.`);
      }
    });
  }, [cycleId, refreshQueuedCount]);

  useEffect(() => {
    function handleOnline() {
      setIsOffline(false);
      doFlush();
    }
    function handleOffline() {
      setIsOffline(true);
    }

    if (navigator.onLine) doFlush();
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [doFlush, refreshQueuedCount]);

  function resumeScanning() {
    lastScanRef.current = null;
    setAsset(null);
    setErrorMessage(null);
    setMode("scanning");
    controlsRef.current?.resume();
  }

  function handleScan(decodedText: string) {
    const tag = decodedText.trim();
    if (mode !== "scanning" || tag === lastScanRef.current) return;
    lastScanRef.current = tag;
    controlsRef.current?.pause();
    setMode("loading");

    lookupAuditItemAction(cycleId, tag).then((result) => {
      if (!result.found) {
        setErrorMessage(result.error);
        setMode("error");
        return;
      }
      setAsset({
        assetTag: result.item.assetTag,
        name: result.item.assetName,
        photoUrl: result.item.photoUrl,
        location: result.item.location,
        status: result.item.status,
      });
      setMode("result");
    });
  }

  async function handleVerdict(result: AuditResultValue) {
    if (!asset) return;
    setIsPending(true);

    if (isOffline) {
      enqueue({ auditCycleId: cycleId, assetTag: asset.assetTag, assetName: asset.name, result });
      refreshQueuedCount();
      toast.message(`${asset.assetTag} queued — will sync when back online.`);
      setScanned((n) => n + 1);
      setIsPending(false);
      resumeScanning();
      return;
    }

    try {
      const response = await submitAuditResultAction({
        auditCycleId: cycleId,
        assetTag: asset.assetTag,
        result,
      });
      if (!response.success) {
        toast.error(response.error);
      } else {
        toast.success(`${asset.assetTag} marked ${result.toLowerCase()}.`);
        setScanned((n) => n + 1);
      }
    } catch {
      // A network hiccup despite navigator.onLine reporting true — don't
      // lose the scan, queue it the same as a known-offline submission.
      enqueue({ auditCycleId: cycleId, assetTag: asset.assetTag, assetName: asset.name, result });
      refreshQueuedCount();
      toast.message(`${asset.assetTag} queued — will sync when back online.`);
      setScanned((n) => n + 1);
    } finally {
      setIsPending(false);
      resumeScanning();
    }
  }

  return (
    <div className="flex h-dvh flex-col bg-black text-white">
      <div className="flex items-center justify-between gap-2 p-3">
        <div>
          <p className="text-sm font-medium">{cycleName}</p>
          {queuedCount > 0 ? (
            <p className="text-xs text-amber-400">{queuedCount} pending sync</p>
          ) : null}
        </div>
        <Link href="/audits">
          <Button size="icon-sm" variant="ghost" className="text-white hover:bg-white/10">
            <XIcon />
          </Button>
        </Link>
      </div>

      <div className="relative flex-1 overflow-hidden">
        <QrScanner
          onScan={handleScan}
          onReady={(controls) => {
            controlsRef.current = controls;
          }}
          onError={(message) => {
            setErrorMessage(message);
            setMode("error");
          }}
        />

        {mode !== "scanning" ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 p-4">
            {mode === "loading" ? (
              <p className="text-sm text-white">Looking up…</p>
            ) : mode === "error" ? (
              <div className="w-full max-w-sm space-y-3 rounded-lg bg-card p-4 text-card-foreground">
                <p className="text-sm">{errorMessage}</p>
                <Button className="w-full" onClick={resumeScanning}>
                  Scan next asset
                </Button>
              </div>
            ) : asset ? (
              <ScanResultCard
                asset={asset}
                pending={isPending}
                queuedOffline={isOffline}
                onVerdict={handleVerdict}
              />
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="p-3">
        <AuditProgressBar scanned={scanned} total={total} />
      </div>
    </div>
  );
}
