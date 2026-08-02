import { SavingsGoal, Prisma } from "@prisma/client";
import { savingsGoalRepository } from "../repositories/savings-goal.repository.js";
import { AppError } from "../utils/errors.js";
import { ErrorMessages } from "../constants/messages.js";

export const savingsGoalService = {
  async list(userId: bigint, page: number, limit: number) {
    const { data, total } = await savingsGoalRepository.findByUserId(userId, { page, limit });
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  },

  async getByPublicId(userId: bigint, publicId: string): Promise<SavingsGoal> {
    const goal = await savingsGoalRepository.findByPublicIdAndUserId(publicId, userId);
    if (!goal) throw new AppError(ErrorMessages.NOT_FOUND, 404);
    return goal;
  },

  async create(
    userId: bigint,
    input: { name: string; targetAmount: number; targetDate?: Date }
  ): Promise<SavingsGoal> {
    return savingsGoalRepository.create({
      userId,
      name: input.name,
      targetAmount: new Prisma.Decimal(input.targetAmount),
      targetDate: input.targetDate,
    });
  },

  async update(
    userId: bigint,
    publicId: string,
    input: Partial<{ name: string; targetAmount: number; currentAmount: number; targetDate: Date | null; isAchieved: boolean }>
  ): Promise<SavingsGoal> {
    await this.getByPublicId(userId, publicId);
    const updated = await savingsGoalRepository.update(publicId, userId, {
      name: input.name,
      targetAmount: input.targetAmount !== undefined ? new Prisma.Decimal(input.targetAmount) : undefined,
      currentAmount: input.currentAmount !== undefined ? new Prisma.Decimal(input.currentAmount) : undefined,
      targetDate: input.targetDate,
      isAchieved: input.isAchieved,
    });
    if (!updated) throw new AppError(ErrorMessages.NOT_FOUND, 404);
    return updated;
  },

  async addProgress(userId: bigint, publicId: string, amount: number): Promise<SavingsGoal> {
    const goal = await this.getByPublicId(userId, publicId);
    const newCurrent = new Prisma.Decimal(Number(goal.currentAmount) + amount);
    const isAchieved = newCurrent.gte(goal.targetAmount);
    return this.update(userId, publicId, { currentAmount: Number(newCurrent), isAchieved });
  },

  async delete(userId: bigint, publicId: string): Promise<void> {
    await this.getByPublicId(userId, publicId);
    await savingsGoalRepository.delete(publicId, userId);
  },
};