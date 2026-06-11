import { Router } from "express";
import {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController";
import { authenticate } from "../middleware/auth";
import { uploadImage } from "../middleware/upload";

const router = Router();

/**
 * @openapi
 * tags:
 *   name: Products
 *   description: Product management endpoints
 *
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       properties:
 *         id: { type: string, example: "6a298c38d6cbbaf22608d188" }
 *         name: { type: string, example: "Wireless Mouse" }
 *         description: { type: string, example: "Ergonomic 2.4GHz mouse" }
 *         category: { type: string, example: "Electronics" }
 *         price: { type: number, example: 19.99 }
 *         image: { type: string, example: "https://example.com/mouse.png" }
 *         stock: { type: integer, example: 120 }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 *     ProductInput:
 *       type: object
 *       required: [name, description, category, price, image, stock]
 *       properties:
 *         name: { type: string, example: "Wireless Mouse" }
 *         description: { type: string, example: "Ergonomic 2.4GHz mouse" }
 *         category: { type: string, example: "Electronics" }
 *         price: { type: number, example: 19.99 }
 *         image: { type: string, example: "https://example.com/mouse.png" }
 *         stock: { type: integer, example: 120 }
 */

/**
 * @openapi
 * /api/products:
 *   get:
 *     summary: List all products with pagination
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 100
 *         description: Number of products per page (default 10, max 100)
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *           default: 0
 *           minimum: 0
 *         description: Number of products to skip
 *     responses:
 *       200:
 *         description: Paginated list of products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Product' }
 *                 total:
 *                   type: integer
 *                   description: Total number of products in database
 *                 limit:
 *                   type: integer
 *                   description: Limit parameter used
 *                 skip:
 *                   type: integer
 *                   description: Skip parameter used
 *                 hasMore:
 *                   type: boolean
 *                   description: Whether there are more products to fetch
 *   post:
 *     summary: Create a product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [name, description, category, price, stock, image]
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               category: { type: string }
 *               price: { type: number }
 *               stock: { type: integer }
 *               image: { type: string, format: binary, description: "Image file uploaded from your device. The backend also accepts file or picture as the field name." }
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ProductInput' }
 *     responses:
 *       201:
 *         description: Product created
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Product' }
 *       400: { description: Validation error }
 *       401: { description: Authentication required }
 */
router.get("/", getProducts);
router.post("/", authenticate, uploadImage, createProduct);

/**
 * @openapi
 * /api/products/{id}:
 *   get:
 *     summary: Get a product by id
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: The product
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Product' }
 *       404: { description: Product not found }
 *   put:
 *     summary: Update a product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               category: { type: string }
 *               price: { type: number }
 *               stock: { type: integer }
 *               image: { type: string, format: binary, description: "Optional replacement image file uploaded from your device. The backend also accepts file or picture as the field name." }
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ProductInput' }
 *     responses:
 *       200:
 *         description: Updated product
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Product' }
 *       401: { description: Authentication required }
 *       404: { description: Product not found }
 *   delete:
 *     summary: Delete a product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204: { description: Deleted }
 *       401: { description: Authentication required }
 *       404: { description: Product not found }
 */
router.get("/:id", getProduct);
router.put("/:id", authenticate, uploadImage, updateProduct);
router.delete("/:id", authenticate, deleteProduct);

export default router;
