// src/services/auth.ts
import { api } from "./api";
import type { User } from "../types";

export interface LoginInput {
  login: string;
  password: string;
}

export interface AuthResponse {
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
}

export interface RegisterInput {
  username: string;
  name: string;
  email?: string;
  password: string;
  confirmPassword?: string;
  favoriteTeam?: string;
  phone?: string;
}

export const authService = {
  async login(input: LoginInput): Promise<AuthResponse["data"]> {
    const { data } = await api.post<AuthResponse>("/auth/login", input);
    return data.data;
  },

  async register(input: RegisterInput): Promise<AuthResponse["data"]> {
    const payload = {
      username: input.username,
      name: input.name,
      email: input.email || undefined,
      password: input.password,
      confirmPassword: input.confirmPassword,
      favoriteTeam: input.favoriteTeam,
      phone: input.phone,
    };
    const { data } = await api.post<AuthResponse>("/users/register", payload);
    return data.data;
  },

  async logout(refreshToken: string): Promise<void> {
    await api.post("/auth/logout", { refreshToken });
  },

  async getMe(): Promise<User> {
    const { data } = await api.get<{ data: User }>("/users/me");
    return data.data;
  },
};
