import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const layout = read("src/layouts/SiteLayout.astro");
const favicon = read("public/favicon.svg");
const badge = read("public/minusbeta-badge.svg");
const checks = [
  ["shared layout includes ICO favicon", /<link rel="icon" href="\/favicon\.ico" sizes="any" \/>/.test(layout)],
  ["shared layout includes SVG favicon", /<link rel="icon" type="image\/svg\+xml" href="\/favicon\.svg" \/>/.test(layout)],
  ["favicon artwork matches the brand badge", favicon === badge],
];

const failures = checks.filter(([, ok]) => !ok);
if (failures.length) {
  console.error("favicon brand verification failed:");
  failures.forEach(([label]) => console.error(`- ${label}`));
  process.exit(1);
}
console.log("favicon brand verification passed");
