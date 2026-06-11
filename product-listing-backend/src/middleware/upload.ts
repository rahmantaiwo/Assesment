import multer, { MulterError } from "multer";
import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";
import { logger } from "../utils/logger";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const IMAGE_FIELDS = ["image", "file", "picture"] as const;

/**
 * Buffers a single uploaded image in memory so it can be streamed straight to
 * Cloudinary without touching disk. Rejects non-image MIME types.
 *
 * Accepts image uploads via field names: image, file, or picture
 */
const multerUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    logger.info(
      { fieldname: file.fieldname, mimetype: file.mimetype, size: file.size },
      "File upload received"
    );

    if (file.mimetype.startsWith("image/")) {
      logger.info({ filename: file.originalname }, "Image validated");
      cb(null, true);
    } else {
      const error = new Error(`Only image files are allowed (received: ${file.mimetype})`);
      logger.warn({ mimetype: file.mimetype }, "Invalid file type rejected");
      cb(error);
    }
  },
}).fields(IMAGE_FIELDS.map((name) => ({ name, maxCount: 1 })));

/**
 * Wrapper for Multer that handles errors properly by passing them to Express error handler.
 */
export function uploadImage(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  multerUpload(req, res, (err: unknown) => {
    if (err instanceof MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        next(new AppError(400, "Image must be 5 MB or smaller"));
      } else {
        next(new AppError(400, err.message));
      }
    } else if (err instanceof Error) {
      next(new AppError(400, err.message));
    } else if (err) {
      next(err);
    } else {
      next();
    }
  });
}

/**
 * Extracts the uploaded image from the request, supporting multiple field names.
 * Returns the file object or undefined if no image was uploaded.
 */
export function getUploadedImage(req: Request): Express.Multer.File | undefined {
  const files = (req as any).files;

  logger.debug({ hasFiles: !!files, fields: Object.keys(files || {}) }, "Checking uploaded files");

  if (!files) {
    logger.debug("No files object found in request");
    return undefined;
  }

  if (Array.isArray(files)) {
    logger.info({ count: files.length }, "Files is an array");
    return files[0];
  }

  for (const field of IMAGE_FIELDS) {
    const fileArray = files[field];
    if (fileArray && Array.isArray(fileArray) && fileArray.length > 0) {
      const file = fileArray[0];
      logger.info(
        { field, filename: file.originalname, size: file.size, mimetype: file.mimetype },
        "Image file extracted"
      );
      return file;
    }
  }

  logger.warn("No valid image field found in uploaded files");
  return undefined;
}
