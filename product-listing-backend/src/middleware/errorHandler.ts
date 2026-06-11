import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";
import { logger } from "../utils/logger";

/**
 * Central error-handling middleware. Must be registered last.
 * Keeps controllers free of try/catch — they let errors propagate here.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ message: err.message });
    return;
  }

  logger.error({ err }, "Unexpected error");
  res.status(500).json({ message: "Internal server error" });
}
