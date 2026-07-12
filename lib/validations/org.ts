import { EmployeeStatus, Role } from "@prisma/client";
import { z } from "zod";

export const upsertDepartmentSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required").max(200),
  code: z.string().min(1, "Code is required").max(20),
  headId: z.string().optional(),
  status: z.enum(EmployeeStatus),
});
export type UpsertDepartmentInput = z.infer<typeof upsertDepartmentSchema>;

export const upsertCategorySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required").max(200),
});
export type UpsertCategoryInput = z.infer<typeof upsertCategorySchema>;

export const promoteEmployeeSchema = z.object({
  employeeId: z.string().min(1),
  role: z.enum(Role),
});
export type PromoteEmployeeInput = z.infer<typeof promoteEmployeeSchema>;

export const updateEmployeeStatusSchema = z.object({
  employeeId: z.string().min(1),
  status: z.enum(EmployeeStatus),
});
export type UpdateEmployeeStatusInput = z.infer<typeof updateEmployeeStatusSchema>;
