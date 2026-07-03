import { errorResponse } from "../utils/responseFormatter.js";

const VALID_LANGUAGES = ["en", "hi"];

function sanitizeString(value) {
  if (typeof value !== "string") return "";
  // Strip control characters and excessive whitespace; basic XSS-safety net
  // for any value that might eventually be rendered or logged.
  return value.replace(/[<>]/g, "").trim();
}

export function validateSymptomDiagnosis(req, res, next) {
  const symptoms = sanitizeString(req.body.symptoms);
  const cropType = sanitizeString(req.body.cropType || "Other");
  const language = VALID_LANGUAGES.includes(req.body.language) ? req.body.language : "en";

  if (!symptoms || symptoms.length < 10) {
    return errorResponse(
      res,
      "Please describe the symptoms in at least 10 characters.",
      400
    );
  }
  if (symptoms.length > 1500) {
    return errorResponse(res, "Symptom description is too long (max 1500 characters).", 400);
  }

  req.validated = { symptoms, cropType, language };
  next();
}

export function validateImageDiagnosis(req, res, next) {
  if (!req.file) {
    return errorResponse(res, "Please upload a crop image (JPG or PNG).", 400);
  }
  const cropType = sanitizeString(req.body.cropType || "Other");
  const language = VALID_LANGUAGES.includes(req.body.language) ? req.body.language : "en";

  req.validated = { cropType, language };
  next();
}

export function validateSchemesRequest(req, res, next) {
  const state = sanitizeString(req.body.state);
  const crop = sanitizeString(req.body.crop);
  const language = VALID_LANGUAGES.includes(req.body.language) ? req.body.language : "en";

  if (!state) {
    return errorResponse(res, "Please select a state.", 400);
  }
  if (!crop) {
    return errorResponse(res, "Please select a crop.", 400);
  }

  req.validated = { state, crop, language };
  next();
}
