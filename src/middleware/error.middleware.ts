import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors.js";

interface MappedError {
  statusCode: number;
  message: string;
  errors?: Record<string, string[]>;
}

function isBodyParserError(err: unknown): err is { type: string; status: number; message?: string } {
  return (
    typeof err === "object" &&
    err !== null &&
    "type" in err &&
    typeof (err as { type?: unknown }).type === "string" &&
    "status" in err &&
    typeof (err as { status?: unknown }).status === "number"
  );
}

function mapError(err: unknown): MappedError {
  if (isBodyParserError(err)) {
    if (err.type === "entity.parse.failed") {
      return { statusCode: 400, message: "Invalid JSON payload" };
    }
    if (err.type === "entity.too.large") {
      return { statusCode: 413, message: "Payload too large" };
    }
    return { statusCode: err.status, message: err.message ?? "Request error" };
  }

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
      const raw = err.meta?.target;
      const target = Array.isArray(raw) ? raw.join(", ") : String(raw ?? "field");
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