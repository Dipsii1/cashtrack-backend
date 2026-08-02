import { Budget } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { budgetRepository } from "../repositories/budget.repository.js";
import { walletRepository } from "../repositories/wallet.repository.js";
import { categoryRepository } from "../repositories/category.repository.js";
import { AppError } from "../utils/errors.js";
import { ErrorMessages } from "../constants/messages.js";

export const budgetService = {
  async list(userId: bigint, page: number, limit: number) {
    const { data, total } = await budgetRepository.findByUserId(userId, { page, limit });
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  },

  async getByPublicId(userId: bigint, publicId: string): Promise<Budget> {
    const budget = await budgetRepository.findByPublicIdAndUserId(publicId, userId);
    if (!budget) throw new AppError(ErrorMessages.NOT_FOUND, 404);
    return budget;
  },

  async create(
    userId: bigint,
    input: {
      name: string;
      amount: number;
      period: "WEEKLY" | "MONTHLY" | "YEARLY";
      walletPublicId?: string;
      categoryPublicId?: string;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<Budget> {
    let walletId: bigint | undefined;
    if (input.walletPublicId) {
      const wallet = await walletRepository.findByPublicIdAndUserId(input.walletPublicId, userId);
      if (!wallet) throw new AppError("Wallet not found", 404);
      walletId = wallet.id;
    }

    let categoryId: bigint | undefined;
    if (input.categoryPublicId) {
      const category = await categoryRepository.findByPublicIdAndUserId(input.categoryPublicId, userId);
      if (!category) throw new AppError("Category not found", 404);
      categoryId = category.id;
    }

    return budgetRepository.create({
      userId,
      walletId,
      categoryId,
      name: input.name,
      amount: new Prisma.Decimal(input.amount),
      period: input.period,
      startDate: input.startDate ?? new Date(),
      endDate: input.endDate,
    });
  },

  async update(
    userId: bigint,
    publicId: string,
    input: Partial<{
      name: string;
      amount: number;
      period: "WEEKLY" | "MONTHLY" | "YEARLY";
      walletPublicId: string | null;
      categoryPublicId: string | null;
      startDate: Date;
      endDate: Date | null;
    }>
  ): Promise<Budget> {
    await this.getByPublicId(userId, publicId);

    let walletId: bigint | null | undefined = undefined;
    if (input.walletPublicId !== undefined) {
      if (input.walletPublicId === null) walletId = null;
      else {
        const wallet = await walletRepository.findByPublicIdAndUserId(input.walletPublicId, userId);
        if (!wallet) throw new AppError("Wallet not found", 404);
        walletId = wallet.id;
      }
    }

    let categoryId: bigint | null | undefined = undefined;
    if (input.categoryPublicId !== undefined) {
      if (input.categoryPublicId === null) categoryId = null;
      else {
        const category = await categoryRepository.findByPublicIdAndUserId(input.categoryPublicId, userId);
        if (!category) throw new AppError("Category not found", 404);
        categoryId = category.id;
      }
    }

    const updated = await budgetRepository.update(publicId, userId, {
      walletId,
      categoryId,
      name: input.name,
      amount: input.amount ? new Prisma.Decimal(input.amount) : undefined,
      period: input.period,
      startDate: input.startDate,
      endDate: input.endDate,
    });
    if (!updated) throw new AppError(ErrorMessages.NOT_FOUND, 404);
    return updated;
  },

  async delete(userId: bigint, publicId: string): Promise<void> {
    await this.getByPublicId(userId, publicId);
    await budgetRepository.delete(publicId, userId);
  },
};