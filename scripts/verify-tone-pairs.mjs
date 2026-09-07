import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/pages/index.astro", import.meta.url), "utf8");
const organization = readFileSync(new URL("../src/pages/organization.astro", import.meta.url), "utf8");
const header = readFileSync(new URL("../public/mb-components.js", import.meta.url), "utf8");

const checks = [
  {
    label: "homepage uses the selected warm paper editorial canvas",
    pattern: /--bg:\s*#F6F4EE;[\s\S]*--fg:\s*#181818;[\s\S]*--accent:\s*#6D63FF;[\s\S]*--mint:\s*#39B990;/,
    source,
  },
  {
    label: "homepage opts into the editorial shared chrome",
    pattern: /<mb-header active="home" tone="editorial">[\s\S]*<mb-footer tone="editorial"><\/mb-footer>/,
    source,
  },
  {
    label: "homepage hero keeps the Editorial Lab typography rather than the old split photo",
    pattern: /\.hero h1 \{[\s\S]*font-size: clamp\(64px, 8\.4vw, 118px\);[\s\S]*font-weight: 850;[\s\S]*letter-spacing: -\.075em;/,
    source,
  },
  {
    label: "homepage old studio photographs are removed from the new editorial composition",
    pattern: /^(?![\s\S]*(hero-desk\.jpg|cheotireum\.jpg))/,
    source,
  },
  {
    label: "legacy neon variables stay removed",
    pattern: /^(?![\s\S]*(--cyan|--magenta|tone-cyan|tone-magenta|#00e5ff|#ff00aa))/,
    source,
  },
  {
    label: "organization page intentionally keeps its existing Linear dark canvas",
    pattern: /--bg:\s*#08090A;[\s\S]*--accent:\s*#7170FF;[\s\S]*--cta-fg:\s*#08090A;/,
    source: organization,
  },
  {
    label: "shared default and studio palettes remain Linear dark for sibling pages",
    pattern: /const PALETTE = `[\s\S]*--mb-bg:#08090A;[\s\S]*const PALETTE_STUDIO = `[\s\S]*--mb-bg:#08090A;/,
    source: header,
  },
  {
    label: "shared component provides a dedicated editorial palette",
    pattern: /const PALETTE_EDITORIAL = `[\s\S]*--mb-bg:#F6F4EE;[\s\S]*--mb-fg:#181818;[\s\S]*--mb-accent:#6D63FF;/,
    source: header,
  },
  {
    label: "editorial tone remains light regardless of OS color scheme",
    pattern: /\['studio', 'editorial'\]\.includes\(el\.getAttribute\('tone'\)\) \? '' : DARK_RULE/,
    source: header,
  },
];

const failures = checks.filter((check) => !check.pattern.test(check.source));

if (failures.length > 0) {
  console.error("Tone pair verification failed:");
  for (const failure of failures) console.error(`- ${failure.label}`);
  process.exit(1);
}

console.log("Tone pair verification passed");
