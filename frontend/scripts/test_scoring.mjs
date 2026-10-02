import { clampScore, getScoreLabel } from '../src/utils/scoring.js';

const testCases = [
  { input: 0, expected: 'Poor' },
  { input: 25, expected: 'Poor' },
  { input: 39, expected: 'Poor' },
  { input: 40, expected: 'Fair' },
  { input: 59, expected: 'Fair' },
  { input: 60, expected: 'Moderate' },
  { input: 74, expected: 'Moderate' },
  { input: 75, expected: 'Good' },
  { input: 89, expected: 'Good' },
  { input: 90, expected: 'Excellent' },
  { input: 100, expected: 'Excellent' },
];

let failed = 0;
for (const tc of testCases) {
  const label = getScoreLabel(tc.input);
  if (label !== tc.expected) {
    console.error(`FAILED: ${tc.input} expected ${tc.expected}, got ${label}`);
    failed++;
  } else {
    console.log(`PASS: ${tc.input} -> ${label}`);
  }
}

// Edge cases
const invalidCases = [null, undefined, NaN, 'invalid', 'GOOD'];
for (const inv of invalidCases) {
  const clamped = clampScore(inv);
  const label = getScoreLabel(inv);
  if (clamped !== null || label !== '') {
    console.error(`FAILED invalid case: ${inv} -> clamped: ${clamped}, label: ${label}`);
    failed++;
  } else {
    console.log(`PASS invalid case: ${inv} -> safely returned null/empty`);
  }
}

// Over/Under clamp
if (clampScore(-10) !== 0 || clampScore(125) !== 100) {
  console.error('FAILED clamp bounds check');
  failed++;
} else {
  console.log('PASS clamp bounds check: -10 -> 0, 125 -> 100');
}

if (failed === 0) {
  console.log('\nALL SCORING TESTS PASSED PERFECTLY!');
} else {
  process.exit(1);
}
