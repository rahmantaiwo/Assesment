import type { Request, Response, NextFunction } from "express";
import { productService } from "../services/productService";
import { getUploadedImage } from "../middleware/upload";

/** POST /api/products */
export async function createProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const image = getUploadedImage(req);
    const product = await productService.create(
      req.body,
      image ? { buffer: image.buffer } : undefined
    );
    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
}

/** GET /api/products?limit=10&skip=0 */
export async function getProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await productService.findAll(req.query);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

/** GET /api/products/:id */
export async function getProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const product = await productService.findById(req.params["id"] as string);
    res.status(200).json(product);
  } catch (error) {
    next(error);
  }
}

/** PUT /api/products/:id */
export async function updateProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const image = getUploadedImage(req);
    const product = await productService.update(
      req.params["id"] as string,
      req.body,
      image ? { buffer: image.buffer } : undefined
    );
    res.status(200).json(product);
  } catch (error) {
    next(error);
  }
}

/** DELETE /api/products/:id */
export async function deleteProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await productService.delete(req.params["id"] as string);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
