import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors.js";

interface MappedError {
  statusCode: number;
  message: string;
  errors?: Record<string, string[]>;
}

function mapError(err: unknown): MappedError {
  if (err instanceof ZodError) {
    const errors: Record<string, string[]> = {};
    for (const issue of err.issues) {
      const key = issue.path.join(".") || "_";
      errors[key] ??= [];
      errors[key].push(issue.message);
    }
    return { statusCode: 422, message: "Validation Error", errors };
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      const target = (err.meta?.target as string[] | undefined)?.join(", ") ?? "field";
      return { statusCode: 409, message: `Unique constraint failed on: ${target}` };
    }
    if (err.code === "P2025") {
      return { statusCode: 404, message: "Resource not found" };
    }
    return { statusCode: 400, message: `Database error: ${err.code}` };
  }

  if (err instanceof AppError) {
    return { statusCode: err.statusCode, message: err.message, errors: err.errors };
  }

  return { statusCode: 500, message: "Internal Server Error" };
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  const { statusCode, message, errors } = mapError(err);
  if (statusCode >= 500) {
    console.error("[ERROR]", err);
  }
  res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
  });
}