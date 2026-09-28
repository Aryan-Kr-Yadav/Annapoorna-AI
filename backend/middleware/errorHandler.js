import { logger } from "../utils/logger.js";
import { errorResponse } from "../utils/responseFormatter.js";
import multer from "multer";

/**
 * Centralized error handler. Must be registered last, after all routes.
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  logger.error(err.message, err.stack);

  if (err instanceof multer.MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "Image is too large. Please upload a file under 5MB."
        : `Upload error: ${err.message}`;
    return errorResponse(res, message, 400);
  }

  const statusCode = err.statusCode || 500;
  const message = err.statusCode ? err.message : "Internal server error. Please try again later.";

  return errorResponse(res, message, statusCode, err.message);
}

export function notFoundHandler(req, res) {
  return errorResponse(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
}
