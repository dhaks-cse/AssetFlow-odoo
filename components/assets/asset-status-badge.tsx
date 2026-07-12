import type { AssetStatus } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<AssetStatus, string> = {
  AVAILABLE: "Available",
  ALLOCATED: "Allocated",
  RESERVED: "Reserved",
  UNDER_MAINTENANCE: "Under Maintenance",
  LOST: "Lost",
  RETIRED: "Retired",
  DISPOSED: "Disposed",
};

const STATUS_CLASS: Record<AssetStatus, string> = {
  AVAILABLE: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  ALLOCATED: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  RESERVED: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  UNDER_MAINTENANCE: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  LOST: "bg-destructive/10 text-destructive",
  RETIRED: "bg-muted text-muted-foreground",
  DISPOSED: "bg-zinc-500/10 text-zinc-500",
};

export function AssetStatusBadge({
  status,
  className,
}: {
  status: AssetStatus;
  className?: string;
}) {
  return (
    <Badge variant="outline" className={cn("border-transparent", STATUS_CLASS[status], className)}>
      {STATUS_LABEL[status]}
    </Badge>
  );
}
