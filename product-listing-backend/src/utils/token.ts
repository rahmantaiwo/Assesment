import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import { env } from "../config/env";

export interface JwtPayload {
  id: string;
}

export function signToken(payload: JwtPayload): string {
  const expiresIn = env.jwtExpires as NonNullable<SignOptions["expiresIn"]>;
  return jwt.sign(payload, env.jwtSecret, { expiresIn });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.jwtSecret) as JwtPayload;
}
