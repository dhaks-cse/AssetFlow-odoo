// Client-only localStorage queue for audit scans made while offline.
// Never imported into a server component — only referenced from the
// "use client" scanner view — but every read/write is guarded so it's
// inert (no-op) if it's ever evaluated outside a browser.

const STORAGE_KEY = "assetflow:audit-queue";

export type AuditResultValue = "VERIFIED" | "MISSING" | "DAMAGED";

export type QueuedAuditResult = {
  id: string;
  auditCycleId: string;
  assetTag: string;
  assetName: string;
  result: AuditResultValue;
  notes?: string;
  queuedAt: string;
};

function read(): QueuedAuditResult[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as QueuedAuditResult[]) : [];
  } catch {
    return [];
  }
}

function write(queue: QueuedAuditResult[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
}

export function getQueue(cycleId: string) {
  return read().filter((q) => q.auditCycleId === cycleId);
}

export function enqueue(entry: Omit<QueuedAuditResult, "id" | "queuedAt">) {
  const item: QueuedAuditResult = {
    ...entry,
    id: crypto.randomUUID(),
    queuedAt: new Date().toISOString(),
  };
  write([...read(), item]);
  return item;
}

export function removeFromQueue(id: string) {
  write(read().filter((q) => q.id !== id));
}

/**
 * Attempts to submit every queued entry for this cycle via `submit`.
 * Entries that succeed are removed; entries that fail (still offline, or a
 * transient server error) stay queued for the next flush.
 */
export async function flushQueue(
  cycleId: string,
  submit: (entry: QueuedAuditResult) => Promise<{ success: boolean }>
) {
  const pending = getQueue(cycleId);
  let flushed = 0;
  for (const entry of pending) {
    try {
      const result = await submit(entry);
      if (result.success) {
        removeFromQueue(entry.id);
        flushed++;
      }
    } catch {
      // Leave it queued — network is still bad, try again next time.
    }
  }
  return flushed;
}
