export interface Product {
  id: string;
  _id?: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  image: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  skip: number;
  hasMore: boolean;
}

export interface User {
  id: string;
  username: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface CurrentUserResponse {
  user: User;
}
