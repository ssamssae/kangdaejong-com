import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/pages/index.astro", import.meta.url), "utf8");
const organization = readFileSync(new URL("../src/pages/organization.astro", import.meta.url), "utf8");
const header = readFileSync(new URL("../public/mb-components.js", import.meta.url), "utf8");

const checks = [
  {
    label: "Product list includes Memoyo live app",
    pattern: /name:\s*"메모요",[\s\S]*?status:\s*"iOS · Android LIVE"/,
    source,
  },
  {
    label: "Product list includes Hanjul live app",
    pattern: /name:\s*"한줄일기",[\s\S]*?status:\s*"iOS · Android LIVE"/,
    source,
  },
  {
    label: "Company page keeps monochrome repeated cards",
    pattern: /\.product-card,[\s\S]*?\.tool-card \{[\s\S]*?border: 1px solid var\(--border\);[\s\S]*?background: var\(--bg\);/,
    source,
  },
  {
    label: "Connect list replaces old tone link cards",
    pattern: /class="connect-list"[\s\S]*links\.map/,
    source,
  },
  {
    label: "Legacy tone variables are removed",
    pattern: /^(?![\s\S]*(--cyan|--magenta|tone-cyan|tone-magenta))/,
    source,
  },
  {
    label: "Company page uses grok canvas and inverted CTA",
    pattern: /--bg:\s*#000000;[\s\S]*--accent:\s*#f2f2f2;[\s\S]*--cta-fg:\s*#000000;/,
    source,
  },
  {
    label: "Company page does not use old neon or editorial blue",
    pattern: /^(?![\s\S]*(#00e5ff|#00b8d4|#ff00aa|#2563eb|#7aa2ff|#4FE0C0))/,
    source,
  },
  {
    label: "Organization page uses the same grok canvas as the homepage",
    pattern: /--bg:\s*#000000;[\s\S]*--accent:\s*#f2f2f2;[\s\S]*--cta-fg:\s*#000000;/,
    source: organization,
  },
  {
    label: "Organization page does not use old neon or editorial blue",
    pattern: /^(?![\s\S]*(#00e5ff|#00b8d4|#ff00aa|#2563eb|#7aa2ff|#4FE0C0))/,
    source: organization,
  },
  {
    label: "Shared header uses the same grok palette",
    pattern: /--mb-bg:#000000;[\s\S]*--mb-fg:#f2f2f2;[\s\S]*--mb-accent:#f2f2f2;/,
    source: header,
  },
];

const failures = checks.filter((check) => !check.pattern.test(check.source));

if (failures.length > 0) {
  console.error("Tone pair verification failed:");
  for (const failure of failures) {
    console.error(`- ${failure.label}`);
  }
  process.exit(1);
}

console.log("Tone pair verification passed");
