import { Router } from "express";
import { uploadImage } from "../middleware/upload.js";
import { validateImageDiagnosis, validateSymptomDiagnosis } from "../middleware/validateRequest.js";
import { aiLimiter } from "../middleware/rateLimiter.js";
import { diagnoseImage, diagnoseSymptoms } from "../controllers/diagnoseController.js";

const router = Router();

router.post(
  "/image",
  aiLimiter,
  uploadImage.single("image"),
  validateImageDiagnosis,
  diagnoseImage
);

router.post("/symptoms", aiLimiter, validateSymptomDiagnosis, diagnoseSymptoms);

export default router;
