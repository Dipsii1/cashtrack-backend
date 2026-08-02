import { Wallet, Prisma } from "@prisma/client";
import { prisma } from "../prisma/client.js";

type WalletWithUser = Wallet & { userId: bigint };

export const walletRepository = {
  findByUserId: async (
    userId: bigint,
    { page, limit }: { page: number; limit: number }
  ): Promise<{ data: Wallet[]; total: number }> => {
    const [data, total] = await Promise.all([
      prisma.wallet.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.wallet.count({ where: { userId } }),
    ]);
    return { data, total };
  },

  findByPublicIdAndUserId: (publicId: string, userId: bigint): Promise<Wallet | null> =>
    prisma.wallet.findFirst({
      where: { publicId, userId },
    }),

  create: (data: {
    userId: bigint;
    name: string;
    balance: Prisma.Decimal;
    currency: string;
    isDefault: boolean;
  }): Promise<Wallet> =>
    prisma.$transaction(async (tx) => {
      if (data.isDefault) {
        await tx.wallet.updateMany({
          where: { userId: data.userId, isDefault: true },
          data: { isDefault: false },
        });
      }
      return tx.wallet.create({ data });
    }),

  update: (
    publicId: string,
    userId: bigint,
    data: Partial<Pick<Wallet, "name" | "currency" | "isDefault">>
  ): Promise<Wallet | null> =>
    prisma.$transaction(async (tx) => {
      if (data.isDefault) {
        await tx.wallet.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        });
      }
      return tx.wallet.update({
        where: { publicId },
        data,
      });
    }),

  delete: async (publicId: string, userId: bigint): Promise<void> => {
    await prisma.wallet.delete({
      where: { publicId },
    });
  },

  updateBalance: (id: bigint, amount: Prisma.Decimal, type: "INCOME" | "EXPENSE" | "TRANSFER"): Promise<Wallet> => {
    const delta = type === "EXPENSE" ? amount.mul(-1) : amount;
    return prisma.wallet.update({
      where: { id },
      data: { balance: { increment: delta } },
    });
  },
};