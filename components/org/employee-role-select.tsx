"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Role } from "@prisma/client";

import { promoteEmployeeAction, updateEmployeeStatusAction } from "@/lib/actions/org";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ROLES: Role[] = ["EMPLOYEE", "DEPT_HEAD", "ASSET_MANAGER", "ADMIN"];

export function EmployeeRoleSelect({ employeeId, role }: { employeeId: string; role: Role }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function onChange(next: Role | null) {
    if (!next) return;
    startTransition(async () => {
      const result = await promoteEmployeeAction({ employeeId, role: next });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Role updated.");
      router.refresh();
    });
  }

  return (
    <Select value={role} onValueChange={onChange} disabled={isPending}>
      <SelectTrigger className="h-7 w-40 text-xs" size="sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ROLES.map((r) => (
          <SelectItem key={r} value={r}>
            {r.replace(/_/g, " ")}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function EmployeeStatusSelect({
  employeeId,
  status,
}: {
  employeeId: string;
  status: "ACTIVE" | "INACTIVE";
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function onChange(next: "ACTIVE" | "INACTIVE" | null) {
    if (!next) return;
    startTransition(async () => {
      const result = await updateEmployeeStatusAction({ employeeId, status: next });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Status updated.");
      router.refresh();
    });
  }

  return (
    <Select value={status} onValueChange={onChange} disabled={isPending}>
      <SelectTrigger className="h-7 w-28 text-xs" size="sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ACTIVE">Active</SelectItem>
        <SelectItem value="INACTIVE">Inactive</SelectItem>
      </SelectContent>
    </Select>
  );
}
