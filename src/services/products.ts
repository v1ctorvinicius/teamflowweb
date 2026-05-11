// src/services/products.ts
import { api } from './api'
import type { Product, ProductFilters, ProductsResponse } from '../types'

export const productsService = {
  async list(filters: ProductFilters = {}): Promise<ProductsResponse> {
    const { data } = await api.get<ProductsResponse>('/products', {
      params: filters,
    })
    return data
  },

  async getById(id: string): Promise<Product> {
    const { data } = await api.get<{ data: Product }>(`/products/${id}`)
    return data.data
  },

  async getBySlug(slug: string): Promise<Product> {
    const { data } = await api.get<{ data: Product }>(`/products/slug/${slug}`)
    return data.data
  },

  async getFeatured(): Promise<Product[]> {
    const { data } = await api.get<{ data: Product[] }>('/products/featured')
    return data.data
  },
}