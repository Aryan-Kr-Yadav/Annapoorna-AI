import { getRelevantSchemes, GeminiConfigError, GeminiResponseError } from "../services/geminiService.js";
import { successResponse, errorResponse } from "../utils/responseFormatter.js";
import { logger } from "../utils/logger.js";

export async function fetchSchemes(req, res) {
  try {
    const { state, crop, language } = req.validated;
    const schemes = await getRelevantSchemes({ state, crop, language });
    return successResponse(res, schemes, "Schemes fetched successfully.");
  } catch (err) {
    if (err instanceof GeminiConfigError) {
      logger.error("Gemini config error:", err.message);
      return errorResponse(res, "AI service is not configured correctly. Please contact support.", 500);
    }
    if (err instanceof GeminiResponseError) {
      logger.error("Gemini response error:", err.message);
      return errorResponse(res, "Could not fetch schemes right now. Please try again.", 502);
    }
    logger.error("Unexpected schemes error:", err);
    return errorResponse(res, "Failed to fetch government schemes. Please try again.", 500);
  }
}
