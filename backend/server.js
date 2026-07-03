import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";

import diagnoseRoutes from "./routes/diagnose.js";
import schemesRoutes from "./routes/schemes.js";
import healthRoutes from "./routes/health.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { apiLimiter } from "./middleware/rateLimiter.js";
import { logger } from "./utils/logger.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security headers
app.use(helmet());

// CORS — supports a comma-separated list of allowed origins in FRONTEND_URL
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, mobile apps, health checks)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// General rate limiting across all /api routes
app.use("/api", apiLimiter);

// Routes
app.use("/api/health", healthRoutes);
app.use("/api/diagnose", diagnoseRoutes);
app.use("/api/schemes", schemesRoutes);

app.get("/", (req, res) => {
  res.json({
    name: "KrishiMitra AI API",
    status: "running",
    docs: "/api/health",
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`KrishiMitra AI backend running on port ${PORT}`);
  logger.info(`Allowed CORS origins: ${allowedOrigins.join(", ")}`);
  if (!process.env.GEMINI_API_KEY) {
    logger.warn("GEMINI_API_KEY is not set! AI endpoints will fail until you add it to .env");
  }
});

export default app;
