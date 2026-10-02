const fs = require('fs');
const path = require('path');

// Read locales/en.js and locales/hi.js
function parseModuleExports(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  // Simple extraction by evaluating cleaned JS
  const cleaned = content.replace(/export const (en|hi) =/, 'module.exports =').replace(/export default.*;/, '');
  const tmpFile = path.join(__dirname, 'tmp_' + path.basename(filePath));
  fs.writeFileSync(tmpFile, cleaned);
  delete require.cache[require.resolve(tmpFile)];
  const mod = require(tmpFile);
  fs.unlinkSync(tmpFile);
  return mod;
}

const en = parseModuleExports(path.join(__dirname, '../src/locales/en.js'));
const hi = parseModuleExports(path.join(__dirname, '../src/locales/hi.js'));

function getNested(obj, pathStr) {
  const parts = pathStr.split('.');
  let curr = obj;
  for (const p of parts) {
    if (curr === undefined || curr === null) return undefined;
    curr = curr[p];
  }
  return typeof curr === 'string' ? curr : undefined;
}

function findTCalls(dir) {
  const files = fs.readdirSync(dir);
  const results = [];
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results.push(...findTCalls(fullPath));
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const regex = /t\(\s*["']([^"']+)["']/g;
      let match;
      while ((match = regex.exec(content)) !== null) {
        results.push({ file: fullPath.replace(/.*src[\\\/]/, 'src/'), key: match[1] });
      }
    }
  }
  return results;
}

const calls = findTCalls(path.join(__dirname, '../src'));
const uniqueKeys = [...new Set(calls.map(c => c.key))];

console.log('Total t() call sites:', calls.length);
console.log('Unique keys called:', uniqueKeys.length);

const missingInEn = [];
const missingInHi = [];

for (const key of uniqueKeys) {
  if (getNested(en, key) === undefined) {
    const callers = calls.filter(c => c.key === key).map(c => c.file);
    missingInEn.push({ key, callers: [...new Set(callers)] });
  }
  if (getNested(hi, key) === undefined) {
    const callers = calls.filter(c => c.key === key).map(c => c.file);
    missingInHi.push({ key, callers: [...new Set(callers)] });
  }
}

console.log('\n--- MISSING IN EN.JS ---');
console.log(JSON.stringify(missingInEn, null, 2));

console.log('\n--- MISSING IN HI.JS ---');
console.log(JSON.stringify(missingInHi, null, 2));
