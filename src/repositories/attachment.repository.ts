import { Attachment, Prisma } from "@prisma/client";
import { prisma } from "../prisma/client.js";

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

  delete: async (publicId: string, userId: bigint): Promise<boolean> => {
    const result = await prisma.attachment.deleteMany({
      where: { publicId, userId },
    });
    return result.count > 0;
  },
};