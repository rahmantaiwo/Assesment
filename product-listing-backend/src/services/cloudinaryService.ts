import type { UploadApiResponse } from "cloudinary";
import { cloudinary, isCloudinaryConfigured } from "../config/cloudinary";
import { AppError } from "../utils/AppError";
import { logger } from "../utils/logger";

const ROOT_FOLDER = "product-listing";
// Sub-folders callers may target. Keeps uploads organized without letting an
// arbitrary string create junk folders in the Cloudinary account.
export const ALLOWED_FOLDERS = ["products", "landing", "general"] as const;
const DEFAULT_FOLDER = "general";

/** Resolves a caller-supplied folder to a safe, namespaced Cloudinary path. */
export function resolveFolder(input: unknown): string {
  const sub =
    typeof input === "string" &&
    (ALLOWED_FOLDERS as readonly string[]).includes(input)
      ? input
      : DEFAULT_FOLDER;
  return `${ROOT_FOLDER}/${sub}`;
}

/**
 * Streams an in-memory file buffer to Cloudinary and returns the upload result.
 * Throws a 503 if Cloudinary isn't configured.
 * Throws a 502 if the upload fails.
 * This is the single place the app talks to the Cloudinary uploader.
 */
export function uploadBuffer(
  buffer: Buffer,
  folderInput?: unknown
): Promise<UploadApiResponse> {
  if (!isCloudinaryConfigured) {
    logger.error("Cloudinary not configured");
    return Promise.reject(new AppError(503, "Image upload is not configured"));
  }

  if (!buffer || buffer.length === 0) {
    logger.error("Empty buffer provided for upload");
    return Promise.reject(new AppError(400, "Image buffer is empty"));
  }

  const folder = resolveFolder(folderInput);
  logger.info({ folder, bufferSize: buffer.length }, "Starting Cloudinary upload");

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { 
        folder, 
        resource_type: "image",
        timeout: 60000, // 60 second timeout
      },
      (error, result) => {
        if (error) {
          logger.error(
            { 
              err: error, 
              folder,
              errorCode: (error as any)?.http_code,
            },
            "Cloudinary upload failed"
          );
          reject(new AppError(502, `Image upload failed: ${error.message}`));
        } else if (!result) {
          logger.error({ folder }, "Cloudinary upload returned no result");
          reject(new AppError(502, "Cloudinary upload returned empty result"));
        } else {
          logger.info(
            { 
              publicId: result.public_id, 
              url: result.secure_url,
              size: result.bytes,
            },
            "Image uploaded successfully to Cloudinary"
          );
          resolve(result);
        }
      }
    );

    stream.on("error", (error: any) => {
      logger.error({ err: error }, "Stream error during Cloudinary upload");
      reject(new AppError(502, "Image upload stream error"));
    });

    stream.end(buffer);
  });
}
