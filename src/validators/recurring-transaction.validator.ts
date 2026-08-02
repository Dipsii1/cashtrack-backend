import { z } from "zod";

export const recurringPublicIdSchema = z.object({
  publicId: z.string().min(1),
});

export const createRecurringSchema = z.object({
  walletPublicId: z.string().min(1),
  categoryPublicId: z.string().min(1).optional(),
  title: z.string().min(1).max(200),
  amount: z.number().positive().multipleOf(0.01),
  type: z.enum(["INCOME", "EXPENSE"]),
  frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]),
  interval: z.number().int().min(1).max(365).optional().default(1),
  nextRunDate: z.coerce.date().optional(),
});

export const updateRecurringSchema = z.object({
  categoryPublicId: z.string().min(1).optional(),
  title: z.string().min(1).max(200).optional(),
  amount: z.number().positive().multipleOf(0.01).optional(),
  type: z.enum(["INCOME", "EXPENSE"]).optional(),
  frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]).optional(),
  interval: z.number().int().min(1).max(365).optional(),
  nextRunDate: z.coerce.date().optional(),
  isActive: z.boolean().optional(),
});

export const listRecurringQuerySchema = z.object({
  isActive: z.enum(["true", "false"]).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
});

export type CreateRecurringInput = z.infer<typeof createRecurringSchema>;
export type UpdateRecurringInput = z.infer<typeof updateRecurringSchema>;
export type ListRecurringQuery = z.infer<typeof listRecurringQuerySchema>;