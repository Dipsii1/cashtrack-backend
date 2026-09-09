import { z } from "zod";

export const createSavingsContributionSchema = z.object({
  savingsGoalPublicId: z.string(),
  walletPublicId: z.string().optional(),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  note: z.string().optional(),
  contributionDate: z.coerce.date().optional(),
});

export const listSavingsContributionQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  savingsGoalPublicId: z.string().optional(),
});
