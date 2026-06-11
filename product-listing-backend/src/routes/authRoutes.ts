import { Router } from "express";
import { login, me } from "../controllers/authController";
import { authenticate } from "../middleware/auth";

const router = Router();

/**
 * @openapi
 * tags:
 *   name: Auth
 *   description: Authentication endpoints
 *
 * components:
 *   schemas:
 *     PublicUser:
 *       type: object
 *       properties:
 *         id: { type: string, example: "6a298c38d6cbbaf22608d188" }
 *         username: { type: string, example: "admin" }
 *     AuthResult:
 *       type: object
 *       properties:
 *         token: { type: string }
 *         user: { $ref: '#/components/schemas/PublicUser' }
 */

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Log in and receive a JWT
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username: { type: string, example: "admin" }
 *               password: { type: string, example: "admin123" }
 *     responses:
 *       200:
 *         description: Authenticated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/AuthResult' }
 *       400: { description: Missing credentials }
 *       401: { description: Invalid credentials }
 */
router.post("/login", login);

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     summary: Get the currently authenticated user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user: { $ref: '#/components/schemas/PublicUser' }
 *       401: { description: Authentication required }
 *       404: { description: User not found }
 */
router.get("/me", authenticate, me);

export default router;
