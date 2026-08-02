import { z } from "zod";

export const walletPublicIdSchema = z.object({
  publicId: z.string().min(1),
});

export const createWalletSchema = z.object({
  name: z.string().min(1).max(100),
  currency: z.string().min(3).max(10).optional().default("IDR"),
  balance: z.number().nonnegative().optional().default(0),
  isDefault: z.boolean().optional().default(false),
});

export const updateWalletSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  currency: z.string().min(3).max(10).optional(),
  isDefault: z.boolean().optional(),
});

export const listWalletQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
});

export type CreateWalletInput = z.infer<typeof createWalletSchema>;
export type UpdateWalletInput = z.infer<typeof updateWalletSchema>;
export type ListWalletQuery = z.infer<typeof listWalletQuerySchema>;