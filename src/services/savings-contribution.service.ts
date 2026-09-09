import { SavingsContribution, Prisma } from "@prisma/client";
import { prisma } from "../prisma/client.js";
import { savingsContributionRepository } from "../repositories/savings-contribution.repository.js";
import { savingsGoalRepository } from "../repositories/savings-goal.repository.js";
import { walletRepository } from "../repositories/wallet.repository.js";
import { AppError } from "../utils/errors.js";
import { ErrorMessages } from "../constants/messages.js";

type ContributionWithRelations = Prisma.SavingsContributionGetPayload<{
  include: {
    savingsGoal: { select: { publicId: true; name: true } };
    wallet: { select: { publicId: true; name: true; currency: true } };
  };
}>;

export const savingsContributionService = {
  async list(
    userId: bigint,
    page: number,
    limit: number,
    savingsGoalPublicId?: string
  ) {
    const { data, total } = await savingsContributionRepository.findByUserId(userId, {
      page,
      limit,
      savingsGoalPublicId,
    });
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  },

  async getByPublicId(userId: bigint, publicId: string): Promise<SavingsContribution> {
    const contribution = await savingsContributionRepository.findByPublicIdAndUserId(publicId, userId);
    if (!contribution) throw new AppError(ErrorMessages.NOT_FOUND, 404);
    return contribution;
  },

  async create(
    userId: bigint,
    input: {
      savingsGoalPublicId: string;
      walletPublicId?: string;
      amount: number;
      note?: string;
      contributionDate?: Date;
    }
  ): Promise<SavingsContribution> {
    const goal = await savingsGoalRepository.findByPublicIdAndUserId(input.savingsGoalPublicId, userId);
    if (!goal) throw new AppError("Savings goal not found", 404);

    const amount = new Prisma.Decimal(input.amount);
    let walletId: bigint | undefined;

    return prisma.$transaction(async (tx) => {
      if (input.walletPublicId) {
        const wallet = await tx.wallet.findFirst({
          where: { publicId: input.walletPublicId, userId },
        });
        if (!wallet) throw new AppError("Wallet not found", 404);
        if (wallet.balance.lt(amount)) {
          throw new AppError("Insufficient balance in wallet", 400);
        }

        await tx.wallet.update({
          where: { id: wallet.id },
          data: { balance: { decrement: amount } },
        });
        walletId = wallet.id;
      }

      const newCurrent = goal.currentAmount.add(amount);
      const isAchieved = newCurrent.gte(goal.targetAmount);

      await tx.savingsGoal.update({
        where: { id: goal.id },
        data: {
          currentAmount: newCurrent,
          isAchieved,
        },
      });

      const created = await tx.savingsContribution.create({
        data: {
          userId,
          savingsGoalId: goal.id,
          walletId,
          amount,
          note: input.note,
          contributionDate: input.contributionDate ?? new Date(),
        },
        include: {
          savingsGoal: { select: { publicId: true, name: true } },
          wallet: { select: { publicId: true, name: true, currency: true } },
        },
      });

      return created;
    });
  },

  async delete(userId: bigint, publicId: string): Promise<void> {
    const contribution = await this.getByPublicId(userId, publicId);

    await prisma.$transaction(async (tx) => {
      const goal = await tx.savingsGoal.findFirst({ where: { id: contribution.savingsGoalId, userId } });
      if (goal) {
        const newCurrent = goal.currentAmount.sub(contribution.amount);
        const isAchieved = newCurrent.gte(goal.targetAmount);
        await tx.savingsGoal.update({
          where: { id: goal.id },
          data: {
            currentAmount: newCurrent.lt(0) ? new Prisma.Decimal(0) : newCurrent,
            isAchieved,
          },
        });
      }

      if (contribution.walletId) {
        await tx.wallet.update({
          where: { id: contribution.walletId },
          data: { balance: { increment: contribution.amount } },
        });
      }

      await tx.savingsContribution.delete({ where: { id: contribution.id } });
    });
  },
};
