import { Request, Response, NextFunction } from "express";
import { savingsContributionService } from "../services/savings-contribution.service.js";
import { ok, created } from "../utils/response.js";
import { AuthRequest } from "../types/common.js";
import { ApiSuccess } from "../constants/messages.js";

export const savingsContributionController = {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = BigInt((req as AuthRequest).user!.sub);
      const { page, limit, savingsGoalPublicId } = req.query as unknown as {
        page: number;
        limit: number;
        savingsGoalPublicId?: string;
      };
      const result = await savingsContributionService.list(userId, page, limit, savingsGoalPublicId);
      ok(res, "Success", result);
    } catch (e) {
      next(e);
    }
  },

  async get(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = BigInt((req as AuthRequest).user!.sub);
      const contribution = await savingsContributionService.getByPublicId(userId, req.params.publicId);
      ok(res, "Success", contribution);
    } catch (e) {
      next(e);
    }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = BigInt((req as AuthRequest).user!.sub);
      const contribution = await savingsContributionService.create(userId, req.body);
      created(res, "Savings contribution created", contribution);
    } catch (e) {
      next(e);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = BigInt((req as AuthRequest).user!.sub);
      await savingsContributionService.delete(userId, req.params.publicId);
      ok(res, ApiSuccess.DELETED, null);
    } catch (e) {
      next(e);
    }
  },
};
