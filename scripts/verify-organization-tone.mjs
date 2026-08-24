import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/pages/organization.astro", import.meta.url), "utf8");
const home = readFileSync(new URL("../src/pages/index.astro", import.meta.url), "utf8");

const homeAccent = home.match(/--accent:\s*(#[0-9a-fA-F]+);/)?.[1] ?? "";
const orgAccent = source.match(/--accent:\s*(#[0-9a-fA-F]+);/)?.[1] ?? "";

const checks = [
  {
    label: "organization uses the homepage bright accent",
    ok: homeAccent === "#2563eb" && orgAccent === homeAccent,
  },
  {
    label: "hero uses the same watermarked brand layout as the homepage",
    ok:
      /class="hero-mark"/.test(source) &&
      /class="hero-copy"/.test(source) &&
      /class="tagline"/.test(source) &&
      !/eyebrow">ORGANIZATION</.test(source),
  },
  {
    label: "proof strip is derived from worker and gate counts",
    ok:
      /const proofPoints = \[/.test(source) &&
      /value: String\(workers\.length\)/.test(source) &&
      /value: String\(humanGates\.length\)/.test(source) &&
      /class="proof-strip"/.test(source),
  },
  {
    label: "primary CTA matches homepage filled accent button",
    ok: /class="button primary"/.test(source) && /--cta-fg:\s*#ffffff;/.test(source),
  },
  {
    label: "role facts stay: Athena lead, Daejong intern, four workers",
    ok:
      /codename:\s*"아테나"/.test(source) &&
      /title:\s*"인턴"/.test(source) &&
      /codename:\s*"볼칸"/.test(source) &&
      /codename:\s*"헤르메스"/.test(source) &&
      /codename:\s*"라이덴"/.test(source) &&
      /codename:\s*"테미스"/.test(source),
  },
  {
    label: "page does not use the old neon work-site palette",
    ok: !/(#00e5ff|#00b8d4|#ff00aa|--cyan|--magenta)/.test(source),
  },
  {
    label: "headings use the homepage editorial tracking",
    ok: /h1, h2, h3 \{[\s\S]*letter-spacing: -0\.03em;/.test(source),
  },
];

const failures = checks.filter((check) => !check.ok);

if (failures.length > 0) {
  console.error("Organization tone verification failed:");
  for (const failure of failures) {
    console.error(`- ${failure.label}`);
  }
  process.exit(1);
}

console.log("Organization tone verification passed");
