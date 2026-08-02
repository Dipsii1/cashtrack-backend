import { Attachment, Prisma } from "@prisma/client";
import { attachmentRepository } from "../repositories/attachment.repository.js";
import { transactionRepository } from "../repositories/transaction.repository.js";
import { AppError } from "../utils/errors.js";
import { ErrorMessages } from "../constants/messages.js";

export const attachmentService = {
  async list(userId: bigint, page: number, limit: number, transactionPublicId?: string) {
    const { data, total } = await attachmentRepository.findByUserId(userId, {
      page,
      limit,
      transactionPublicId,
    });
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  },

  async getByPublicId(userId: bigint, publicId: string): Promise<Attachment> {
    const attachment = await attachmentRepository.findByPublicIdAndUserId(publicId, userId);
    if (!attachment) throw new AppError(ErrorMessages.NOT_FOUND, 404);
    return attachment;
  },

  async create(
    userId: bigint,
    input: { transactionPublicId?: string; fileName: string; fileUrl: string; mimeType: string; fileSize: number }
  ): Promise<Attachment> {
    let transactionId: bigint | undefined;
    if (input.transactionPublicId) {
      const tx = await transactionRepository.findByPublicIdAndUserId(input.transactionPublicId, userId);
      if (!tx) throw new AppError("Transaction not found", 404);
      transactionId = tx.id;
    }

    return attachmentRepository.create({
      userId,
      transactionId,
      fileName: input.fileName,
      fileUrl: input.fileUrl,
      mimeType: input.mimeType,
      fileSize: BigInt(input.fileSize),
    });
  },

  async delete(userId: bigint, publicId: string): Promise<void> {
    await this.getByPublicId(userId, publicId);
    await attachmentRepository.delete(publicId, userId);
  },
};