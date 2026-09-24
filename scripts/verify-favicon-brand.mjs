import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const layout = read("src/layouts/SiteLayout.astro");
const favicon = read("public/favicon.svg");
const badge = read("public/minusbeta-badge.svg");
const checks = [
  ["shared layout uses central ICO", layout.includes('href="https://kangdaejong.com/brand/current/favicon.ico"')],
  ["shared layout uses central SVG", layout.includes('href="https://kangdaejong.com/brand/current/logo.svg"')],
  ["shared header script is not a per-site copy", layout.includes('src="https://kangdaejong.com/mb-components.js"')],
  ["favicon artwork matches the brand badge", favicon === badge],
];

const failures = checks.filter(([, ok]) => !ok);
if (failures.length) {
  console.error("favicon brand verification failed:");
  failures.forEach(([label]) => console.error(`- ${label}`));
  process.exit(1);
}
console.log("favicon brand verification passed");
