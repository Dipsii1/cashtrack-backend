import { z } from "zod";
import { isoDate } from "./common.js";

export const transactionPublicIdSchema = z.object({
  publicId: z.string().min(1),
});

export const createTransactionSchema = z
  .object({
    walletPublicId: z.string().min(1),
    categoryPublicId: z.string().min(1).optional(),
    type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]),
    title: z.string().min(1).max(200),
    amount: z.number().positive().multipleOf(0.01),
    note: z.string().max(1000).optional(),
    transactionDate: isoDate.optional(),
    destinationWalletPublicId: z.string().min(1).optional(),
  })
  .refine((data) => !(data.type === "TRANSFER" && data.categoryPublicId), {
    message: "TRANSFER transactions cannot have a category",
    path: ["categoryPublicId"],
  })
  .refine(
    (data) => data.type === "TRANSFER" && data.destinationWalletPublicId,
    {
      message: "destinationWalletPublicId is required for TRANSFER",
      path: ["destinationWalletPublicId"],
    }
  )
  .refine(
    (data) =>
      data.type !== "TRANSFER" ||
      (data.destinationWalletPublicId && data.destinationWalletPublicId !== data.walletPublicId),
    {
      message: "Source and destination wallets must be different",
      path: ["destinationWalletPublicId"],
    }
  );

export const updateTransactionSchema = z
  .object({
    categoryPublicId: z.string().min(1).nullable().optional(),
    type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]).optional(),
    title: z.string().min(1).max(200).optional(),
    amount: z.number().positive().multipleOf(0.01).optional(),
    note: z.string().max(1000).nullable().optional(),
    transactionDate: isoDate.optional(),
    destinationWalletPublicId: z.string().min(1).nullable().optional(),
  });

export const listTransactionQuerySchema = z.object({
  startDate: isoDate.optional(),
  endDate: isoDate.optional(),
  walletPublicId: z.string().min(1).optional(),
  categoryPublicId: z.string().min(1).optional(),
  type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]).optional(),
  search: z.string().max(200).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type ListTransactionQuery = z.infer<typeof listTransactionQuerySchema>;
