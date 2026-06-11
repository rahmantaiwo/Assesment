import type { Request, Response } from "express";
import { authService } from "../services/authService";

/** POST /api/auth/login */
export async function login(req: Request, res: Response): Promise<void> {
  const result = await authService.login(req.body ?? {});
  res.status(200).json(result);
}

/** GET /api/auth/me */
export async function me(req: Request, res: Response): Promise<void> {
  const user = await authService.getById(req.userId as string);
  res.status(200).json({ user });
}
