"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { Role } from "@prisma/client";

import { allocateAssetAction, type ConflictPayload } from "@/lib/actions/allocations";
import { allocateSchema, type AllocateInput } from "@/lib/validations/allocations";
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
import { ConflictPanel } from "@/components/allocations/conflict-panel";

const PRIVILEGED_ROLES: Role[] = ["ASSET_MANAGER", "ADMIN"];

export function AllocateDialog({
  assetId,
  currentUser,
  employees,
}: {
  assetId: string;
  currentUser: { id: string; role: Role };
  employees: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [conflict, setConflict] = useState<ConflictPayload | null>(null);
  const [isPending, startTransition] = useTransition();

  const canPickHolder = PRIVILEGED_ROLES.includes(currentUser.role);

  const form = useForm<AllocateInput>({
    resolver: zodResolver(allocateSchema),
    defaultValues: { assetId, holderId: currentUser.id, expectedReturnDate: undefined },
  });

  function onSubmit(values: AllocateInput) {
    startTransition(async () => {
      const result = await allocateAssetAction(values);
      if (result.conflict) {
        setConflict(result);
        return;
      }
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Asset allocated.");
      setOpen(false);
      form.reset({ assetId, holderId: currentUser.id, expectedReturnDate: undefined });
      router.refresh();
    });
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setConflict(null);
      form.reset({ assetId, holderId: currentUser.id, expectedReturnDate: undefined });
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button size="sm" />}>Allocate</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{conflict ? "Already allocated" : "Allocate asset"}</DialogTitle>
          <DialogDescription>
            {conflict
              ? "This asset already has an active holder."
              : "Assign this asset to an employee."}
          </DialogDescription>
        </DialogHeader>

        {conflict ? (
          <ConflictPanel conflict={conflict} onClose={() => handleOpenChange(false)} />
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {canPickHolder ? (
                <FormField
                  control={form.control}
                  name="holderId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Holder</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select an employee" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
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
              ) : null}
              <FormField
                control={form.control}
                name="expectedReturnDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expected return date (optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        value={field.value ? new Date(field.value).toISOString().slice(0, 10) : ""}
                        onChange={(e) =>
                          field.onChange(e.target.value ? new Date(e.target.value) : undefined)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Allocating…" : "Allocate"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
