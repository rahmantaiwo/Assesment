import { Product, type IProduct } from "../models/Product";

export interface CreateProductData {
  name: string;
  description: string;
  category: string;
  price: number;
  image: string;
  stock: number;
}

export type UpdateProductData = Partial<CreateProductData>;

export interface PaginationOptions {
  limit: number;
  skip: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  skip: number;
  hasMore: boolean;
}

/**
 * Data-access layer for products. The only place that talks to the Product
 * model. Services depend on this, not on Mongoose directly.
 */
export const productRepository = {
  create(data: CreateProductData): Promise<IProduct> {
    return Product.create(data);
  },

  async findAll(options?: PaginationOptions): Promise<PaginatedResult<IProduct>> {
    const limit = options?.limit ?? 10;
    const skip = options?.skip ?? 0;

    const [data, total] = await Promise.all([
      Product.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .exec(),
      Product.countDocuments().exec(),
    ]);

    return {
      data,
      total,
      limit,
      skip,
      hasMore: skip + data.length < total,
    };
  },

  findById(id: string): Promise<IProduct | null> {
    return Product.findById(id).exec();
  },

  update(id: string, data: UpdateProductData): Promise<IProduct | null> {
    return Product.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).exec();
  },

  delete(id: string): Promise<IProduct | null> {
    return Product.findByIdAndDelete(id).exec();
  },
};
