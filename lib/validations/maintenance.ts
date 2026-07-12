import { Priority } from "@prisma/client";
import { z } from "zod";

export const raiseMaintenanceSchema = z.object({
  assetId: z.string().min(1),
  issue: z.string().min(1, "Describe the issue").max(2000),
  priority: z.enum(Priority),
  photoUrl: z.string().max(500).optional(),
});
export type RaiseMaintenanceInput = z.infer<typeof raiseMaintenanceSchema>;

export const approveMaintenanceSchema = z.object({
  maintenanceRequestId: z.string().min(1),
  technician: z.string().max(200).optional(),
});
export type ApproveMaintenanceInput = z.infer<typeof approveMaintenanceSchema>;

export const resolveMaintenanceSchema = z.object({
  maintenanceRequestId: z.string().min(1),
  resolution: z.string().max(2000).optional(),
});
export type ResolveMaintenanceInput = z.infer<typeof resolveMaintenanceSchema>;
