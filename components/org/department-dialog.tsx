"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { EmployeeStatus } from "@prisma/client";

import { upsertDepartmentAction } from "@/lib/actions/org";
import { upsertDepartmentSchema, type UpsertDepartmentInput } from "@/lib/validations/org";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const STATUSES: EmployeeStatus[] = ["ACTIVE", "INACTIVE"];
const NO_HEAD = "__none__";

export function DepartmentDialog({
  employees,
  department,
}: {
  employees: { id: string; name: string }[];
  department?: { id: string; name: string; code: string; headId: string | null; status: EmployeeStatus };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isEdit = !!department;

  const defaultValues: UpsertDepartmentInput = {
    id: department?.id,
    name: department?.name ?? "",
    code: department?.code ?? "",
    headId: department?.headId ?? undefined,
    status: department?.status ?? "ACTIVE",
  };

  const form = useForm<UpsertDepartmentInput>({
    resolver: zodResolver(upsertDepartmentSchema),
    defaultValues,
  });

  function onSubmit(values: UpsertDepartmentInput) {
    startTransition(async () => {
      const result = await upsertDepartmentAction(values);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(isEdit ? "Department updated." : "Department created.");
      setOpen(false);
      if (!isEdit) form.reset(defaultValues);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size={isEdit ? "xs" : "sm"} variant={isEdit ? "outline" : "default"} />}>
        {isEdit ? "Edit" : "Add Department"}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit department" : "New department"}</DialogTitle>
          <DialogDescription>Departments are the org units everything else hangs off.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Engineering" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code</FormLabel>
                    <FormControl>
                      <Input placeholder="ENG" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="headId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department Head (optional)</FormLabel>
                  <Select
                    value={field.value ?? NO_HEAD}
                    onValueChange={(v) => field.onChange(v === NO_HEAD ? undefined : v)}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="None" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NO_HEAD}>None</SelectItem>
                      {employees.map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving…" : isEdit ? "Save changes" : "Create department"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
