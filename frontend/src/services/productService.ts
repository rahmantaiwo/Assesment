import api from "./api";
import type { Product } from "../types";

export const productService = {
  getAll: async (params?: { category?: string; search?: string }) => {
    const response = await api.get<Product[]>("/products", { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<Product>(`/products/${id}`);
    return response.data;
  },

  create: async (productData: Omit<Product, "id" | "createdAt" | "updatedAt">) => {
    const response = await api.post<Product>("/products", productData);
    return response.data;
  },

  update: async (id: string, productData: Partial<Product>) => {
    const response = await api.put<Product>(`/products/${id}`, productData);
    return response.data;
  },

  delete: async (id: string) => {
    await api.delete(`/products/${id}`);
  },
};
