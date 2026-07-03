import { Router } from "express";
import { successResponse } from "../utils/responseFormatter.js";

const router = Router();

router.get("/", (req, res) => {
  return successResponse(res, {
    status: "ok",
    uptimeSeconds: process.uptime(),
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
  }, "KrishiMitra AI backend is healthy.");
});

export default router;
