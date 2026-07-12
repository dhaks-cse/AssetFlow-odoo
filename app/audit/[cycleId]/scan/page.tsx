import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Role } from "@prisma/client";

import { auth } from "@/auth";
import { getAuditCycle, getAuditProgress } from "@/lib/queries/audits";
import { AuditScannerView } from "@/components/audits/audit-scanner-view";

const PRIVILEGED_ROLES: Role[] = ["ASSET_MANAGER", "ADMIN"];

// Outside the (app) route group on purpose — this is a full-bleed,
// mobile-first camera view with no sidebar/topbar chrome.
export default async function AuditScanPage({
  params,
}: {
  params: Promise<{ cycleId: string }>;
}) {
  const { cycleId } = await params;
  const [cycle, session] = await Promise.all([getAuditCycle(cycleId), auth()]);

  if (!cycle) notFound();
  if (!session?.user) redirect("/login");

  const isPrivileged = PRIVILEGED_ROLES.includes(session.user.role);
  const isAuditor = cycle.auditors.some((a) => a.id === session.user.id);
  if (!isPrivileged && !isAuditor) {
    redirect("/audits");
  }

  if (cycle.status !== "OPEN") {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-3 bg-black p-6 text-center text-white">
        <p className="text-sm text-white/70">This audit cycle is closed.</p>
        <Link href="/audits" className="text-sm underline">
          Back to audits
        </Link>
      </div>
    );
  }

  const progress = await getAuditProgress(cycleId);

  return (
    <AuditScannerView
      cycleId={cycleId}
      cycleName={cycle.name}
      initialScanned={progress.scanned}
      total={progress.total}
    />
  );
}
