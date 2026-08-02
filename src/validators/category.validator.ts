import { z } from "zod";

export const categoryPublicIdSchema = z.object({
  publicId: z.string().min(1),
});

export const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  icon: z.string().min(1).max(50).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  type: z.enum(["INCOME", "EXPENSE"]).optional().default("EXPENSE"),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  icon: z.string().min(1).max(50).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  type: z.enum(["INCOME", "EXPENSE"]).optional(),
});

export const listCategoryQuerySchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type ListCategoryQuery = z.infer<typeof listCategoryQuerySchema>;