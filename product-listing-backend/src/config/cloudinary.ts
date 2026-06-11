import { v2 as cloudinary } from "cloudinary";
import { env, isCloudinaryConfigured } from "./env";
import { logger } from "../utils/logger";

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
    secure: true,
  });
} else {
  logger.warn(
    "Cloudinary credentials missing — image upload endpoint will return 503"
  );
}

export { cloudinary, isCloudinaryConfigured };
