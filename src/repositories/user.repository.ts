import { User } from "@prisma/client";
import { prisma } from "../prisma/client.js";

export const userRepository = {
  findByEmail: (email: string): Promise<User | null> =>
    prisma.user.findUnique({ where: { email } }),

  findById: (id: bigint): Promise<User | null> =>
    prisma.user.findUnique({ where: { id } }),

  findByPublicId: (publicId: string): Promise<User | null> =>
    prisma.user.findUnique({ where: { publicId } }),

  create: (data: {
    name: string;
    email: string;
    passwordHash: string;
  }): Promise<User> =>
    prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash: data.passwordHash,
      },
    }),

  updateRefreshToken: (id: bigint, hash: string | null): Promise<User> =>
    prisma.user.update({
      where: { id },
      data: { refreshTokenHash: hash },
    }),
};