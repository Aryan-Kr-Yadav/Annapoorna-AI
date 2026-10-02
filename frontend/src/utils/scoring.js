/**
 * Annapoorna AI Standardized Scoring System
 *
 * Classification Scale:
 *   0–39:   Poor
 *   40–59:  Fair
 *   60–74:  Moderate
 *   75–89:  Good
 *   90–100: Excellent
 */

/**
 * Safely parse and clamp numeric score to [0, 100].
 * Returns null for invalid values (null, undefined, NaN, empty strings, booleans, non-numeric).
 *
 * @param {any} value
 * @returns {number|null}
 */
export function clampScore(value) {
  if (value === null || value === undefined || value === "" || typeof value === "boolean") {
    return null;
  }
  const num = Number(value);
  if (isNaN(num) || !isFinite(num)) {
    return null;
  }
  return Math.max(0, Math.min(100, Math.round(num)));
}

/**
 * Standard Score Classification Helper.
 * Maps 0-100 score to standardized qualitative label.
 *
 * @param {any} score
 * @returns {string} "Poor" | "Fair" | "Moderate" | "Good" | "Excellent" | ""
 */
export function getScoreLabel(score) {
  const clamped = clampScore(score);
  if (clamped === null) return "";

  if (clamped <= 39) return "Poor";
  if (clamped <= 59) return "Fair";
  if (clamped <= 74) return "Moderate";
  if (clamped <= 89) return "Good";
  return "Excellent";
}

/**
 * Returns color classes and styling tokens for score tier.
 * Supports light & dark modes with high contrast.
 *
 * @param {any} score
 * @returns {{ badgeBg: string, badgeText: string, border: string, ring: string, accent: string }}
 */
export function getScoreStyles(score) {
  const clamped = clampScore(score);
  if (clamped === null) {
    return {
      badgeBg: "bg-stone-100 dark:bg-stone-800",
      badgeText: "text-stone-700 dark:text-stone-300",
      border: "border-stone-200 dark:border-stone-700",
      ring: "text-stone-400 dark:text-stone-500",
      accent: "text-stone-600 dark:text-stone-300",
    };
  }

  if (clamped <= 39) {
    return {
      badgeBg: "bg-rose-50 dark:bg-rose-950/60",
      badgeText: "text-rose-700 dark:text-rose-300",
      border: "border-rose-200 dark:border-rose-900/50",
      ring: "text-rose-500",
      accent: "text-rose-600 dark:text-rose-400",
    };
  }
  if (clamped <= 59) {
    return {
      badgeBg: "bg-amber-50 dark:bg-amber-950/60",
      badgeText: "text-amber-800 dark:text-amber-300",
      border: "border-amber-200 dark:border-amber-900/50",
      ring: "text-amber-500",
      accent: "text-amber-600 dark:text-amber-400",
    };
  }
  if (clamped <= 74) {
    return {
      badgeBg: "bg-yellow-50 dark:bg-yellow-950/50",
      badgeText: "text-yellow-800 dark:text-yellow-300",
      border: "border-yellow-200 dark:border-yellow-900/50",
      ring: "text-yellow-500",
      accent: "text-yellow-600 dark:text-yellow-400",
    };
  }
  if (clamped <= 89) {
    return {
      badgeBg: "bg-emerald-50 dark:bg-emerald-950/60",
      badgeText: "text-emerald-700 dark:text-emerald-300",
      border: "border-emerald-200 dark:border-emerald-900/50",
      ring: "text-emerald-500",
      accent: "text-emerald-600 dark:text-emerald-400",
    };
  }
  return {
    badgeBg: "bg-teal-50 dark:bg-teal-950/60",
    badgeText: "text-teal-700 dark:text-teal-300",
    border: "border-teal-200 dark:border-teal-900/50",
    ring: "text-teal-500",
    accent: "text-teal-600 dark:text-teal-400",
  };
}

/**
 * Deterministically compute Farming Operations Score from actual weather parameters
 * when only raw environmental data is available.
 *
 * @param {object} weatherData
 * @returns {number|null}
 */
export function calculateFarmingConditionScore(weatherData) {
  if (!weatherData) return null;

  const current = weatherData.current || weatherData;
  const forecast = weatherData.forecast?.[0] || weatherData.daily_forecast?.[0] || {};
  const temp = current.temperature !== undefined ? current.temperature : current.temperature_c;
  const wind = current.wind_speed !== undefined ? current.wind_speed : current.wind_speed_kmh;
  const humidity = current.humidity !== undefined ? current.humidity : current.humidity_percent;
  const rainProb = forecast.rain_probability !== undefined ? forecast.rain_probability : forecast.rain_probability_percent;

  if (temp === undefined && wind === undefined && humidity === undefined) {
    return null;
  }

  let penalties = 0.0;
  if (wind && wind > 12) {
    penalties += Math.min(25.0, (wind - 12) * 1.5);
  }
  if (rainProb && rainProb > 20) {
    penalties += Math.min(25.0, (rainProb - 20) * 0.4);
  }
  if (temp !== undefined) {
    if (temp > 30) {
      penalties += Math.min(25.0, (temp - 30) * 2.0);
    } else if (temp < 16) {
      penalties += Math.min(20.0, (16 - temp) * 2.0);
    }
  }
  if (humidity !== undefined) {
    if (humidity > 70) {
      penalties += Math.min(15.0, (humidity - 70) * 0.4);
    } else if (humidity < 30) {
      penalties += Math.min(10.0, (30 - humidity) * 0.3);
    }
  }

  return Math.max(15, Math.min(98, Math.round(100.0 - penalties)));
}
