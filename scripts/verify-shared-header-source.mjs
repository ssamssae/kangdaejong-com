import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const header = read("public/mb-components.js");
const headerComponent = header.split("class MbFooter")[0];
const footerComponent = header.split("class MbFooter")[1] || "";
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
    ok: /key:\s*'products',\s*label:\s*'제품',\s*href:\s*'https:\/\/work\.kangdaejong\.com\/products\/'/.test(header),
  },
  {
    label: "shared header matches work header desktop sizing",
    ok:
      /\.brand img \{ width:30px; height:30px; display:block; \}/.test(header) &&
      /\.links \{[^}]*font-size:13px;[^}]*white-space:nowrap;[^}]*\}/.test(header) &&
      /\.sub \{[^}]*font-size:13px;[^}]*\}/.test(header),
  },
  {
    label: "shared header only bolds the current secondary page",
    ok:
      /\.links a\.active, \.sub a\.active \{ font-weight:700; \}/.test(header) &&
      !/\.sub a\s*\{\s*font-weight:\s*700;\s*\}/.test(header),
  },
  {
    label: "shared header mobile primary nav follows work header row behavior",
    ok:
      /\.links \{ grid-column:1 \/ -1; grid-row:2; justify-content:flex-start; gap:16px; \}/.test(header) &&
      !/\.links \{[^}]*flex-wrap:wrap;[^}]*\}/.test(headerComponent),
  },
  {
    label: "shared footer matches work footer structure",
    ok:
      /<div class="foot-head">\s*<strong>마이너스베타스튜디오<\/strong>\s*<a href="mailto:minusbetastudio@gmail\.com">minusbetastudio@gmail\.com<\/a>\s*<\/div>/.test(header) &&
      /footer \{ width:min\(calc\(100% - 48px\), 1120px\); margin:0 auto; padding:34px 0 56px; border-top:1px solid var\(--mb-border\);/.test(header) &&
      /\.foot-head \{ display:flex; align-items:baseline; justify-content:space-between; gap:16px; margin-bottom:16px; \}/.test(header) &&
      /\.biz \{ display:flex; flex-wrap:wrap; gap:6px 14px;/.test(header),
  },
  {
    label: "shared footer removes legacy link-row footer",
    ok:
      !/<div class="links">/.test(footerComponent) &&
      !/<a href="https:\/\/work\.kangdaejong\.com\/">작업장<\/a>/.test(footerComponent) &&
      !/<a href="https:\/\/github\.com\/ssamssae" target="_blank" rel="noopener">GitHub<\/a>/.test(footerComponent),
  },
  {
    label: "company page points work root link at 작업장",
    ok:
      /label:\s*"작업장",\s*desc:\s*"제품, 작업일지, 뉴스레터, 인사이트를 모아둔 공개 허브\.",\s*href:\s*company\.work/.test(index),
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
