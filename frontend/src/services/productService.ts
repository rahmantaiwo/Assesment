import api from "./api";
import type { Product, PaginatedResult } from "../types";

const normalizeProduct = (raw: any): Product => ({
  ...raw,
  id: raw._id || raw.id,
  image: raw.image || "",
});

export const productService = {
  getAll: async (params?: { limit?: number; skip?: number }) => {
    const response = await api.get<PaginatedResult<any>>("/products", { params });
    return {
      ...response.data,
      data: response.data.data.map(normalizeProduct),
    };
  },

  getById: async (id: string) => {
    const response = await api.get<any>(`/products/${id}`);
    return normalizeProduct(response.data);
  },

  create: async (productData: Omit<Product, "id" | "createdAt" | "updatedAt"> | FormData) => {
    const headers = productData instanceof FormData 
      ? { "Content-Type": "multipart/form-data" }
      : undefined;
    
    const response = await api.post<any>("/products", productData, { headers });
    return normalizeProduct(response.data);
  },

  update: async (id: string, productData: Partial<Product> | FormData) => {
    const headers = productData instanceof FormData 
      ? { "Content-Type": "multipart/form-data" }
      : undefined;

    const response = await api.put<any>(`/products/${id}`, productData, { headers });
    return normalizeProduct(response.data);
  },

  delete: async (id: string) => {
    await api.delete(`/products/${id}`);
  },
};
