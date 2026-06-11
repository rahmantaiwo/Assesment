import api from "./api";
import type { AuthResponse, CurrentUserResponse } from "../types";

export interface LoginCredentials {
  username: string;
  password: string;
}

export const authService = {
  login: async (credentials: LoginCredentials) => {
    const response = await api.post<AuthResponse>("/auth/login", credentials);
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get<CurrentUserResponse>("/auth/me");
    return response.data.user;
  },
};
