import { z } from "zod";

export const submitAuditResultSchema = z.object({
  auditCycleId: z.string().min(1),
  assetTag: z.string().min(1),
  result: z.enum(["VERIFIED", "MISSING", "DAMAGED"]),
  notes: z.string().max(1000).optional(),
});
export type SubmitAuditResultInput = z.infer<typeof submitAuditResultSchema>;
