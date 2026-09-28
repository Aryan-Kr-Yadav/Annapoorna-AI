import { GoogleGenerativeAI } from "@google/generative-ai";
import { logger } from "../utils/logger.js";
import {
  buildImageDiagnosisPrompt,
  buildSymptomDiagnosisPrompt,
  buildSchemesPrompt,
} from "../utils/promptTemplates.js";

<<<<<<< HEAD
const VISION_MODEL = process.env.GEMINI_VISION_MODEL || "gemini-2.5-flash";
const TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || "gemini-2.5-flash";
=======
const VISION_MODEL = process.env.GEMINI_VISION_MODEL || "gemini-1.5-flash";
const TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || "gemini-1.5-pro";
>>>>>>> 9e410e3c5af15cbca7742a89f0c13ba24273c338

let genAI = null;

function isGeminiConfigured() {
  return Boolean(process.env.GEMINI_API_KEY);
}

<<<<<<< HEAD
=======
function normalizeText(value = "") {
  return String(value).trim().toLowerCase();
}

function splitSymptomsText(symptoms = "") {
  return String(symptoms)
    .split(/[.\n,;]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 5);
}

function buildDemoDiagnosis(options = {}, source = "symptoms") {
  const cropType = options.cropType || "Other";
  const crop = normalizeText(cropType);
  const symptoms = normalizeText(options.symptoms);

  let diseaseName = "Nutrient Deficiency";
  let severity = "Low";
  let confidencePercentage = 72;
  let isHealthy = false;
  let organic = ["Improve soil nutrition with compost or well-rotted manure."];
  let chemical = ["Use a balanced fertilizer only after confirming a deficiency."];
  let preventiveMeasures = ["Rotate crops regularly.", "Keep the field well-drained."];
  let immediateNextSteps = ["Inspect more leaves across the field.", "Track whether symptoms spread over the next few days."];
  let consultExpertIf = "Symptoms spread quickly or affect a large part of the field.";
  let limitations = "Demo mode is active because GEMINI_API_KEY is not configured.";

  if (crop.includes("tomato")) {
    diseaseName = source === "image" ? "Early Blight" : "Leaf Spot Disease";
    severity = "Medium";
    confidencePercentage = 86;
    organic = [
      "Remove the most affected leaves and dispose of them safely.",
      "Apply neem oil or a copper-based organic spray.",
    ];
    chemical = [
      "Use a copper-based fungicide as directed on the label.",
      "Avoid spraying during hot midday hours.",
    ];
    preventiveMeasures = ["Avoid overhead watering.", "Improve airflow between plants."];
    immediateNextSteps = ["Check nearby plants for similar spotting.", "Reduce leaf wetness by watering early in the day."];
    consultExpertIf = "The spots keep expanding after treatment or fruits begin to rot.";
  } else if (crop.includes("rice")) {
    diseaseName = symptoms.includes("blast") ? "Rice Blast" : "Bacterial Leaf Blight";
    severity = "Medium";
    confidencePercentage = 84;
    organic = ["Remove badly affected leaves where practical.", "Maintain proper spacing and drainage in the plot."];
    chemical = ["Use a recommended rice fungicide or bactericide after local guidance."];
    preventiveMeasures = ["Avoid excess nitrogen.", "Keep field sanitation strong."];
    immediateNextSteps = ["Compare symptoms across the whole paddy.", "Ask a local agronomist to confirm the disease."];
    consultExpertIf = "You see rapid spread, white heads, or lodging in the crop.";
  } else if (crop.includes("wheat")) {
    diseaseName = symptoms.includes("rust") ? "Rust Disease" : "Leaf Rust";
    severity = "Medium";
    confidencePercentage = 83;
    organic = ["Remove volunteer wheat and nearby grassy hosts.", "Use balanced irrigation and avoid overcrowding."];
    chemical = ["Use a registered fungicide for wheat rust as per label instructions."];
    preventiveMeasures = ["Plant resistant varieties when available.", "Monitor the crop during cool, humid weather."];
    immediateNextSteps = ["Check lower and upper leaves for orange or brown pustules.", "Isolate the affected patch if possible."];
    consultExpertIf = "More than a small patch is affected or the rust is moving quickly.";
  } else if (crop.includes("potato")) {
    diseaseName = symptoms.includes("blight") ? "Late Blight" : "Early Blight";
    severity = "High";
    confidencePercentage = 88;
    organic = ["Remove infected foliage and keep the bed dry.", "Use clean seed tubers for the next planting cycle."];
    chemical = ["Apply a potato fungicide suitable for blight control according to the label."];
    preventiveMeasures = ["Avoid overhead irrigation.", "Rotate away from potato and tomato crops."];
    immediateNextSteps = ["Check tubers and lower leaves for dark lesions.", "Act quickly if rain or humidity is high."];
    consultExpertIf = "Tubers are showing lesions or the field is losing foliage rapidly.";
  } else if (crop.includes("cotton")) {
    diseaseName = symptoms.includes("curl") ? "Leaf Curl Virus" : "Aphid or Sucking Pest Damage";
    severity = "Medium";
    confidencePercentage = 82;
    organic = ["Inspect the underside of leaves for pests.", "Use yellow sticky traps and remove heavily infested shoots."];
    chemical = ["Use an approved control only after local recommendation."];
    preventiveMeasures = ["Control weeds around the field.", "Monitor pests early in the season."];
    immediateNextSteps = ["Check if the damage is from pests rather than disease.", "Inspect adjacent plants for spread."];
    consultExpertIf = "Curling, yellowing, or pest activity is worsening across the field.";
  } else if (crop.includes("sugarcane")) {
    diseaseName = symptoms.includes("red") ? "Red Rot" : "Top Shoot Borer Stress";
    severity = "High";
    confidencePercentage = 81;
    organic = ["Remove infected clumps and keep the area clean.", "Use healthy setts for planting."];
    chemical = ["Use a locally recommended treatment based on the exact symptom pattern."];
    preventiveMeasures = ["Choose resistant varieties where available.", "Avoid water stress and poor drainage."];
    immediateNextSteps = ["Inspect the stalk interior if red discoloration is suspected.", "Seek local guidance before replanting the affected patch."];
    consultExpertIf = "Canes show internal discoloration, odor, or the patch is expanding.";
  }

  if (symptoms.includes("healthy") || symptoms.includes("fine") || symptoms.includes("normal")) {
    diseaseName = "Healthy Crop";
    severity = "Low";
    confidencePercentage = 95;
    isHealthy = true;
    organic = ["Continue normal crop care and regular monitoring."];
    chemical = [];
    preventiveMeasures = ["Keep monitoring for early signs of stress.", "Maintain balanced watering and nutrition."];
    immediateNextSteps = ["Keep inspecting leaves every few days.", "Do not spray chemicals unless symptoms appear."];
    consultExpertIf = "New symptoms appear or growth slows unexpectedly.";
    limitations = "Demo mode is active because GEMINI_API_KEY is not configured.";
  }

  return {
    diseaseName,
    confidencePercentage,
    severity,
    symptoms: splitSymptomsText(options.symptoms) || ["Visible crop stress symptoms were reported in demo mode."],
    treatment: {
      organic,
      chemical,
    },
    preventiveMeasures,
    immediateNextSteps,
    consultExpertIf,
    limitations,
    isHealthy,
  };
}

