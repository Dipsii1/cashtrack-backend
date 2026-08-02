import { z } from "zod";
import { isoDate } from "./common.js";

export const savingsGoalPublicIdSchema = z.object({
  publicId: z.string().min(1),
});

export const createSavingsGoalSchema = z.object({
  name: z.string().min(1).max(100),
  targetAmount: z.number().positive().multipleOf(0.01),
  targetDate: isoDate.optional(),
});

export const updateSavingsGoalSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  targetAmount: z.number().positive().multipleOf(0.01).optional(),
  targetDate: isoDate.nullable().optional(),
  currentAmount: z.number().nonnegative().multipleOf(0.01).optional(),
  isAchieved: z.boolean().optional(),
});

export const listSavingsGoalQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
});

export type CreateSavingsGoalInput = z.infer<typeof createSavingsGoalSchema>;
export type UpdateSavingsGoalInput = z.infer<typeof updateSavingsGoalSchema>;
export type ListSavingsGoalQuery = z.infer<typeof listSavingsGoalQuerySchema>;