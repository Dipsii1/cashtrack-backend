import { Response } from "express";
import { serializeForResponse } from "./serializer.js";

export function ok<T>(res: Response, message: string, data: T, status = 200): Response {
  return res.status(status).json(serializeForResponse({ success: true, message, data }));
}

export function created<T>(res: Response, message: string, data: T): Response {
  return ok(res, message, data, 201);
}
