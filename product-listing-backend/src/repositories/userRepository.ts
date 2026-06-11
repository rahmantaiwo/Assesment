import { User, type IUser } from "../models/User";

export interface CreateUserData {
  username: string;
  password: string;
}

/**
 * Data-access layer for users. The only place that talks to the User model.
 * Services depend on this, not on Mongoose directly.
 */
export const userRepository = {
  findByUsername(username: string): Promise<IUser | null> {
    return User.findOne({ username }).exec();
  },

  /** Includes the password field (normally select:false) for credential checks. */
  findByUsernameWithPassword(username: string): Promise<IUser | null> {
    return User.findOne({ username }).select("+password").exec();
  },

  findById(id: string): Promise<IUser | null> {
    return User.findById(id).exec();
  },

  create(data: CreateUserData): Promise<IUser> {
    return User.create(data);
  },
};
