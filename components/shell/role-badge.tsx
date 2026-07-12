import type { Role } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Admin",
  ASSET_MANAGER: "Asset Manager",
  DEPT_HEAD: "Dept Head",
  EMPLOYEE: "Employee",
};

const ROLE_CLASS: Record<Role, string> = {
  ADMIN: "bg-destructive/10 text-destructive",
  ASSET_MANAGER: "bg-primary/10 text-primary",
  DEPT_HEAD: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  EMPLOYEE: "bg-muted text-muted-foreground",
};

export function RoleBadge({ role, className }: { role: Role; className?: string }) {
  return (
    <Badge variant="outline" className={cn("border-transparent", ROLE_CLASS[role], className)}>
      {ROLE_LABEL[role]}
    </Badge>
  );
}
