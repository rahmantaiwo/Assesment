import { userRepository } from "../repositories/userRepository";
import { signToken } from "../utils/token";
import { AppError } from "../utils/AppError";
import { logger } from "../utils/logger";
import type { IUser } from "../models/User";

export interface LoginInput {
  username: string;
  password: string;
}

export interface PublicUser {
  id: string;
  username: string;
}

export interface AuthResult {
  token: string;
  user: PublicUser;
}

function toPublicUser(user: IUser): PublicUser {
  return {
    id: user.id,
    username: user.username,
  };
}

/**
 * Re-throws known AppErrors unchanged so the central handler maps them to the
 * correct status; wraps anything unexpected as a 500 so internals never leak.
 */
function handleServiceError(error: unknown): never {
  if (error instanceof AppError) {
    throw error;
  }
  logger.error({ err: error }, "authService error");
  throw new AppError(500, "Something went wrong");
}

/**
 * Business logic for authentication. Orchestrates the repository and token
 * utilities; throws AppError for any rule violation. The single user is
 * provisioned by the seed script, so there is no public registration.
 */
export const authService = {
  async login(input: LoginInput): Promise<AuthResult> {
    try {
      const { username, password } = input;

      if (!username || !password) {
        throw new AppError(400, "username and password are required");
      }

      // Normalize to match the schema's lowercase/trim so casing or stray
      // whitespace in the input never causes a false "invalid credentials".
      const normalized = username.trim().toLowerCase();
      const user = await userRepository.findByUsernameWithPassword(normalized);
      if (!user || !(await user.comparePassword(password))) {
        throw new AppError(401, "Invalid credentials");
      }

      const token = signToken({ id: user.id });

      return { token, user: toPublicUser(user) };
    } catch (error) {
      handleServiceError(error);
    }
  },

  async getById(id: string): Promise<PublicUser> {
    try {
      const user = await userRepository.findById(id);
      if (!user) {
        throw new AppError(404, "User not found");
      }
      return toPublicUser(user);
    } catch (error) {
      handleServiceError(error);
    }
  },
};
