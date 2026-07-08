import { readFileSync } from "node:fs";

const indexSource = readFileSync("src/pages/index.astro", "utf8");
const faviconSource = readFileSync("public/favicon.svg", "utf8").trim();
const badgeSource = readFileSync("public/minusbeta-badge.svg", "utf8").trim();

const requiredHeadLinks = [
  '<link rel="icon" href="/favicon.ico" sizes="any" />',
  '<link rel="icon" type="image/svg+xml" href="/favicon.svg" />',
];

const failures = [];

for (const link of requiredHeadLinks) {
  if (!indexSource.includes(link)) {
    failures.push(`missing head favicon link: ${link}`);
  }
}

if (faviconSource !== badgeSource) {
  failures.push("public/favicon.svg must match public/minusbeta-badge.svg");
}

if (failures.length > 0) {
  console.error("favicon brand verification failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("favicon brand verification passed");