function buildDemoSchemes(options = {}) {
  const state = options.state || "your state";
  const crop = options.crop || "your crop";

  return {
    schemes: [
      {
        schemeName: "PM-KISAN",
        description: `Direct income support for eligible farmers in ${state}.`,
        eligibility: ["Small and marginal farmers", "Valid land records"],
        benefits: ["Income support paid in installments", "Nationwide scheme coverage"],
        requiredDocuments: ["Aadhaar", "Land ownership records", "Bank account details"],
        officialWebsite: "https://pmkisan.gov.in",
        applicationProcess: "Apply through the official portal or your local agriculture office.",
      },
      {
        schemeName: "PM Fasal Bima Yojana",
        description: `Crop insurance support for ${crop} growers facing weather or pest losses.`,
        eligibility: ["Enrolled farmers", "Notified crop and area coverage"],
        benefits: ["Financial protection after crop loss", "Lower risk from adverse weather"],
        requiredDocuments: ["Aadhaar", "Land records", "Bank passbook"],
        officialWebsite: "https://pmfby.gov.in",
        applicationProcess: "Enroll during the notified window through approved channels.",
      },
      {
        schemeName: "Kisan Credit Card",
        description: "Low-cost credit support for cultivation and allied farm needs.",
        eligibility: ["Active farmers", "Basic KYC and land proof"],
        benefits: ["Flexible working capital", "Simplified access to farm credit"],
        requiredDocuments: ["Identity proof", "Address proof", "Land records"],
        officialWebsite: "https://www.myscheme.gov.in/schemes/kisan-credit-card-kcc",
        applicationProcess: "Request a KCC at your bank or cooperative institution.",
      },
    ],
  };
}

