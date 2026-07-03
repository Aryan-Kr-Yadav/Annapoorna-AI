import { GoogleGenerativeAI } from "@google/generative-ai";
import { logger } from "../utils/logger.js";
import {
  buildImageDiagnosisPrompt,
  buildSymptomDiagnosisPrompt,
  buildSchemesPrompt,
} from "../utils/promptTemplates.js";

const VISION_MODEL = process.env.GEMINI_VISION_MODEL || "gemini-2.5-flash";
const TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || "gemini-2.5-flash";

let genAI = null;

function isGeminiConfigured() {
  return Boolean(process.env.GEMINI_API_KEY);
}

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
  responseMimeType: "application/json",
};

/**
 * Diagnose a crop disease from an uploaded image buffer.
 * @param {Buffer} imageBuffer
 * @param {string} mimeType e.g. "image/jpeg"
 * @param {{ cropType?: string, language?: string }} options
 */
export async function diagnoseFromImage(imageBuffer, mimeType, options = {}) {
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
