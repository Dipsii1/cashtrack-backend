import { Request, Response, NextFunction } from "express";
import { recurringTransactionService } from "../services/recurring-transaction.service.js";
import { ok, created } from "../utils/response.js";
import { AuthRequest } from "../types/common.js";
import { ApiSuccess } from "../constants/messages.js";

export const recurringTransactionController = {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = BigInt((req as AuthRequest).user!.sub);
      const { page, limit, isActive } = req.query as unknown as {
        page: number;
        limit: number;
        isActive?: boolean;
      };
      const result = await recurringTransactionService.list(userId, page, limit, isActive);
      ok(res, "Success", result);
    } catch (e) {
      next(e);
    }
  },

  async get(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = BigInt((req as AuthRequest).user!.sub);
      const rt = await recurringTransactionService.getByPublicId(userId, req.params.publicId);
      ok(res, "Success", rt);
    } catch (e) {
      next(e);
    }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = BigInt((req as AuthRequest).user!.sub);
      const rt = await recurringTransactionService.create(userId, req.body);
      created(res, "Recurring transaction created", rt);
    } catch (e) {
      next(e);
    }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = BigInt((req as AuthRequest).user!.sub);
      const rt = await recurringTransactionService.update(userId, req.params.publicId, req.body);
      ok(res, ApiSuccess.UPDATED, rt);
    } catch (e) {
      next(e);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = BigInt((req as AuthRequest).user!.sub);
      await recurringTransactionService.delete(userId, req.params.publicId);
      ok(res, ApiSuccess.DELETED, null);
    } catch (e) {
      next(e);
    }
  },
};