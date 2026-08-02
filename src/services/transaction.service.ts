import { Prisma } from "@prisma/client";
import { prisma } from "../prisma/client.js";
import { transactionRepository } from "../repositories/transaction.repository.js";
import { walletRepository } from "../repositories/wallet.repository.js";
import { categoryRepository } from "../repositories/category.repository.js";
import { AppError } from "../utils/errors.js";
import { ErrorMessages } from "../constants/messages.js";

type TxWithRelations = Prisma.TransactionGetPayload<{
  include: {
    wallet: { select: { publicId: true; name: true; currency: true } };
    category: { select: { publicId: true; name: true; icon: true; color: true; type: true } };
  };
}>;

function walletDelta(type: string, amount: Prisma.Decimal): Prisma.Decimal {
  return type === "EXPENSE" ? amount.mul(-1) : amount;
}

export const transactionService = {
  async list(
    userId: bigint,
    filters: {
      startDate?: Date;
      endDate?: Date;
      walletPublicId?: string;
      categoryPublicId?: string;
      type?: "INCOME" | "EXPENSE" | "TRANSFER";
      search?: string;
      page: number;
      limit: number;
    }
  ) {
    const { data, total } = await transactionRepository.findByUserId(userId, filters);
    return {
      data,
      meta: { total, page: filters.page, limit: filters.limit, totalPages: Math.ceil(total / filters.limit) },
    };
  },

  async getByPublicId(userId: bigint, publicId: string): Promise<TxWithRelations> {
    const tx = await transactionRepository.findByPublicIdAndUserId(publicId, userId);
    if (!tx) throw new AppError(ErrorMessages.NOT_FOUND, 404);
    return tx as TxWithRelations;
  },

  async create(
    userId: bigint,
    input: {
      walletPublicId: string;
      categoryPublicId?: string;
      type: "INCOME" | "EXPENSE" | "TRANSFER";
      title: string;
      amount: number;
      note?: string;
      transactionDate?: Date;
    }
  ): Promise<TxWithRelations> {
    const wallet = await walletRepository.findByPublicIdAndUserId(input.walletPublicId, userId);
    if (!wallet) throw new AppError("Wallet not found", 404);

    let categoryId: bigint | undefined;
    if (input.categoryPublicId) {
      const category = await categoryRepository.findByPublicIdAndUserId(input.categoryPublicId, userId);
      if (!category) throw new AppError("Category not found", 404);
      categoryId = category.id;
    }

    const amount = new Prisma.Decimal(input.amount);

    return prisma.$transaction(async (tx) => {
      const created = await tx.transaction.create({
        data: {
          userId,
          walletId: wallet.id,
          categoryId,
          type: input.type,
          title: input.title,
          amount,
          note: input.note,
          transactionDate: input.transactionDate ?? new Date(),
        },
        include: {
          wallet: { select: { publicId: true, name: true, currency: true } },
          category: { select: { publicId: true, name: true, icon: true, color: true, type: true } },
        },
      });

      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: walletDelta(input.type, amount) } },
      });

      return created;
    });
  },

  async update(
    userId: bigint,
    publicId: string,
    input: {
      categoryPublicId?: string | null;
      type?: "INCOME" | "EXPENSE" | "TRANSFER";
      title?: string;
      amount?: number;
      note?: string | null;
      transactionDate?: Date;
    }
  ): Promise<TxWithRelations> {
    const existing = await this.getByPublicId(userId, publicId);

    let categoryId: bigint | null | undefined = undefined;
    if (input.categoryPublicId !== undefined) {
      if (input.categoryPublicId === null) {
        categoryId = null;
      } else {
        const category = await categoryRepository.findByPublicIdAndUserId(input.categoryPublicId, userId);
        if (!category) throw new AppError("Category not found", 404);
        categoryId = category.id;
      }
    }

    return prisma.$transaction(async (tx) => {
      const amountChanged = input.amount !== undefined && input.amount !== Number(existing.amount);
      const typeChanged = input.type !== undefined && input.type !== existing.type;

      if (amountChanged || typeChanged) {
        // Reverse old balance impact, then apply new impact
        await tx.wallet.update({
          where: { id: existing.walletId },
          data: { balance: { increment: walletDelta(existing.type, existing.amount).mul(-1) } },
        });
        const newAmount = new Prisma.Decimal(input.amount ?? Number(existing.amount));
        const newType = input.type ?? existing.type;
        await tx.wallet.update({
          where: { id: existing.walletId },
          data: { balance: { increment: walletDelta(newType, newAmount) } },
        });
      }

      const updated = await tx.transaction.update({
        where: { publicId },
        data: {
          categoryId: categoryId as bigint | undefined,
          type: input.type,
          title: input.title,
          amount: input.amount !== undefined ? new Prisma.Decimal(input.amount) : undefined,
          note: input.note === "" ? null : input.note,
          transactionDate: input.transactionDate,
        },
        include: {
          wallet: { select: { publicId: true, name: true, currency: true } },
          category: { select: { publicId: true, name: true, icon: true, color: true, type: true } },
        },
      });

      return updated;
    });
  },

  async delete(userId: bigint, publicId: string): Promise<void> {
    const existing = await this.getByPublicId(userId, publicId);

    await prisma.$transaction(async (tx) => {
      await tx.transaction.delete({ where: { publicId } });
      // Restore wallet balance (opposite of the original impact)
      await tx.wallet.update({
        where: { id: existing.walletId },
        data: { balance: { increment: walletDelta(existing.type, existing.amount).mul(-1) } },
      });
    });
  },
};