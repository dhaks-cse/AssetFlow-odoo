import { AssetCondition } from "@prisma/client";
import { z } from "zod";

export const allocateSchema = z.object({
  assetId: z.string().min(1),
  holderId: z.string().min(1),
  expectedReturnDate: z.date().optional(),
});
export type AllocateInput = z.infer<typeof allocateSchema>;

export const requestTransferSchema = z.object({
  allocationId: z.string().min(1),
  reason: z.string().max(500).optional(),
});
export type RequestTransferInput = z.infer<typeof requestTransferSchema>;

export const returnAssetSchema = z.object({
  allocationId: z.string().min(1),
  checkInNotes: z.string().max(2000).optional(),
  returnCondition: z.enum(AssetCondition),
});
export type ReturnAssetInput = z.infer<typeof returnAssetSchema>;
