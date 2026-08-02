import { Request, Response, NextFunction } from "express";
import { attachmentService } from "../services/attachment.service.js";
import { ok, created } from "../utils/response.js";
import { AuthRequest } from "../types/common.js";
import { ApiSuccess } from "../constants/messages.js";

export const attachmentController = {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = BigInt((req as AuthRequest).user!.sub);
      const { page, limit, transactionPublicId } = req.query as unknown as {
        page: number;
        limit: number;
        transactionPublicId?: string;
      };
      const result = await attachmentService.list(userId, page, limit, transactionPublicId);
      ok(res, "Success", result);
    } catch (e) {
      next(e);
    }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = BigInt((req as AuthRequest).user!.sub);
      const attachment = await attachmentService.create(userId, req.body);
      created(res, "Attachment created", attachment);
    } catch (e) {
      next(e);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = BigInt((req as AuthRequest).user!.sub);
      await attachmentService.delete(userId, req.params.publicId);
      ok(res, ApiSuccess.DELETED, null);
    } catch (e) {
      next(e);
    }
  },
};