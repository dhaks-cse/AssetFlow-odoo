import { z } from "zod";

export const createBookingSchema = z
  .object({
    assetId: z.string().min(1),
    startTime: z.date(),
    endTime: z.date(),
    purpose: z.string().max(500).optional(),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  });
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
