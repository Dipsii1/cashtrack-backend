import { z } from "zod";
import { isoDate } from "./common.js";

export const budgetPublicIdSchema = z.object({
  publicId: z.string().min(1),
});

export const createBudgetSchema = z.object({
  name: z.string().min(1).max(100),
  amount: z.number().positive().multipleOf(0.01),
  period: z.enum(["WEEKLY", "MONTHLY", "YEARLY"]),
  walletPublicId: z.string().min(1).optional(),
  categoryPublicId: z.string().min(1).optional(),
  startDate: isoDate.optional(),
  endDate: isoDate.optional(),
});

export const updateBudgetSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  amount: z.number().positive().multipleOf(0.01).optional(),
  period: z.enum(["WEEKLY", "MONTHLY", "YEARLY"]).optional(),
  walletPublicId: z.string().min(1).optional(),
  categoryPublicId: z.string().min(1).optional(),
  startDate: isoDate.optional(),
  endDate: isoDate.nullable().optional(),
});

export const listBudgetQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
});

export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;
export type ListBudgetQuery = z.infer<typeof listBudgetQuerySchema>;