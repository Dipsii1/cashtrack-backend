import { User } from "@prisma/client";
import { userRepository } from "../repositories/user.repository.js";
import { hashPassword, verifyPassword, hashRefreshToken, verifyRefreshToken as verifyRefreshTokenHash } from "../utils/password.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt.js";
import { AppError } from "../utils/errors.js";
import { AuthResult, AuthTokens } from "../types/auth.types.js";
import { ErrorMessages } from "../constants/messages.js";

function buildTokens(user: Pick<User, "id" | "email">): AuthTokens {
  return {
    accessToken: signAccessToken({ sub: String(user.id), email: user.email }),
    refreshToken: signRefreshToken({ sub: String(user.id) }),
  };
}

function toPublic(user: User): Pick<User, "publicId" | "name" | "email"> {
  return {
    publicId: user.publicId,
    name: user.name,
    email: user.email,
  };
}

export const authService = {
  async register(input: { name: string; email: string; password: string }): Promise<AuthResult> {
    const existing = await userRepository.findByEmail(input.email.toLowerCase());
    if (existing) throw new AppError(ErrorMessages.EMAIL_IN_USE, 409);

    const passwordHash = await hashPassword(input.password);
    const user = await userRepository.create({
      name: input.name,
      email: input.email.toLowerCase(),
      passwordHash,
    });

    const tokens = buildTokens(user);
    await userRepository.updateRefreshToken(user.id, await hashRefreshToken(tokens.refreshToken));

    return { user: toPublic(user), tokens };
  },

  async login(input: { email: string; password: string }): Promise<AuthResult> {
    const user = await userRepository.findByEmail(input.email.toLowerCase());
    if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
      throw new AppError(ErrorMessages.INVALID_CREDENTIALS, 401);
    }

    const tokens = buildTokens(user);
    await userRepository.updateRefreshToken(user.id, await hashRefreshToken(tokens.refreshToken));

    return { user: toPublic(user), tokens };
  },

  async refresh(refreshToken: string): Promise<AuthTokens> {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new AppError(ErrorMessages.INVALID_REFRESH_TOKEN, 401);
    }

    const user = await userRepository.findById(BigInt(payload.sub as string));
    if (!user || !user.refreshTokenHash || !(await verifyRefreshTokenHash(refreshToken, user.refreshTokenHash))) {
      throw new AppError(ErrorMessages.INVALID_REFRESH_TOKEN, 401);
    }

    const tokens = buildTokens(user);
    await userRepository.updateRefreshToken(user.id, await hashRefreshToken(tokens.refreshToken));
    return tokens;
  },

  async logout(userId: bigint): Promise<void> {
    await userRepository.updateRefreshToken(userId, null);
  },
};