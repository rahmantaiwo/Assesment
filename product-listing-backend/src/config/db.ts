import mongoose from "mongoose";
import { env } from "./env";
import { logger } from "../utils/logger";

/**
 * Establishes the MongoDB connection using Mongoose.
 * Exits the process on failure so the app never runs without a database.
 */
export async function connectDB(): Promise<void> {
  try {
    const conn = await mongoose.connect(env.mongoUri);
    logger.info(
      `MongoDB connected: ${conn.connection.host}/${conn.connection.name}`
    );
  } catch (error) {
    logger.error({ err: error }, "MongoDB connection error");
    process.exit(1);
  }

  mongoose.connection.on("disconnected", () => {
    logger.warn("MongoDB disconnected");
  });

  mongoose.connection.on("error", (err) => {
    logger.error({ err }, "MongoDB runtime error");
  });
}
