import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { en } from '../src/locales/en.js';
import { hi } from '../src/locales/hi.js';
import { resolveKeyInDict } from '../src/utils/i18n.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function findTranslationCallSites(dir) {
  const files = fs.readdirSync(dir);
  const results = [];
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results.push(...findTranslationCallSites(fullPath));
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      // Match t("key") or t('key') or t(`key`)
      const regex = /\bt\(\s*["'`]([^"'`]+)["'`]/g;
      let match;
      while ((match = regex.exec(content)) !== null) {
        const key = match[1];
        // Only include keys that look like translation keys (contains a dot or matches known namespaces)
        if (key.includes('.') || ['login', 'signup', 'dashboard', 'weather'].includes(key)) {
          results.push({ file: fullPath.replace(/.*src[\\\/]/, 'src/'), key });
        }
      }
    }
  }
  return results;
}

const calls = findTranslationCallSites(path.join(__dirname, '../src'));
const uniqueKeys = [...new Set(calls.map(c => c.key))];

console.log('Total translation call sites:', calls.length);
console.log('Unique translation keys:', uniqueKeys.length);

const missingInEn = [];
const missingInHi = [];

for (const key of uniqueKeys) {
  if (resolveKeyInDict(en, key) === undefined) {
    const callers = calls.filter(c => c.key === key).map(c => c.file);
    missingInEn.push({ key, callers: [...new Set(callers)] });
  }
  if (resolveKeyInDict(hi, key) === undefined) {
    const callers = calls.filter(c => c.key === key).map(c => c.file);
    missingInHi.push({ key, callers: [...new Set(callers)] });
  }
}

console.log('\n--- MISSING IN EN.JS: ' + missingInEn.length);
if (missingInEn.length > 0) console.log(JSON.stringify(missingInEn, null, 2));

console.log('\n--- MISSING IN HI.JS: ' + missingInHi.length);
if (missingInHi.length > 0) console.log(JSON.stringify(missingInHi, null, 2));

if (missingInEn.length === 0 && missingInHi.length === 0) {
  console.log('\n🎉 ALL TRANSLATION KEYS RESOLVE 100% IN BOTH ENGLISH AND HINDI!');
}
