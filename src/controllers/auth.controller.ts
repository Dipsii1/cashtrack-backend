import { Request, Response, NextFunction } from "express";
import { authService } from "../services/auth.service.js";
import { userRepository } from "../repositories/user.repository.js";
import { ok, created } from "../utils/response.js";
import { AuthRequest } from "../types/common.js";
import { AuthMessages } from "../constants/messages.js";

export const authController = {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.register(req.body);
      created(res, AuthMessages.REGISTER_SUCCESS, result);
    } catch (e) {
      next(e);
    }
  },

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.login(req.body);
      ok(res, AuthMessages.LOGIN_SUCCESS, result);
    } catch (e) {
      next(e);
    }
  },

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tokens = await authService.refresh(req.body.refreshToken);
      ok(res, AuthMessages.REFRESH_SUCCESS, tokens);
    } catch (e) {
      next(e);
    }
  },

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = BigInt((req as AuthRequest).user!.sub);
      await authService.logout(userId);
      ok(res, AuthMessages.LOGOUT_SUCCESS, null);
    } catch (e) {
      next(e);
    }
  },

  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = BigInt((req as AuthRequest).user!.sub);
      const user = await userRepository.findById(userId);
      if (!user) {
        ok(res, "Success", null);
        return;
      }
      ok(res, "Success", {
        publicId: user.publicId,
        name: user.name,
        email: user.email,
      });
    } catch (e) {
      next(e);
    }
  },
};