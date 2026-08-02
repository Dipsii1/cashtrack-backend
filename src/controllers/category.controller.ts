import { Request, Response, NextFunction } from "express";
import { categoryService } from "../services/category.service.js";
import { ok, created } from "../utils/response.js";
import { AuthRequest } from "../types/common.js";
import { ApiSuccess } from "../constants/messages.js";

export const categoryController = {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = BigInt((req as AuthRequest).user!.sub);
      const { type, page, limit } = req.query as unknown as {
        type?: "INCOME" | "EXPENSE";
        page: number;
        limit: number;
      };
      const result = await categoryService.list(userId, page, limit, type);
      ok(res, "Success", result);
    } catch (e) {
      next(e);
    }
  },

  async get(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = BigInt((req as AuthRequest).user!.sub);
      const category = await categoryService.getByPublicId(userId, req.params.publicId);
      ok(res, "Success", category);
    } catch (e) {
      next(e);
    }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = BigInt((req as AuthRequest).user!.sub);
      const category = await categoryService.create(userId, req.body);
      created(res, "Category created", category);
    } catch (e) {
      next(e);
    }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = BigInt((req as AuthRequest).user!.sub);
      const category = await categoryService.update(userId, req.params.publicId, req.body);
      ok(res, ApiSuccess.UPDATED, category);
    } catch (e) {
      next(e);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = BigInt((req as AuthRequest).user!.sub);
      await categoryService.delete(userId, req.params.publicId);
      ok(res, ApiSuccess.DELETED, null);
    } catch (e) {
      next(e);
    }
  },
};