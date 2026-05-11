// src/services/auth.ts
import { api } from './api'
import type { AuthResponse, User } from '../types'

export interface LoginInput {
  email: string
  password: string
}

export interface RegisterInput {
  email: string
  password: string
  name: string
  favoriteTeam?: string
}

export const authService = {
  async login(input: LoginInput): Promise<AuthResponse['data']> {
    const { data } = await api.post<AuthResponse>('/auth/login', input)
    return data.data
  },

  async register(input: RegisterInput): Promise<AuthResponse['data']> {
    const { data } = await api.post<AuthResponse>('/users/register', input)
    return data.data
  },

  async logout(refreshToken: string): Promise<void> {
    await api.post('/auth/logout', { refreshToken })
  },

  async getMe(): Promise<User> {
    const { data } = await api.get<{ data: User }>('/users/me')
    return data.data
  },
}