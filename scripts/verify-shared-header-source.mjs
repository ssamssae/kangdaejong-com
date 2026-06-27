import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const header = read("public/mb-components.js");
const index = read("src/pages/index.astro");

const checks = [
  {
    label: "shared header documents workshop active key",
    ok: /active = home\|founder\|workshop\|worklog\|newsletter\|insights\|products\|system\|lab/.test(header),
  },
  {
    label: "shared header has workshop root item",
    ok: /key:\s*'workshop',\s*label:\s*'작업장',\s*href:\s*'https:\/\/work\.kangdaejong\.com\/'/.test(header),
  },
  {
    label: "shared header keeps worklog as 작업일지 under /worklog",
    ok: /key:\s*'worklog',\s*label:\s*'작업일지',\s*href:\s*'https:\/\/work\.kangdaejong\.com\/worklog'/.test(header),
  },
  {
    label: "shared header products link uses canonical /products/",
    ok: /key:\s*'products',\s*label:\s*'products',\s*href:\s*'https:\/\/work\.kangdaejong\.com\/products\/'/.test(header),
  },
  {
    label: "shared footer links to 작업장 root",
    ok:
      /<a href="https:\/\/work\.kangdaejong\.com\/">작업장<\/a>/.test(header) &&
      !/<a href="https:\/\/work\.kangdaejong\.com\/">작업일지<\/a>/.test(header),
  },
  {
    label: "company page points work root card at 작업장",
    ok:
      /<h3 class="accent-cyan">작업장<\/h3>/.test(index) &&
      /제품·작업일지·뉴스레터·인사이트를 모아둔 작업 허브/.test(index),
  },
  {
    label: "company page uses canonical products link",
    ok: !/work\.kangdaejong\.com\/apps/.test(index) && /work\.kangdaejong\.com\/products\//.test(index),
  },
];

const failures = checks.filter((check) => !check.ok);

if (failures.length > 0) {
  console.error("Shared header source verification failed:");
  for (const failure of failures) {
    console.error(`- ${failure.label}`);
  }
  process.exit(1);
}

console.log("Shared header source verification passed");
