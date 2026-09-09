import { Request, Response, NextFunction } from "express";
import { dashboardService } from "../services/dashboard.service.js";
import { ok } from "../utils/response.js";
import { AuthRequest } from "../types/common.js";
import { ApiSuccess } from "../constants/messages.js";

export const dashboardController = {
  async index(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = BigInt((req as AuthRequest).user!.sub);
      const data = await dashboardService.getDashboard(userId);
      ok(res, ApiSuccess.UPDATED, data);
    } catch (e) {
      next(e);
    }
  },
};
