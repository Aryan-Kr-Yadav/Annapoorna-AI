import {
  diagnoseFromImage,
  diagnoseFromSymptoms,
  GeminiConfigError,
  GeminiResponseError,
} from "../services/geminiService.js";
import { successResponse, errorResponse } from "../utils/responseFormatter.js";
import { logger } from "../utils/logger.js";

function handleGeminiError(err, res) {
  if (err instanceof GeminiConfigError) {
    logger.error("Gemini config error:", err.message);
    return errorResponse(res, "AI service is not configured correctly. Please contact support.", 500);
  }
  if (err instanceof GeminiResponseError) {
    logger.error("Gemini response error:", err.message);
    return errorResponse(
      res,
      "The AI couldn't generate a clear diagnosis. Please try again or use a clearer image.",
      502
    );
  }
  logger.error("Unexpected diagnosis error:", err);
  return errorResponse(res, "Diagnosis failed. Please try again in a moment.", 500);
}

export async function diagnoseImage(req, res) {
  try {
    const { cropType, language } = req.validated;
    const diagnosis = await diagnoseFromImage(req.file.buffer, req.file.mimetype, {
      cropType,
      language,
    });
    return successResponse(res, diagnosis, "Image diagnosis completed.");
  } catch (err) {
    return handleGeminiError(err, res);
  }
}

export async function diagnoseSymptoms(req, res) {
  try {
    const { symptoms, cropType, language } = req.validated;
    const diagnosis = await diagnoseFromSymptoms({ symptoms, cropType, language });
    return successResponse(res, diagnosis, "Symptom diagnosis completed.");
  } catch (err) {
    return handleGeminiError(err, res);
  }
}
