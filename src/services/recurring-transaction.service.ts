import { RecurringTransaction, Prisma } from "@prisma/client";
import { recurringTransactionRepository } from "../repositories/recurring-transaction.repository.js";
import { walletRepository } from "../repositories/wallet.repository.js";
import { categoryRepository } from "../repositories/category.repository.js";
import { transactionService } from "./transaction.service.js";
import { AppError } from "../utils/errors.js";
import { ErrorMessages } from "../constants/messages.js";

type RecurringWithRelations = Prisma.RecurringTransactionGetPayload<{
  include: {
    wallet: { select: { publicId: true; name: true } };
    category: { select: { publicId: true; name: true; icon: true; color: true } };
  };
}>;

type DueRecurring = Prisma.RecurringTransactionGetPayload<{
  include: {
    wallet: true;
    category: true;
  };
}>;

function calcNextRun(frequency: string, interval: number, from: Date): Date {
  const d = new Date(from);
  switch (frequency) {
    case "DAILY":
      d.setDate(d.getDate() + interval);
      break;
    case "WEEKLY":
      d.setDate(d.getDate() + 7 * interval);
      break;
    case "MONTHLY":
      d.setMonth(d.getMonth() + interval);
      break;
    case "YEARLY":
      d.setFullYear(d.getFullYear() + interval);
      break;
  }
  return d;
}

export const recurringTransactionService = {
  async list(userId: bigint, page: number, limit: number, isActive?: boolean) {
    const { data, total } = await recurringTransactionRepository.findByUserId(userId, { page, limit, isActive });
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  },

  async getByPublicId(userId: bigint, publicId: string): Promise<RecurringWithRelations> {
    const rt = await recurringTransactionRepository.findByPublicIdAndUserId(publicId, userId);
    if (!rt) throw new AppError(ErrorMessages.NOT_FOUND, 404);
    return rt as RecurringWithRelations;
  },

  async create(
    userId: bigint,
    input: {
      walletPublicId: string;
      categoryPublicId?: string;
      title: string;
      amount: number;
      type: "INCOME" | "EXPENSE";
      frequency: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
      interval?: number;
      nextRunDate?: Date;
    }
  ): Promise<RecurringTransaction> {
    const wallet = await walletRepository.findByPublicIdAndUserId(input.walletPublicId, userId);
    if (!wallet) throw new AppError("Wallet not found", 404);

    let categoryId: bigint | undefined;
    if (input.categoryPublicId) {
      const category = await categoryRepository.findByPublicIdAndUserId(input.categoryPublicId, userId);
      if (!category) throw new AppError("Category not found", 404);
      categoryId = category.id;
    }

    const nextRun = input.nextRunDate ?? new Date();

    return recurringTransactionRepository.create({
      userId,
      walletId: wallet.id,
      categoryId,
      title: input.title,
      amount: new Prisma.Decimal(input.amount),
      type: input.type,
      frequency: input.frequency,
      interval: input.interval ?? 1,
      nextRunDate: nextRun,
    });
  },

  async update(
    userId: bigint,
    publicId: string,
    input: Partial<{
      categoryPublicId: string | null;
      title: string;
      amount: number;
      type: "INCOME" | "EXPENSE";
      frequency: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
      interval: number;
      nextRunDate: Date;
      isActive: boolean;
    }>
  ): Promise<RecurringWithRelations> {
    await this.getByPublicId(userId, publicId);

    let categoryId: bigint | null | undefined = undefined;
    if (input.categoryPublicId !== undefined) {
      if (input.categoryPublicId === null) categoryId = null;
      else {
        const category = await categoryRepository.findByPublicIdAndUserId(input.categoryPublicId, userId);
        if (!category) throw new AppError("Category not found", 404);
        categoryId = category.id;
      }
    }

    const updated = await recurringTransactionRepository.update(publicId, userId, {
      categoryId: categoryId as bigint | undefined,
      title: input.title,
      amount: input.amount ? new Prisma.Decimal(input.amount) : undefined,
      type: input.type,
      frequency: input.frequency,
      interval: input.interval,
      nextRunDate: input.nextRunDate,
      isActive: input.isActive,
    });
    if (!updated) throw new AppError(ErrorMessages.NOT_FOUND, 404);
    return updated as RecurringWithRelations;
  },

  async processDue(): Promise<number> {
    const now = new Date();
    const due: DueRecurring[] = await recurringTransactionRepository.findDue(now);
    let count = 0;

    for (const rt of due) {
      try {
        await transactionService.create(rt.userId, {
          walletPublicId: rt.wallet.publicId,
          categoryPublicId: rt.category?.publicId,
          type: rt.type,
          title: `[Recurring] ${rt.title}`,
          amount: Number(rt.amount),
          transactionDate: now,
        });

        const nextRun = calcNextRun(rt.frequency, rt.interval, rt.nextRunDate);
        await recurringTransactionRepository.updateNextRunDate(rt.publicId, nextRun);
        count++;
      } catch {
        // log error but continue
      }
    }
    return count;
  },

  async delete(userId: bigint, publicId: string): Promise<void> {
    await this.getByPublicId(userId, publicId);
    await recurringTransactionRepository.delete(publicId, userId);
  },
};