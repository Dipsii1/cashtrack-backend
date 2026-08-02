import { RecurringTransaction, Prisma } from "@prisma/client";
import { prisma } from "../prisma/client.js";

export const recurringTransactionRepository = {
  findByUserId: async (
    userId: bigint,
    { isActive, page, limit }: { isActive?: boolean; page: number; limit: number }
  ): Promise<{ data: RecurringTransaction[]; total: number }> => {
    const where: Prisma.RecurringTransactionWhereInput = { userId };
    if (isActive !== undefined) where.isActive = isActive;

    const [data, total] = await Promise.all([
      prisma.recurringTransaction.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          wallet: { select: { publicId: true, name: true } },
          category: { select: { publicId: true, name: true, icon: true, color: true } },
        },
      }),
      prisma.recurringTransaction.count({ where }),
    ]);
    return { data, total };
  },

  findByPublicIdAndUserId: async (publicId: string, userId: bigint): Promise<RecurringTransaction | null> =>
    prisma.recurringTransaction.findFirst({
      where: { publicId, userId },
      include: {
        wallet: { select: { publicId: true, name: true } },
        category: { select: { publicId: true, name: true, icon: true, color: true } },
      },
    }),

  findDue: (now: Date) =>
    prisma.recurringTransaction.findMany({
      where: { isActive: true, nextRunDate: { lte: now } },
      include: {
        wallet: true,
        category: true,
      },
    }),

  create: (data: {
    userId: bigint;
    walletId: bigint;
    categoryId?: bigint;
    title: string;
    amount: Prisma.Decimal;
    type: "INCOME" | "EXPENSE";
    frequency: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
    interval: number;
    nextRunDate: Date;
  }): Promise<RecurringTransaction> =>
    prisma.recurringTransaction.create({ data }),

  update: (
    publicId: string,
    userId: bigint,
    data: Partial<Pick<RecurringTransaction, "categoryId" | "title" | "amount" | "type" | "frequency" | "interval" | "nextRunDate" | "isActive">>
  ): Promise<RecurringTransaction | null> =>
    prisma.recurringTransaction.update({
      where: { publicId },
      data,
      include: {
        wallet: { select: { publicId: true, name: true } },
        category: { select: { publicId: true, name: true, icon: true, color: true } },
      },
    }),

  delete: async (publicId: string, userId: bigint): Promise<boolean> => {
    const result = await prisma.recurringTransaction.deleteMany({
      where: { publicId, userId },
    });
    return result.count > 0;
  },

  updateNextRunDate: (publicId: string, nextRunDate: Date): Promise<RecurringTransaction> =>
    prisma.recurringTransaction.update({
      where: { publicId },
      data: { nextRunDate },
    }),
};