import { User } from "@prisma/client";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult {
  user: Pick<User, "publicId" | "name" | "email">;
  tokens: AuthTokens;
}