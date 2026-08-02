import { SavingsGoal, Prisma } from "@prisma/client";
import { prisma } from "../prisma/client.js";

export const savingsGoalRepository = {
  findByUserId: async (
    userId: bigint,
    { page, limit }: { page: number; limit: number }
  ): Promise<{ data: SavingsGoal[]; total: number }> => {
    const [data, total] = await Promise.all([
      prisma.savingsGoal.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.savingsGoal.count({ where: { userId } }),
    ]);
    return { data, total };
  },

  findByPublicIdAndUserId: (publicId: string, userId: bigint): Promise<SavingsGoal | null> =>
    prisma.savingsGoal.findFirst({
      where: { publicId, userId },
    }),

  create: (data: {
    userId: bigint;
    name: string;
    targetAmount: Prisma.Decimal;
    targetDate?: Date;
  }): Promise<SavingsGoal> =>
    prisma.savingsGoal.create({ data }),

  update: (
    publicId: string,
    userId: bigint,
    data: Partial<Pick<SavingsGoal, "name" | "targetAmount" | "currentAmount" | "targetDate" | "isAchieved">>
  ): Promise<SavingsGoal | null> =>
    prisma.savingsGoal.update({
      where: { publicId },
      data,
    }),

  delete: async (publicId: string, userId: bigint): Promise<boolean> => {
    const result = await prisma.savingsGoal.deleteMany({
      where: { publicId, userId },
    });
    return result.count > 0;
  },
};