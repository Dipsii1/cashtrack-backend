import { Category, Prisma } from "@prisma/client";
import { prisma } from "../prisma/client.js";

export const categoryRepository = {
  findByUserId: async (
    userId: bigint,
    { type, page, limit }: { type?: "INCOME" | "EXPENSE"; page: number; limit: number }
  ): Promise<{ data: Category[]; total: number }> => {
    const where: Prisma.CategoryWhereInput = { userId };
    if (type) where.type = type;

    const [data, total] = await Promise.all([
      prisma.category.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.category.count({ where }),
    ]);
    return { data, total };
  },

  findByPublicIdAndUserId: (publicId: string, userId: bigint): Promise<Category | null> =>
    prisma.category.findFirst({
      where: { publicId, userId },
    }),

  create: (data: {
    userId: bigint;
    name: string;
    icon?: string;
    color?: string;
    type: "INCOME" | "EXPENSE";
  }): Promise<Category> =>
    prisma.category.create({ data }),

  update: (
    publicId: string,
    userId: bigint,
    data: Partial<Pick<Category, "name" | "icon" | "color" | "type">>
  ): Promise<Category | null> =>
    prisma.category.update({
      where: { publicId },
      data,
    }),

  delete: async (publicId: string, userId: bigint): Promise<boolean> => {
    const result = await prisma.category.deleteMany({
      where: { publicId, userId },
    });
    return result.count > 0;
  },
};