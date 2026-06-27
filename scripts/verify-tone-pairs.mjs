import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/pages/index.astro", import.meta.url), "utf8");

const checks = [
  {
    label: "Memoyo app card uses cyan tone",
    pattern: /{\s*name:\s*"메모요",\s*desc:[^}]*?accent:\s*"cyan",\s*platforms:/,
  },
  {
    label: "Hanjul app card uses magenta tone",
    pattern: /{\s*name:\s*"한줄일기",\s*desc:[^}]*?accent:\s*"magenta",\s*platforms:/,
  },
  {
    label: "Worklog link card uses cyan tone",
    pattern: /class="link-card tone-cyan"[\s\S]*?<h3 class="accent-cyan">작업 일지<\/h3>/,
  },
  {
    label: "Newsletter link card uses magenta tone",
    pattern: /class="link-card tone-magenta"[\s\S]*?<h3 class="accent-magenta">뉴스레터<\/h3>/,
  },
  {
    label: "Tone-specific card hover styles exist",
    pattern: /\.tone-cyan:hover[\s\S]*?var\(--cyan\)[\s\S]*?\.tone-magenta:hover[\s\S]*?var\(--magenta\)/,
  },
];

const failures = checks.filter((check) => !check.pattern.test(source));

if (failures.length > 0) {
  console.error("Tone pair verification failed:");
  for (const failure of failures) {
    console.error(`- ${failure.label}`);
  }
  process.exit(1);
}

console.log("Tone pair verification passed");
