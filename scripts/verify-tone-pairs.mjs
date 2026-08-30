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
    label: "Company page keeps bordered repeated cards",
    pattern: /\.product-card,[\s\S]*?\.tool-card \{[\s\S]*?border: 1px solid var\(--border\);[\s\S]*?background: var\(--bg\);/,
    source,
  },
  {
    label: "Connect list replaces old tone link cards",
    pattern: /class="connect-list"[\s\S]*links\.map/,
    source,
  },
  {
    label: "Legacy neon variables are removed",
    pattern: /^(?![\s\S]*(--cyan|--magenta|tone-cyan|tone-magenta))/,
    source,
  },
  {
    label: "Company page uses Linear dark chrome",
    pattern: /--bg:\s*#08090A;[\s\S]*--accent:\s*#7170FF;[\s\S]*--cta-fg:\s*#08090A;/,
    source,
  },
  {
    label: "Homepage hero uses a studio photograph",
    pattern: /src="\/studio\/hero-desk\.jpg"/,
    source,
  },
  {
    label: "Featured 첫이름 card uses a photograph",
    pattern: /src="\/studio\/cheotireum\.jpg"/,
    source,
  },
  {
    label: "Company page does not use old neon",
    pattern: /^(?![\s\S]*(#00e5ff|#00b8d4|#ff00aa|#4FE0C0))/,
    source,
  },
  {
    label: "Organization page uses the same Linear canvas as the homepage",
    pattern: /--bg:\s*#08090A;[\s\S]*--accent:\s*#7170FF;[\s\S]*--cta-fg:\s*#08090A;/,
    source: organization,
  },
  {
    label: "Organization page does not use old neon",
    pattern: /^(?![\s\S]*(#00e5ff|#00b8d4|#ff00aa|#4FE0C0))/,
    source: organization,
  },
  {
    label: "Shared header default palette is Linear chrome",
    pattern: /--mb-bg:#08090A;[\s\S]*--mb-fg:#F7F8F8;[\s\S]*--mb-accent:#7170FF;/,
    source: header,
  },
  {
    label: "Shared header studio palette matches Linear chrome",
    pattern: /PALETTE_STUDIO[\s\S]*--mb-bg:#08090A;[\s\S]*--mb-accent:#7170FF;/,
    source: header,
  },
  {
    label: "Company header opts into studio tone",
    pattern: /<mb-header active="home" tone="studio">/,
    source,
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