>>>>>>> 9e410e3c5af15cbca7742a89f0c13ba24273c338
function getClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw new GeminiConfigError(
      "GEMINI_API_KEY is not set. Add it to backend/.env (see .env.example)."
    );
  }
  if (!genAI) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
}

export class GeminiConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = "GeminiConfigError";
    this.statusCode = 500;
  }
}

export class GeminiResponseError extends Error {
  constructor(message, raw) {
    super(message);
    this.name = "GeminiResponseError";
    this.statusCode = 502;
    this.raw = raw;
  }
}

/**
 * Gemini sometimes wraps JSON in ```json fences or adds stray whitespace.
 * This strips that and parses safely, throwing a typed error on failure.
 */
function parseJsonResponse(rawText) {
  if (!rawText) {
    throw new GeminiResponseError("Empty response from Gemini", rawText);
  }

  let cleaned = rawText.trim();
  cleaned = cleaned.replace(/^```json\s*/i, "").replace(/^```\s*/i, "");
  cleaned = cleaned.replace(/```\s*$/i, "");

  // In case the model added any preamble/epilogue text, extract the
  // outermost JSON object as a fallback.
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    logger.error("Failed to parse Gemini JSON response:", err.message);
    throw new GeminiResponseError("Gemini returned an unparseable response", rawText);
  }
}

const GENERATION_CONFIG = {
  temperature: 0.4,
  topP: 0.9,
  maxOutputTokens: 2048,
<<<<<<< HEAD
  responseMimeType: "application/json",
=======
>>>>>>> 9e410e3c5af15cbca7742a89f0c13ba24273c338
};

/**
 * Diagnose a crop disease from an uploaded image buffer.
 * @param {Buffer} imageBuffer
 * @param {string} mimeType e.g. "image/jpeg"
 * @param {{ cropType?: string, language?: string }} options
 */
export async function diagnoseFromImage(imageBuffer, mimeType, options = {}) {
<<<<<<< HEAD
=======
  if (!isGeminiConfigured()) {
    return buildDemoDiagnosis(options, "image");
  }

>>>>>>> 9e410e3c5af15cbca7742a89f0c13ba24273c338
  const client = getClient();
  const model = client.getGenerativeModel({
    model: VISION_MODEL,
    generationConfig: GENERATION_CONFIG,
  });

  const prompt = buildImageDiagnosisPrompt(options);

  const result = await model.generateContent([
    { text: prompt },
    {
      inlineData: {
        data: imageBuffer.toString("base64"),
        mimeType,
      },
    },
  ]);

  const text = result.response.text();
  return parseJsonResponse(text);
}

/**
 * Diagnose a crop disease from a farmer's text description of symptoms.
 * @param {{ symptoms: string, cropType?: string, language?: string }} options
 */
export async function diagnoseFromSymptoms(options = {}) {
<<<<<<< HEAD
=======
  if (!isGeminiConfigured()) {
    return buildDemoDiagnosis(options, "symptoms");
  }

>>>>>>> 9e410e3c5af15cbca7742a89f0c13ba24273c338
  const client = getClient();
  const model = client.getGenerativeModel({
    model: TEXT_MODEL,
    generationConfig: GENERATION_CONFIG,
  });

  const prompt = buildSymptomDiagnosisPrompt(options);
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  return parseJsonResponse(text);
}

/**
 * Look up relevant Indian government agricultural schemes.
 * @param {{ state: string, crop: string, language?: string }} options
 */
export async function getRelevantSchemes(options = {}) {
<<<<<<< HEAD
=======
  if (!isGeminiConfigured()) {
    return buildDemoSchemes(options);
  }

>>>>>>> 9e410e3c5af15cbca7742a89f0c13ba24273c338
  const client = getClient();
  const model = client.getGenerativeModel({
    model: TEXT_MODEL,
    generationConfig: { ...GENERATION_CONFIG, maxOutputTokens: 3072 },
  });

  const prompt = buildSchemesPrompt(options);
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  return parseJsonResponse(text);
}
