import { readFileSync } from "node:fs";

const organization = readFileSync(new URL("../src/pages/organization.astro", import.meta.url), "utf8");
const system = readFileSync(new URL("../src/pages/system.astro", import.meta.url), "utf8");
const checks = [
  ["organization and system share SiteLayout", [organization, system].every((source) => /import SiteLayout/.test(source) && /<SiteLayout/.test(source))],
  ["organization uses editorial responsibility sections", /class="responsibility-band"/.test(organization) && /class="principles"/.test(organization) && /class="boundary-grid"/.test(organization)],
  ["system uses an explicit visitor-facing sequence", /class="system-sequence"/.test(system) && /class="system-boundary"/.test(system)],
  ["system stays local rather than auto-redirecting", !/http-equiv="refresh"/.test(system) && /canonical="https:\/\/kangdaejong\.com\/system\/"/.test(system)],
  ["pages do not reintroduce old neon or Linear palettes", !/(#00e5ff|#00b8d4|#ff00aa|#7170FF|--cyan|--magenta)/i.test(`${organization}\n${system}`)],
];

const failures = checks.filter(([, ok]) => !ok);
if (failures.length) {
  console.error("Organization and system tone verification failed:");
  failures.forEach(([label]) => console.error(`- ${label}`));
  process.exit(1);
}
console.log("Organization and system tone verification passed");
