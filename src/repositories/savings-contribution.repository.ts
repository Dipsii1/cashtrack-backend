import { SavingsContribution, Prisma } from "@prisma/client";
import { prisma } from "../prisma/client.js";

export const savingsContributionRepository = {
  findByUserId: async (
    userId: bigint,
    { savingsGoalPublicId, page, limit }: { savingsGoalPublicId?: string; page: number; limit: number }
  ): Promise<{ data: SavingsContribution[]; total: number }> => {
    const where: Prisma.SavingsContributionWhereInput = { userId };
    if (savingsGoalPublicId) {
      where.savingsGoal = { publicId: savingsGoalPublicId };
    }

    const [data, total] = await Promise.all([
      prisma.savingsContribution.findMany({
        where,
        orderBy: { contributionDate: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          savingsGoal: { select: { publicId: true, name: true } },
          wallet: { select: { publicId: true, name: true, currency: true } },
        },
      }),
      prisma.savingsContribution.count({ where }),
    ]);
    return { data, total };
  },

  findByPublicIdAndUserId: (publicId: string, userId: bigint): Promise<SavingsContribution | null> =>
    prisma.savingsContribution.findFirst({
      where: { publicId, userId },
      include: {
        savingsGoal: { select: { publicId: true, name: true } },
        wallet: { select: { publicId: true, name: true, currency: true } },
      },
    }),

  create: (data: {
    userId: bigint;
    savingsGoalId: bigint;
    walletId?: bigint;
    amount: Prisma.Decimal;
    note?: string;
    contributionDate?: Date;
  }): Promise<SavingsContribution> =>
    prisma.savingsContribution.create({ data }),

  delete: async (publicId: string, userId: bigint): Promise<boolean> => {
    const result = await prisma.savingsContribution.deleteMany({
      where: { publicId, userId },
    });
    return result.count > 0;
  },
};
