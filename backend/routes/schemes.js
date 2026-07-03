import { Router } from "express";
import { validateSchemesRequest } from "../middleware/validateRequest.js";
import { aiLimiter } from "../middleware/rateLimiter.js";
import { fetchSchemes } from "../controllers/schemesController.js";

const router = Router();

router.post("/", aiLimiter, validateSchemesRequest, fetchSchemes);

export default router;
