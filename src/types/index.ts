// src/types/index.ts

export type ProductCategory = 'SHIRT' | 'SHOE' | 'COMBO'

export interface User {
  id: string
  email: string
  name: string
  role?: string
  favoriteTeam?: string
  emailVerified?: boolean
  phone?: string
  
  addressStreet?: string
  addressNumber?: string
  addressComplement?: string
  addressCity?: string
  addressState?: string
  addressZip?: string
  addressCountry?: string
}


export interface UpdateProfileInput {
  name?: string
  email?: string
  phone?: string
  favoriteTeam?: string
  
  addressStreet?: string
  addressNumber?: string
  addressComplement?: string
  addressCity?: string
  addressState?: string
  addressZip?: string
}
 
export interface ChangePasswordInput {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export interface AuthResponse {
  data: {
    user: User
    accessToken: string
    refreshToken: string
  }
}

export interface Product {
  id: string
  name: string
  club: string
  season: string
  category: ProductCategory
  type: 'PLAYER' | 'FAN'
  
  enableCategoricalSizes: boolean
  categoricalSizesLabel: string
  stockCategorical: string[]
  stockCategoricalBySize: Record<string, number>
  
  enableNumericSizes: boolean
  numericSizesLabel: string
  stockNumeric: Record<string, number>
  
  basePrice: number
  description: string | null
  imageUrl: string | null
  imageUrls: string[]
  
  isActive: boolean
  isFeatured: boolean
  slug: string
  createdAt: string
  updatedAt: string
}

export interface ProductsResponse {
  data: Product[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface ProductFilters {
  club?: string
  type?: 'PLAYER' | 'FAN'
  category?: ProductCategory
  season?: string
  sizeCategorical?: string
  sizeNumeric?: string
  featured?: boolean
  page?: number
  limit?: number
}