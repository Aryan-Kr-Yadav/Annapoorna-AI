/**
 * Consistent JSON response helpers used across all controllers.
 */

export function successResponse(res, data, message = "Success", statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
}

export function errorResponse(res, message = "Something went wrong", statusCode = 500, details = null) {
  const body = {
    success: false,
    message,
    timestamp: new Date().toISOString(),
  };
  if (details && process.env.NODE_ENV !== "production") {
    body.details = details;
  }
  return res.status(statusCode).json(body);
}
