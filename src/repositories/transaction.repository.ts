import { Transaction, Prisma } from "@prisma/client";
import { prisma } from "../prisma/client.js";

type TransactionWhereInput = Prisma.TransactionWhereInput;

export const transactionRepository = {
  findByUserId: async (
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
  ): Promise<{ data: Transaction[]; total: number }> => {
    const where: TransactionWhereInput = { userId };

    if (filters.startDate || filters.endDate) {
      where.transactionDate = {};
      if (filters.startDate) where.transactionDate.gte = filters.startDate;
      if (filters.endDate) where.transactionDate.lte = filters.endDate;
    }

    if (filters.walletPublicId) {
      where.wallet = { publicId: filters.walletPublicId };
    }
    if (filters.categoryPublicId) {
      where.category = { publicId: filters.categoryPublicId };
    }
    if (filters.type) {
      where.type = filters.type;
    }
    if (filters.search) {
      where.title = { contains: filters.search, mode: "insensitive" };
    }

    const [data, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { transactionDate: "desc" },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
        include: {
          wallet: { select: { publicId: true, name: true, currency: true } },
          category: { select: { publicId: true, name: true, icon: true, color: true, type: true } },
        },
      }),
      prisma.transaction.count({ where }),
    ]);

    return { data, total };
  },

  findByPublicIdAndUserId: async (publicId: string, userId: bigint): Promise<Transaction | null> =>
    prisma.transaction.findFirst({
      where: { publicId, userId },
      include: {
        wallet: { select: { publicId: true, name: true, currency: true } },
        category: { select: { publicId: true, name: true, icon: true, color: true, type: true } },
        attachments: true,
      },
    }),

  create: (data: {
    userId: bigint;
    walletId: bigint;
    categoryId?: bigint;
    type: "INCOME" | "EXPENSE" | "TRANSFER";
    title: string;
    amount: Prisma.Decimal;
    note?: string;
    transactionDate?: Date;
  }): Promise<Transaction> =>
    prisma.transaction.create({ data }),

  update: (
    publicId: string,
    userId: bigint,
    data: Partial<Pick<Transaction, "categoryId" | "type" | "title" | "amount" | "note" | "transactionDate">>
  ): Promise<Transaction | null> =>
    prisma.transaction.update({
      where: { publicId },
      data,
      include: {
        wallet: { select: { publicId: true, name: true, currency: true } },
        category: { select: { publicId: true, name: true, icon: true, color: true, type: true } },
      },
    }),

  delete: (publicId: string, userId: bigint): Promise<{ walletId: bigint; amount: Prisma.Decimal; type: string }> =>
    prisma.$transaction(async (tx) =>
      tx.transaction.delete({
        where: { publicId },
        select: { walletId: true, amount: true, type: true },
      })
    ),

  updateWalletBalance: async (walletId: bigint, amount: Prisma.Decimal, type: string): Promise<void> => {
    const delta = type === "EXPENSE" ? amount.mul(-1) : amount;
    await prisma.wallet.update({
      where: { id: walletId },
      data: { balance: { increment: delta } },
    });
  },

  reverseWalletBalance: async (walletId: bigint, amount: Prisma.Decimal, type: string): Promise<void> => {
    const delta = type === "EXPENSE" ? amount : amount.mul(-1);
    await prisma.wallet.update({
      where: { id: walletId },
      data: { balance: { increment: delta } },
    });
  },
};