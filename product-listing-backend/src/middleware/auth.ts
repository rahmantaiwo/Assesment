import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/token";

// Augment Express's Request so controllers can read req.userId after auth.
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

/**
 * Verifies the `Authorization: Bearer <token>` header.
 * On success attaches req.userId; otherwise responds 401.
 */
export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  const token = header.slice("Bearer ".length).trim();

  try {
    const payload = verifyToken(token);
    req.userId = payload.id;
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}
