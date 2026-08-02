import { Wallet } from "@prisma/client";
import { walletRepository } from "../repositories/wallet.repository.js";
import { Prisma } from "@prisma/client";
import { AppError } from "../utils/errors.js";
import { ErrorMessages } from "../constants/messages.js";

export const walletService = {
  async list(userId: bigint, page: number, limit: number) {
    const { data, total } = await walletRepository.findByUserId(userId, { page, limit });
    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async getByPublicId(userId: bigint, publicId: string): Promise<Wallet> {
    const wallet = await walletRepository.findByPublicIdAndUserId(publicId, userId);
    if (!wallet) throw new AppError(ErrorMessages.NOT_FOUND, 404);
    return wallet;
  },

  async create(
    userId: bigint,
    input: { name: string; currency?: string; balance?: number; isDefault?: boolean }
  ): Promise<Wallet> {
    return walletRepository.create({
      userId,
      name: input.name,
      currency: input.currency ?? "IDR",
      balance: new Prisma.Decimal(input.balance ?? 0),
      isDefault: input.isDefault ?? false,
    });
  },

  async update(
    userId: bigint,
    publicId: string,
    input: Partial<Pick<Wallet, "name" | "currency" | "isDefault">>
  ): Promise<Wallet> {
    await this.getByPublicId(userId, publicId);
    const updated = await walletRepository.update(publicId, userId, input);
    if (!updated) throw new AppError(ErrorMessages.NOT_FOUND, 404);
    return updated;
  },

  async delete(userId: bigint, publicId: string): Promise<void> {
    await this.getByPublicId(userId, publicId);
    await walletRepository.delete(publicId, userId);
  },
};