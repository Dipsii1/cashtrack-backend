import { Request, Response, NextFunction } from "express";
import { savingsGoalService } from "../services/savings-goal.service.js";
import { ok, created } from "../utils/response.js";
import { AuthRequest } from "../types/common.js";
import { ApiSuccess } from "../constants/messages.js";

export const savingsGoalController = {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = BigInt((req as AuthRequest).user!.sub);
      const { page, limit } = req.query as unknown as { page: number; limit: number };
      const result = await savingsGoalService.list(userId, page, limit);
      ok(res, "Success", result);
    } catch (e) {
      next(e);
    }
  },

  async get(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = BigInt((req as AuthRequest).user!.sub);
      const goal = await savingsGoalService.getByPublicId(userId, req.params.publicId);
      ok(res, "Success", goal);
    } catch (e) {
      next(e);
    }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = BigInt((req as AuthRequest).user!.sub);
      const goal = await savingsGoalService.create(userId, req.body);
      created(res, "Savings goal created", goal);
    } catch (e) {
      next(e);
    }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = BigInt((req as AuthRequest).user!.sub);
      const goal = await savingsGoalService.update(userId, req.params.publicId, req.body);
      ok(res, ApiSuccess.UPDATED, goal);
    } catch (e) {
      next(e);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = BigInt((req as AuthRequest).user!.sub);
      await savingsGoalService.delete(userId, req.params.publicId);
      ok(res, ApiSuccess.DELETED, null);
    } catch (e) {
      next(e);
    }
  },
};