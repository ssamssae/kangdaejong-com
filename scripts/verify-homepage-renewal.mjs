import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/pages/index.astro", import.meta.url), "utf8");

const checks = [
  {
    label: "hero uses a full-width brand layout instead of a split panel",
    ok:
      /<section class="hero" id="top" aria-labelledby="page-title">/.test(source) &&
      /<div class="hero-inner">/.test(source) &&
      /class="hero-mark"/.test(source) &&
      !/hero-panel/.test(source),
  },
  {
    label: "hero keeps the brand as the H1 and moves value props into supporting copy",
    ok:
      /<h1 id="page-title">\{company\.name\}<\/h1>/.test(source) &&
      /class="lead"[\s\S]*\{sloganKo\}/.test(source),
  },
  {
    label: "hero primary actions route to products, work, and contact",
    ok:
      /href=\{company\.products\}>제품 보기<\/a>/.test(source) &&
      /href=\{company\.work\}>작업장 보기<\/a>/.test(source) &&
      /href=\{`mailto:\$\{company\.email\}`\}>문의하기<\/a>/.test(source),
  },
  {
    label: "renewal adds a proof strip for fast scanning",
    ok:
      /const proofPoints = \[/.test(source) &&
      /<section class="proof-strip" aria-label="스튜디오 요약">/.test(source) &&
      /proofPoints\.map/.test(source),
  },
  {
    label: "sections stay constrained below the full-width hero",
    ok:
      /<div class="page-shell">/.test(source) &&
      /main \{ width: 100%;/.test(source) &&
      /\.page-shell \{ width: min\(calc\(100% - 48px\), 1120px\); margin: 0 auto;/.test(source),
  },
];

const failures = checks.filter((check) => !check.ok);

if (failures.length > 0) {
  console.error("Homepage renewal verification failed:");
  for (const failure of failures) {
    console.error(`- ${failure.label}`);
  }
  process.exit(1);
}

console.log("Homepage renewal verification passed");
