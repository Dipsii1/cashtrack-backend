import { Attachment, Prisma } from "@prisma/client";
import { prisma } from "../prisma/client.js";
import { AppError } from "../utils/errors.js";

export const attachmentRepository = {
  findByUserId: async (
    userId: bigint,
    { transactionPublicId, page, limit }: { transactionPublicId?: string; page: number; limit: number }
  ): Promise<{ data: Attachment[]; total: number }> => {
    const where: Prisma.AttachmentWhereInput = { userId };
    if (transactionPublicId) {
      where.transaction = { publicId: transactionPublicId };
    }

    const [data, total] = await Promise.all([
      prisma.attachment.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.attachment.count({ where }),
    ]);
    return { data, total };
  },

  findByPublicIdAndUserId: (publicId: string, userId: bigint): Promise<Attachment | null> =>
    prisma.attachment.findFirst({
      where: { publicId, userId },
    }),

  create: (data: {
    userId: bigint;
    transactionId?: bigint;
    fileName: string;
    fileUrl: string;
    mimeType: string;
    fileSize: bigint;
  }): Promise<Attachment> =>
    prisma.attachment.create({ data }),

  update: async (
    publicId: string,
    userId: bigint,
    data: Partial<Pick<Attachment, "transactionId" | "fileName" | "fileUrl" | "mimeType" | "fileSize">>
  ): Promise<Attachment> => {
    const existing = await prisma.attachment.findFirst({ where: { publicId, userId } });
    if (!existing) throw new AppError("Attachment not found", 404);
    return prisma.attachment.update({
      where: { id: existing.id },
      data,
    });
  },

  delete: async (publicId: string, userId: bigint): Promise<boolean> => {
    const result = await prisma.attachment.deleteMany({
      where: { publicId, userId },
    });
    return result.count > 0;
  },
};