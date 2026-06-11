import {
  productRepository,
  type CreateProductData,
  type UpdateProductData,
  type PaginationOptions,
  type PaginatedResult,
} from "../repositories/productRepository";
import { uploadBuffer } from "./cloudinaryService";
import { AppError } from "../utils/AppError";
import { logger } from "../utils/logger";
import type { IProduct } from "../models/Product";

type CreateProductInput = Omit<CreateProductData, "image"> & {
  image?: string;
};

interface ProductImageUpload {
  buffer: Buffer;
}

const MAX_PAGE_LIMIT = 100;
const DEFAULT_PAGE_LIMIT = 10;

/**
 * Coerces the loosely-typed body of an incoming request into a product input.
 * Multipart/form-data delivers every field as a string, so numeric fields are
 * normalized here (empty string -> undefined) before validation runs. Keeping
 * this in the service means controllers never reshape domain data.
 */
function normalizeProductInput(body: unknown): Record<string, unknown> {
  const data: Record<string, unknown> = { ...((body as object) ?? {}) };
  for (const field of ["price", "stock"] as const) {
    if (typeof data[field] === "string") {
      data[field] = data[field] === "" ? undefined : Number(data[field]);
    }
  }
  return data;
}

/**
 * Clamps raw pagination query params to a safe range: limit 1-100 (default 10),
 * skip >= 0 (default 0). Non-numeric input falls back to the defaults.
 */
function normalizePagination(query: unknown): PaginationOptions {
  const q = (query as Record<string, unknown>) ?? {};
  const limit = Math.max(
    1,
    Math.min(Number(q["limit"]) || DEFAULT_PAGE_LIMIT, MAX_PAGE_LIMIT)
  );
  const skip = Math.max(0, Number(q["skip"]) || 0);
  return { limit, skip };
}

/**
 * Re-throws known AppErrors unchanged so the central handler maps them to the
 * correct status; wraps anything unexpected as a 500 so internals never leak.
 */
function handleServiceError(error: unknown): never {
  if (error instanceof AppError) {
    throw error;
  }
  logger.error({ err: error }, "productService error");
  throw new AppError(500, "Something went wrong");
}

async function resolveProductImage(
  imageUrl: string | undefined,
  imageUpload?: ProductImageUpload
): Promise<string | undefined> {
  if (!imageUpload) {
    return imageUrl;
  }

  try {
    logger.info("Uploading image to Cloudinary...");
    const result = await uploadBuffer(imageUpload.buffer, "products");
    logger.info({ url: result.secure_url, publicId: result.public_id }, "Image uploaded successfully");
    return result.secure_url;
  } catch (error) {
    logger.error({ err: error }, "Cloudinary upload failed");
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(502, "Failed to upload image to cloud storage");
  }
}

/**
 * Business logic for products. Orchestrates the repository; throws AppError
 * for any rule violation.
 */
export const productService = {
  async create(
    rawInput: unknown,
    imageUpload?: ProductImageUpload
  ): Promise<IProduct> {
    try {
      const input = normalizeProductInput(rawInput) as CreateProductInput;
      const { name, description, category, price, stock } = input;
      const image = await resolveProductImage(input.image, imageUpload);

      if (
        !name ||
        !description ||
        !category ||
        price === undefined ||
        price === null ||
        !image ||
        stock === undefined ||
        stock === null
      ) {
        throw new AppError(
          400,
          "name, description, category, price, image and stock are required"
        );
      }

      if (typeof price !== "number" || isNaN(price) || typeof stock !== "number" || isNaN(stock)) {
        throw new AppError(400, "price and stock must be valid numbers");
      }

      if (price < 0 || stock < 0) {
        throw new AppError(400, "price and stock cannot be negative");
      }

      return await productRepository.create({
        name,
        description,
        category,
        price,
        image,
        stock,
      });
    } catch (error) {
      handleServiceError(error);
    }
  },

  async findAll(query?: unknown): Promise<PaginatedResult<IProduct>> {
    try {
      const pagination = normalizePagination(query);
      return await productRepository.findAll(pagination);
    } catch (error) {
      handleServiceError(error);
    }
  },

  async findById(id: string): Promise<IProduct> {
    try {
      const product = await productRepository.findById(id);
      if (!product) {
        throw new AppError(404, "Product not found");
      }
      return product;
    } catch (error) {
      handleServiceError(error);
    }
  },

  async update(
    id: string,
    rawInput: unknown,
    imageUpload?: ProductImageUpload
  ): Promise<IProduct> {
    try {
      const updateData = normalizeProductInput(rawInput) as UpdateProductData;
      const { price, stock } = updateData;

      if (price !== undefined && (typeof price !== "number" || isNaN(price))) {
        throw new AppError(400, "price must be a valid number");
      }
      if (stock !== undefined && (typeof stock !== "number" || isNaN(stock))) {
        throw new AppError(400, "stock must be a valid number");
      }

      if ((price ?? 0) < 0 || (stock ?? 0) < 0) {
        throw new AppError(400, "price and stock cannot be negative");
      }

      const image = await resolveProductImage(updateData.image, imageUpload);
      if (image) {
        updateData.image = image;
      }

      const product = await productRepository.update(id, updateData);
      if (!product) {
        throw new AppError(404, "Product not found");
      }
      return product;
    } catch (error) {
      handleServiceError(error);
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const product = await productRepository.delete(id);
      if (!product) {
        throw new AppError(404, "Product not found");
      }
    } catch (error) {
      handleServiceError(error);
    }
  },
};
