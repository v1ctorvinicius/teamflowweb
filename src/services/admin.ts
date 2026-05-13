// src/services/admin.ts
import { api } from "./api";
import type { Product } from "@/types";

export interface AdminProductsResponse {
  data: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateProductInput {
  name: string;
  club: string;
  season: string;
  type: "PLAYER" | "FAN";
  sizes: string[];
  basePrice: number;
  description?: string;
  imageUrl?: string;
  stockBySize: Record<string, number>;
}

export interface UpdateProductInput {
  name?: string;
  basePrice?: number;
  description?: string;
  imageUrl?: string;
  stockBySize?: Record<string, number>;
  isActive?: boolean;
}

export const adminService = {
  async listProducts(
    params: {
      page?: number;
      limit?: number;
      club?: string;
      type?: string;
    } = {},
  ): Promise<AdminProductsResponse> {
    const { data } = await api.get<AdminProductsResponse>("/admin/products", {
      params,
    });
    return data;
  },

  async createProduct(input: CreateProductInput): Promise<Product> {
    const payload = {
      ...input,
      isFeatured: input.isFeatured ?? false,
    };
    const { data } = await api.post<{ data: Product }>(
      "/admin/products",
      payload,
    );
    return data.data;
  },

  async updateProduct(id: string, input: UpdateProductInput): Promise<Product> {
    try {
      // Normalizar stockBySize se vier como string
      let stockBySize = input.stockBySize;
      if (typeof stockBySize === "string") {
        try {
          stockBySize = JSON.parse(stockBySize);
        } catch {
          stockBySize = {};
        }
      }

      const payload: any = {
        ...input,
        stockBySize, // garante que é object, não string
      };

      const { data } = await api.patch<{ data: Product }>(
        `/admin/products/${id}`,
        payload,
      );
      return data.data;
    } catch (err: any) {
      console.error("❌ updateProduct error:", err);
      throw err;
    }
  },

  async deleteProduct(id: string): Promise<void> {
    await api.delete(`/admin/products/${id}`);
  },

  async listUsers(): Promise<any[]> {
    const { data } = await api.get<{ data: any[] }>("/admin/users");
    return data.data;
  },

  async createCategory(input: {
    label: string;
    icon?: string;
    sortOrder?: number;
  }) {
    const { data } = await api.post("/admin/categories", input);
    return data.data;
  },

  async updateCategory(
    slug: string,
    input: {
      label?: string;
      icon?: string;
      sortOrder?: number;
      isActive?: boolean;
    },
  ) {
    const { data } = await api.patch(`/admin/categories/${slug}`, input);
    return data.data;
  },

  async deleteCategory(slug: string) {
    const { data } = await api.delete(`/admin/categories/${slug}`);
    return data;
  },
};
