import { Wallet, Transaction } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { prisma } from "../prisma/client.js";
import { walletRepository } from "../repositories/wallet.repository.js";
import { categoryRepository } from "../repositories/category.repository.js";
import { transactionRepository } from "../repositories/transaction.repository.js";
import { AppError } from "../utils/errors.js";
import { ErrorMessages } from "../constants/messages.js";

type TxWithRelations = Prisma.TransactionGetPayload<{
  include: {
    wallet: { select: { publicId: true; name: true; currency: true } };
    category: { select: { publicId: true; name: true; icon: true; color: true; type: true } };
    destinationWallet: { select: { publicId: true; name: true; currency: true } };
  };
}>;

function walletDelta(type: string, amount: Prisma.Decimal): Prisma.Decimal {
  return type === "EXPENSE" ? amount.mul(-1) : amount;
}

async function resolveWalletForTx(
  tx: Prisma.TransactionClient,
  walletPublicId: string,
  userId: bigint
): Promise<Wallet> {
  const wallet = await tx.wallet.findFirst({
    where: { publicId: walletPublicId, userId },
  });
  if (!wallet) throw new AppError("Wallet not found", 404);
  return wallet;
}

async function resolveCategoryForTx(
  tx: Prisma.TransactionClient,
  categoryPublicId: string,
  userId: bigint
): Promise<bigint> {
  const category = await tx.category.findFirst({
    where: { publicId: categoryPublicId, userId },
  });
  if (!category) throw new AppError("Category not found", 404);
  return category.id;
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
      destinationWalletPublicId?: string;
    }
  ): Promise<TxWithRelations> {
    const amount = new Prisma.Decimal(input.amount);

    if (input.type === "TRANSFER") {
      if (!input.destinationWalletPublicId) {
        throw new AppError("destinationWalletPublicId is required for TRANSFER", 400);
      }
      if (input.destinationWalletPublicId === input.walletPublicId) {
        throw new AppError("Source and destination wallets must be different", 400);
      }
      return this._createTransfer(userId, { ...input, type: "TRANSFER", destinationWalletPublicId: input.destinationWalletPublicId }, amount);
    }

    if (input.type === "INCOME") {
      if (input.categoryPublicId) {
        const category = await categoryRepository.findByPublicIdAndUserId(input.categoryPublicId, userId);
        if (!category) throw new AppError("Category not found", 404);
        if (category.type !== "INCOME") {
          throw new AppError("Category type must be INCOME for INCOME transactions", 400);
        }
      }
    }

    if (input.type === "EXPENSE") {
      if (input.categoryPublicId) {
        const category = await categoryRepository.findByPublicIdAndUserId(input.categoryPublicId, userId);
        if (!category) throw new AppError("Category not found", 404);
        if (category.type !== "EXPENSE") {
          throw new AppError("Category type must be EXPENSE for EXPENSE transactions", 400);
        }
      }
    }

    const wallet = await walletRepository.findByPublicIdAndUserId(input.walletPublicId, userId);
    if (!wallet) throw new AppError("Wallet not found", 404);

    let categoryId: bigint | undefined;
    if (input.categoryPublicId) {
      const category = await categoryRepository.findByPublicIdAndUserId(input.categoryPublicId, userId);
      if (!category) throw new AppError("Category not found", 404);
      categoryId = category.id;
    }

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
          destinationWallet: { select: { publicId: true, name: true, currency: true } },
        },
      });

      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: walletDelta(input.type, amount) } },
      });

      return created;
    });
  },

  async _createTransfer(
    userId: bigint,
    input: {
      walletPublicId: string;
      type: "TRANSFER";
      title: string;
      amount: number;
      note?: string;
      transactionDate?: Date;
      destinationWalletPublicId: string;
    },
    amount: Prisma.Decimal
  ): Promise<TxWithRelations> {
    return prisma.$transaction(async (tx) => {
      const [sourceWallet, destWallet] = await Promise.all([
        resolveWalletForTx(tx, input.walletPublicId, userId),
        resolveWalletForTx(tx, input.destinationWalletPublicId, userId),
      ]);

      if (sourceWallet.id === destWallet.id) {
        throw new AppError("Source and destination wallets must be different", 400);
      }

      const sourceBalance = sourceWallet.balance;
      if (sourceBalance.lt(amount)) {
        throw new AppError("Insufficient balance in source wallet", 400);
      }

      const created = await tx.transaction.create({
        data: {
          userId,
          walletId: sourceWallet.id,
          destinationWalletId: destWallet.id,
          type: input.type,
          title: input.title,
          amount,
          note: input.note,
          transactionDate: input.transactionDate ?? new Date(),
        },
        include: {
          wallet: { select: { publicId: true, name: true, currency: true } },
          category: { select: { publicId: true, name: true, icon: true, color: true, type: true } },
          destinationWallet: { select: { publicId: true, name: true, currency: true } },
        },
      });

      await tx.wallet.update({
        where: { id: sourceWallet.id },
        data: { balance: { decrement: amount } },
      });

      await tx.wallet.update({
        where: { id: destWallet.id },
        data: { balance: { increment: amount } },
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
      destinationWalletPublicId?: string | null;
    }
  ): Promise<TxWithRelations> {
    const existing = await this.getByPublicId(userId, publicId);

    if (existing.type === "TRANSFER" && input.type !== "TRANSFER") {
      throw new AppError("Cannot change type of a TRANSFER transaction", 400);
    }

    if (existing.type !== "TRANSFER" && input.type === "TRANSFER") {
      throw new AppError("Cannot change type of a non-TRANSFER transaction to TRANSFER", 400);
    }

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

    let destinationWalletId: bigint | null | undefined = undefined;
    if (input.destinationWalletPublicId !== undefined) {
      if (input.destinationWalletPublicId === null) {
        destinationWalletId = null;
      } else {
        const destWallet = await walletRepository.findByPublicIdAndUserId(input.destinationWalletPublicId, userId);
        if (!destWallet) throw new AppError("Destination wallet not found", 404);
        destinationWalletId = destWallet.id;
      }
    }

    return prisma.$transaction(async (tx) => {
      const amountChanged = input.amount !== undefined && input.amount !== Number(existing.amount);
      const typeChanged = input.type !== undefined && input.type !== existing.type;

      if (amountChanged || typeChanged) {
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
          categoryId: categoryId as bigint | null | undefined,
          type: input.type,
          title: input.title,
          amount: input.amount !== undefined ? new Prisma.Decimal(input.amount) : undefined,
          note: input.note === "" ? null : input.note,
          transactionDate: input.transactionDate,
          destinationWalletId: destinationWalletId as bigint | null | undefined,
        },
        include: {
          wallet: { select: { publicId: true, name: true, currency: true } },
          category: { select: { publicId: true, name: true, icon: true, color: true, type: true } },
          destinationWallet: { select: { publicId: true, name: true, currency: true } },
        },
      });

      return updated;
    });
  },

  async delete(userId: bigint, publicId: string): Promise<void> {
    const existing = await this.getByPublicId(userId, publicId);

    await prisma.$transaction(async (tx) => {
      await tx.transaction.delete({ where: { publicId } });
      await tx.wallet.update({
        where: { id: existing.walletId },
        data: { balance: { increment: walletDelta(existing.type, existing.amount).mul(-1) } },
      });

      if (existing.destinationWalletId) {
        await tx.wallet.update({
          where: { id: existing.destinationWalletId },
          data: { balance: { decrement: existing.amount } },
        });
      }
    });
  },
};
