import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/pages/index.astro", import.meta.url), "utf8");
const header = readFileSync(new URL("../public/mb-components.js", import.meta.url), "utf8");

const checks = [
  {
    label: "Memoyo app card keeps first tone mapping",
    pattern: /{\s*name:\s*"메모요",\s*desc:[^}]*?accent:\s*"cyan",\s*platforms:/,
    source,
  },
  {
    label: "Hanjul app card keeps second tone mapping",
    pattern: /{\s*name:\s*"한줄일기",\s*desc:[^}]*?accent:\s*"magenta",\s*platforms:/,
    source,
  },
  {
    label: "Worklog link card keeps first tone class",
    pattern: /class="link-card tone-cyan"[\s\S]*?<h3 class="accent-cyan">작업장<\/h3>/,
    source,
  },
  {
    label: "Newsletter link card keeps second tone class",
    pattern: /class="link-card tone-magenta"[\s\S]*?<h3 class="accent-magenta">뉴스레터<\/h3>/,
    source,
  },
  {
    label: "Legacy tone variables are mapped to monochrome values",
    pattern: /--cyan:\s*#111111;[\s\S]*--magenta:\s*#555555;/,
    source,
  },
  {
    label: "CTA accent is the only saturated color",
    pattern: /--accent:\s*#2563eb;[\s\S]*--accent-dim:\s*#1748b8;/,
    source,
  },
  {
    label: "Company page does not use old neon palette",
    pattern: /^(?![\s\S]*(#00e5ff|#00b8d4|#ff00aa))/,
    source,
  },
  {
    label: "Shared header uses the same bright monochrome palette",
    pattern: /--mb-bg:#ffffff;[\s\S]*--mb-fg:#111111;[\s\S]*--mb-accent:#2563eb;/,
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
