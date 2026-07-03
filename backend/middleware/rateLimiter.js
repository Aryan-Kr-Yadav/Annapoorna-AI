import rateLimit from "express-rate-limit";

const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000; // 15 min
const MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100;

export const apiLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again in a few minutes.",
  },
});

// Stricter limiter for the more expensive AI endpoints.
export const aiLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: Math.max(10, Math.floor(MAX_REQUESTS / 3)),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many AI requests. Please wait a few minutes before trying again.",
  },
});
