import { AssetCondition } from "@prisma/client";
import { z } from "zod";

export const registerAssetSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  categoryId: z.string().min(1, "Category is required"),
  serialNumber: z.string().max(200).optional(),
  acquisitionDate: z.date(),
  acquisitionCost: z.number().nonnegative(),
  condition: z.enum(AssetCondition),
  location: z.string().min(1, "Location is required").max(200),
  isBookable: z.boolean(),
  departmentId: z.string().optional(),
});
export type RegisterAssetInput = z.infer<typeof registerAssetSchema>;
