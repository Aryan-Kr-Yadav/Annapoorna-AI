import React from 'react';
import { renderToString } from 'react-dom/server';
import MarkdownMessage from '../src/components/common/MarkdownMessage.jsx';

const sampleMarkdown = `### Irrigation Recommendation

**Recommendation:** Delay irrigation.

- Rain expected tonight
- Soil is currently moist

| Factor | Status |
|---|---|
| Rain | Likely |
| Irrigation | Delay |

\\[
ET_c = ET_0 \\times K_c
\\]
`;

console.log("Testing MarkdownMessage renderToString...");
const html = renderToString(React.createElement(MarkdownMessage, { content: sampleMarkdown }));

console.log("\n--- Generated HTML ---");
console.log(html);

let passed = true;

// Verify headings rendered as HTML tags (not raw ###)
if (html.includes('<h2') || html.includes('<h3') || html.includes('<h4')) {
  console.log("PASS: Heading rendered as HTML tag.");
} else {
  console.error("FAIL: Heading was not rendered as HTML tag!");
  passed = false;
}

// Verify bold rendered as <strong> (not raw **)
if (html.includes('<strong>Recommendation:</strong>')) {
  console.log("PASS: Bold rendered as <strong> tag.");
} else {
  console.error("FAIL: Bold was not rendered as <strong> tag!");
  passed = false;
}

// Verify list rendered as <ul> and <li>
if (html.includes('<ul') && html.includes('<li')) {
  console.log("PASS: List rendered as <ul> and <li> tags.");
} else {
  console.error("FAIL: List was not rendered!");
  passed = false;
}

// Verify table rendered as <table>, <thead>, <tbody>, <th>, <td>
if (html.includes('<table') && html.includes('<th') && html.includes('<td')) {
  console.log("PASS: Table rendered as <table> with <th> and <td> tags.");
} else {
  console.error("FAIL: Table was not rendered!");
  passed = false;
}

// Verify raw formula brackets \[ \] are NOT present
if (!html.includes('\\[') && !html.includes('\\]')) {
  console.log("PASS: Raw formula escaped brackets are cleaned.");
} else {
  console.error("FAIL: Raw formula escaped brackets leaked into HTML!");
  passed = false;
}

// Verify no raw markdown syntax tokens leaked as text
if (!html.includes('###') && !html.includes('|---|---|')) {
  console.log("PASS: No raw markdown symbols leaked into output.");
} else {
  console.error("FAIL: Raw markdown symbols found in HTML!");
  passed = false;
}

if (!passed) {
  process.exit(1);
} else {
  console.log("\nALL MARKDOWN RENDERING TESTS PASSED SUCCESSFULLY!");
}
