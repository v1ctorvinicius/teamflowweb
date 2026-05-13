// src/services/user.ts

import { api } from './api'
import type { User, UpdateProfileInput, ChangePasswordInput } from '@/types'

export const userService = {
  async getProfile(): Promise<User> {
    const { data } = await api.get<{ data: User }>('/users/me')
    return data.data
  },

  async updateProfile(input: UpdateProfileInput): Promise<User> {
    const { data } = await api.patch<{ data: User }>('/users/me', input)
    return data.data
  },

  async changePassword(input: ChangePasswordInput): Promise<{ message: string }> {
    const { data } = await api.post<{ message: string }>(
      '/users/me/change-password',
      input
    )
    return data
  },

  // wishlist
  async getWishlist() {
    const { data } = await api.get<{ data: any[] }>('/users/wishlist')
    return data.data
  },

  async addToWishlist(productId: string): Promise<{ message: string }> {
    const { data } = await api.post<{ message: string }>(
      `/users/wishlist/${productId}`
    )
    return data
  },

  async removeFromWishlist(productId: string): Promise<{ message: string }> {
    const { data } = await api.delete<{ message: string }>(
      `/users/wishlist/${productId}`
    )
    return data
  },

  async isInWishlist(productId: string): Promise<boolean> {
    const { data } = await api.get<{ data: { isInWishlist: boolean } }>(
      `/users/wishlist/${productId}/check`
    )
    return data.data.isInWishlist
  },
}