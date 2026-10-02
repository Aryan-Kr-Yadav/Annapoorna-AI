// Known canonical key alias mappings
export const KEY_ALIASES = {
  "crop.harvestsales": "crop.harvestSales",
  "crops.harvestsales": "crops.harvestSales",
  "crop.doctortitle": "crop.doctorTitle",
  "crops.doctortitle": "crops.doctorTitle",
  "cropdoctor.title": "cropDoctor.title",
  "auth.sign_in": "auth.login",
  "auth.sign_up": "auth.register",
  "auth.create_account": "auth.createAccount",
  "dash.no_farm": "dashboard.no_farm",
  "crops.harvest_sales": "crops.harvestSales",
};

/**
 * Format a raw technical key into a clean, human-readable UI label.
 * Ensures normal users NEVER see raw strings like "crop.doctortitle".
 */
export function formatKeyAsReadableFallback(key) {
  if (!key || typeof key !== "string") return "";

  const lower = key.toLowerCase();
  if (lower.includes("harvestsales") || lower.includes("harvest_sales")) return "Harvest & Sales";
  if (lower.includes("doctortitle") || lower.includes("cropdoctor")) return "Crop Doctor";
  if (lower.includes("auth.login") || lower.endsWith(".login")) return "Log In";
  if (lower.includes("auth.register") || lower.endsWith(".register")) return "Register";
  if (lower.includes("auth.signup") || lower.endsWith(".signup")) return "Create Account";
  if (lower.includes("activefarm")) return "Active Farm";
  if (lower.includes("activecrop")) return "Active Crop";

  // Take the last part of dot-separated key
  const parts = key.split(".");
  const target = parts[parts.length - 1];

  // Convert camelCase and snake_case to Title Case words
  const words = target
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .trim();

  return words.replace(/\b\w/g, (c) => c.toUpperCase()) || key;
}

export function getNestedValue(obj, path) {
  if (!obj || typeof obj !== "object") return undefined;
  const parts = path.split(".");
  let curr = obj;
  for (const part of parts) {
    if (curr === undefined || curr === null) return undefined;
    curr = curr[part];
  }
  return typeof curr === "string" ? curr : undefined;
}

/**
 * Robust key resolver: tries canonical key, mapped aliases, namespace alternates,
 * and camelCase / snake_case variants.
 */
export function resolveKeyInDict(dict, key) {
  if (!dict || !key) return undefined;

  // 1. Direct match
  let val = getNestedValue(dict, key);
  if (val !== undefined) return val;

  // 2. Canonical alias match
  const lowerKey = key.toLowerCase();
  const alias = KEY_ALIASES[lowerKey];
  if (alias) {
    val = getNestedValue(dict, alias);
    if (val !== undefined) return val;
  }

  // 3. Namespace alternates: crop <-> crops, farm <-> farms, dash <-> dashboard, doctor <-> cropDoctor
  const parts = key.split(".");
  if (parts.length === 2) {
    const [ns, prop] = parts;
    const alternates = [];

    if (ns === "crop") alternates.push(`crops.${prop}`);
    if (ns === "crops") alternates.push(`crop.${prop}`);
    if (ns === "farm") alternates.push(`farms.${prop}`);
    if (ns === "farms") alternates.push(`farm.${prop}`);
    if (ns === "dash") alternates.push(`dashboard.${prop}`);
    if (ns === "dashboard") alternates.push(`dash.${prop}`);
    if (ns === "doctor") alternates.push(`cropDoctor.${prop}`);
    if (ns === "cropDoctor") alternates.push(`doctor.${prop}`);

    for (const alt of alternates) {
      val = getNestedValue(dict, alt);
      if (val !== undefined) return val;
    }

    // 4. Try snake_case vs camelCase on property
    const snakeProp = prop.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase();
    const camelProp = prop.replace(/_([a-z])/g, (_, c) => c.toUpperCase());

    val = getNestedValue(dict, `${ns}.${snakeProp}`);
    if (val !== undefined) return val;

    val = getNestedValue(dict, `${ns}.${camelProp}`);
    if (val !== undefined) return val;
  }

  return undefined;
}
