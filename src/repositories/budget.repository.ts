import { Budget, Prisma } from "@prisma/client";
import { prisma } from "../prisma/client.js";

export const budgetRepository = {
  findByUserId: async (
    userId: bigint,
    { page, limit }: { page: number; limit: number }
  ): Promise<{ data: Budget[]; total: number }> => {
    const [data, total] = await Promise.all([
      prisma.budget.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          wallet: { select: { publicId: true, name: true } },
          category: { select: { publicId: true, name: true, icon: true, color: true } },
        },
      }),
      prisma.budget.count({ where: { userId } }),
    ]);
    return { data, total };
  },

  findByPublicIdAndUserId: async (publicId: string, userId: bigint): Promise<Budget | null> =>
    prisma.budget.findFirst({
      where: { publicId, userId },
      include: {
        wallet: { select: { publicId: true, name: true } },
        category: { select: { publicId: true, name: true, icon: true, color: true } },
      },
    }),

  create: (data: {
    userId: bigint;
    walletId?: bigint;
    categoryId?: bigint;
    name: string;
    amount: Prisma.Decimal;
    period: "WEEKLY" | "MONTHLY" | "YEARLY";
    startDate?: Date;
    endDate?: Date;
  }): Promise<Budget> =>
    prisma.budget.create({ data }),

  update: (
    publicId: string,
    userId: bigint,
    data: Partial<Pick<Budget, "walletId" | "categoryId" | "name" | "amount" | "period" | "startDate" | "endDate">>
  ): Promise<Budget | null> =>
    prisma.budget.update({
      where: { publicId },
      data,
      include: {
        wallet: { select: { publicId: true, name: true } },
        category: { select: { publicId: true, name: true, icon: true, color: true } },
      },
    }),

  delete: async (publicId: string, userId: bigint): Promise<boolean> => {
    const result = await prisma.budget.deleteMany({
      where: { publicId, userId },
    });
    return result.count > 0;
  },
};