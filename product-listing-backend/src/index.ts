import express from "express";
import type { Request, Response } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env";
import { connectDB } from "./config/db";
import { swaggerSpec } from "./config/swagger";
import { logger } from "./utils/logger";
import authRoutes from "./routes/authRoutes";
import productRoutes from "./routes/productRoutes";
import { errorHandler } from "./middleware/errorHandler";

async function start(): Promise<void> {
  await connectDB();

  const app = express();

  app.use(pinoHttp({ logger }));
  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", uptime: process.uptime() });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/products", productRoutes);

  // Swagger UI + raw OpenAPI spec.
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get("/openapi.json", (_req: Request, res: Response) => {
    res.json(swaggerSpec);
  });

  // Central error handler — must be registered after routes.
  app.use(errorHandler);

  app.listen(env.port, () => {
    logger.info(`Server running on http://localhost:${env.port}`);
  });
}

start();
