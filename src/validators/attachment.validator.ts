import { z } from "zod";

export const attachmentPublicIdSchema = z.object({
  publicId: z.string().min(1),
});

export const createAttachmentSchema = z.object({
  transactionPublicId: z.string().min(1).optional(),
  fileName: z.string().min(1).max(255),
  fileUrl: z.string().url().max(2048),
  mimeType: z.string().min(1).max(100),
  fileSize: z.number().int().nonnegative(),
});

export const listAttachmentQuerySchema = z.object({
  transactionPublicId: z.string().min(1).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
});

export type CreateAttachmentInput = z.infer<typeof createAttachmentSchema>;
export type ListAttachmentQuery = z.infer<typeof listAttachmentQuerySchema>;