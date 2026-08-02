import { Category } from "@prisma/client";
import { categoryRepository } from "../repositories/category.repository.js";
import { AppError } from "../utils/errors.js";
import { ErrorMessages } from "../constants/messages.js";

export const categoryService = {
  async list(
    userId: bigint,
    page: number,
    limit: number,
    type?: "INCOME" | "EXPENSE"
  ) {
    const { data, total } = await categoryRepository.findByUserId(userId, { page, limit, type });
    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  },

  async getByPublicId(userId: bigint, publicId: string): Promise<Category> {
    const category = await categoryRepository.findByPublicIdAndUserId(publicId, userId);
    if (!category) throw new AppError(ErrorMessages.NOT_FOUND, 404);
    return category;
  },

  async create(
    userId: bigint,
    input: { name: string; icon?: string; color?: string; type?: "INCOME" | "EXPENSE" }
  ): Promise<Category> {
    return categoryRepository.create({
      userId,
      name: input.name,
      icon: input.icon,
      color: input.color,
      type: input.type ?? "EXPENSE",
    });
  },

  async update(
    userId: bigint,
    publicId: string,
    input: Partial<Pick<Category, "name" | "icon" | "color" | "type">>
  ): Promise<Category> {
    await this.getByPublicId(userId, publicId);
    const updated = await categoryRepository.update(publicId, userId, input);
    if (!updated) throw new AppError(ErrorMessages.NOT_FOUND, 404);
    return updated;
  },

  async delete(userId: bigint, publicId: string): Promise<void> {
    await this.getByPublicId(userId, publicId);
    await categoryRepository.delete(publicId, userId);
  },
};