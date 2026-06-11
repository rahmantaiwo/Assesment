import dotenv from "dotenv";

dotenv.config();

function required(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  port: Number(process.env["PORT"] ?? 5000),
  nodeEnv: process.env["NODE_ENV"] ?? "development",
  mongoUri: required("MONGO_URI"),
  jwtSecret: required("JWT_SECRET"),
  jwtExpires: process.env["JWT_EXPIRES"] ?? "7d",
  seed: {
    username: process.env["SEED_ADMIN_USERNAME"] ?? "admin",
    password: process.env["SEED_ADMIN_PASSWORD"] ?? "admin123",
  },
  cloudinary: {
    cloudName: process.env["CLOUDINARY_CLOUD_NAME"] ?? "",
    apiKey: process.env["CLOUDINARY_API_KEY"] ?? "",
    apiSecret: process.env["CLOUDINARY_API_SECRET"] ?? "",
  },
} as const;

/** True only when all three Cloudinary credentials are present. */
export const isCloudinaryConfigured = Boolean(
  env.cloudinary.cloudName && env.cloudinary.apiKey && env.cloudinary.apiSecret
);
