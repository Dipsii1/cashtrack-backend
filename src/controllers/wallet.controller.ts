import { Request, Response, NextFunction } from "express";
import { walletService } from "../services/wallet.service.js";
import { ok, created } from "../utils/response.js";
import { AuthRequest } from "../types/common.js";
import { ApiSuccess } from "../constants/messages.js";

export const walletController = {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = BigInt((req as AuthRequest).user!.sub);
      const { page, limit } = req.query as unknown as { page: number; limit: number };
      const result = await walletService.list(userId, page, limit);
      ok(res, "Success", result);
    } catch (e) {
      next(e);
    }
  },

  async get(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = BigInt((req as AuthRequest).user!.sub);
      const wallet = await walletService.getByPublicId(userId, req.params.publicId);
      ok(res, "Success", wallet);
    } catch (e) {
      next(e);
    }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = BigInt((req as AuthRequest).user!.sub);
      const wallet = await walletService.create(userId, req.body);
      created(res, "Wallet created", wallet);
    } catch (e) {
      next(e);
    }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = BigInt((req as AuthRequest).user!.sub);
      const wallet = await walletService.update(userId, req.params.publicId, req.body);
      ok(res, ApiSuccess.UPDATED, wallet);
    } catch (e) {
      next(e);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = BigInt((req as AuthRequest).user!.sub);
      await walletService.delete(userId, req.params.publicId);
      ok(res, ApiSuccess.DELETED, null);
    } catch (e) {
      next(e);
    }
  },
};