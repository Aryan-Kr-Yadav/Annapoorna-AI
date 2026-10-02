import { en } from '../src/locales/en.js';
import { hi } from '../src/locales/hi.js';
import {
  formatKeyAsReadableFallback,
  resolveKeyInDict,
} from '../src/utils/i18n.js';

function simulateT(dict, lang, key, fallback = "") {
  let val = resolveKeyInDict(dict, key);
  if (val !== undefined) return val;
  if (lang !== "en") {
    val = resolveKeyInDict(en, key);
    if (val !== undefined) return val;
  }
  if (fallback && fallback.trim() !== "") return fallback;
  return formatKeyAsReadableFallback(key);
}

// Test cases from User Prompt
const testCases = [
  { key: "crop.harvestsales", expectedEn: "Harvest & Sales", expectedHi: "कटाई व बिक्री" },
  { key: "crop.doctortitle", expectedEn: "Crop Doctor", expectedHi: "क्रॉप डॉक्टर" },
  { key: "auth.login", expectedEn: "Log In", expectedHi: "लॉग इन" },
  { key: "auth.register", expectedEn: "Register", expectedHi: "पंजीकरण" },
  { key: "auth.signup", expectedEn: "Create Account", expectedHi: "खाता बनाएं" },
  { key: "cropDoctor.title", expectedEn: "Crop Doctor", expectedHi: "क्रॉप डॉक्टर" },
  { key: "crops.harvestSales", expectedEn: "Harvest & Sales", expectedHi: "कटाई व बिक्री" },
  { key: "cropPlanner.title", expectedEn: "Crop Planner", expectedHi: "फसल योजना" },
  { key: "dashboard.title", expectedEn: "Farm Dashboard", expectedHi: "कृषि डैशबोर्ड" },
  { key: "weather.operationsScore", expectedEn: "Farming Operations Score", expectedHi: "कृषि परिचालन स्कोर" },
  { key: "analytics.profit", expectedEn: "Net Profit / Loss", expectedHi: "शुद्ध लाभ / हानि" },
  { key: "soil.addTest", expectedEn: "Add Soil Test", expectedHi: "मिट्टी परीक्षण जोड़ें" },
  { key: "tasks.title", expectedEn: "Farm & Crop Tasks", expectedHi: "खेत एवं फसल कार्य" },
  { key: "settings.title", expectedEn: "Settings & Preferences", expectedHi: "सेटिंग्स एवं प्राथमिकताएं" },
  { key: "notifications.title", expectedEn: "Agricultural Alerts & Notifications", expectedHi: "कृषि अलर्ट एवं सूचनाएं" },
];

let failed = 0;

console.log("=== TESTING ENGLISH TRANSLATIONS ===");
for (const tc of testCases) {
  const result = simulateT(en, "en", tc.key);
  if (result !== tc.expectedEn) {
    console.error(`FAILED EN: [${tc.key}] Expected "${tc.expectedEn}", got "${result}"`);
    failed++;
  } else {
    console.log(`PASS EN: [${tc.key}] -> "${result}"`);
  }
}

console.log("\n=== TESTING HINDI TRANSLATIONS ===");
for (const tc of testCases) {
  const result = simulateT(hi, "hi", tc.key);
  if (result !== tc.expectedHi) {
    console.error(`FAILED HI: [${tc.key}] Expected "${tc.expectedHi}", got "${result}"`);
    failed++;
  } else {
    console.log(`PASS HI: [${tc.key}] -> "${result}"`);
  }
}

console.log("\n=== TESTING SAFE FALLBACK FOR UNKNOWN KEYS ===");
const unknownTests = [
  { key: "someUnknown.customTitle", expected: "Custom Title" },
  { key: "crops.someNewProperty", expected: "Some New Property" },
  { key: "untranslatedKey", expected: "Untranslated Key" },
];
for (const tc of unknownTests) {
  const result = simulateT(en, "en", tc.key);
  if (result.includes(".")) {
    console.error(`FAILED FALLBACK: [${tc.key}] Returned raw key with dot: "${result}"`);
    failed++;
  } else if (result !== tc.expected) {
    console.error(`FAILED FALLBACK: [${tc.key}] Expected "${tc.expected}", got "${result}"`);
    failed++;
  } else {
    console.log(`PASS FALLBACK: [${tc.key}] -> "${result}"`);
  }
}

if (failed === 0) {
  console.log("\nALL I18N AND FALLBACK TESTS PASSED PERFECTLY!");
} else {
  console.error(`\n${failed} test(s) failed.`);
  process.exit(1);
}
