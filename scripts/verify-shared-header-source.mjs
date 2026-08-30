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
    // T-260815-056 — 비용공개 항목을 헤더에서 내렸다. 종전 검사는 그것이 "있어야 한다"고
    // 강제했다(2026-07-08 #21 이 의도적으로 노출시킨 뒤 고정). 의도가 뒤집혔으므로 검사도 뒤집는다.
    // ★뒤집는 근거는 기억이 아니라 실측이다 — 링크 대상 work.kangdaejong.com/cost/ 가 HTTP 404 다.
    //   즉 이 항목은 방문자를 "Page not found" 로 보내고 있었다(아니키 제보 2026-08-15 23:08).
    // 이 검사는 실수로 되살아나는 것을 막는 가드다. 되돌리려면 cost 페이지 부활이 근거로 필요.
    label: "shared header must not link the dead cost disclosure page",
    ok:
      !/key:\s*'cost'/.test(header) &&
      !/work\.kangdaejong\.com\/cost\//.test(header),
  },
  {
    label: "shared header keeps desktop sizing (brand 30px, links 13px, dropdown 13px)",
    ok:
      /\.brand img \{ width:30px; height:30px; display:block; \}/.test(header) &&
      /\.links \{[^}]*font-size:13px;[^}]*white-space:nowrap;[^}]*\}/.test(header) &&
      /\.more-panel a \{[^}]*font-size:13px;[^}]*\}/.test(header),
  },
  {
    label: "shared header only bolds the active nav item",
    ok:
      /\.links a\.active \{ font-weight:510; \}/.test(header) &&
      /\.more-panel a\.active \{[^}]*font-weight:510;[^}]*\}/.test(header) &&
      !/\.more-panel a \{[^}]*font-weight:\s*700;/.test(header),
  },
  {
    label: "shared header mobile keeps primary nav on its own row",
    ok:
      /\.links \{[^}]*grid-column:1 \/ -1;[^}]*grid-row:2;[^}]*\}/.test(header) &&
      !/\.links \{[^}]*flex-wrap:wrap;[^}]*\}/.test(headerComponent),
  },
  {
    label: "shared footer matches work footer structure",
    ok:
      /<div class="foot-head">\s*<strong>마이너스베타스튜디오<\/strong>\s*<a href="mailto:minusbetastudio@gmail\.com">minusbetastudio@gmail\.com<\/a>\s*<\/div>/.test(header) &&
      /footer \{ width:min\(calc\(100% - 92px\), 1250px\); margin:0 auto; padding:34px 0 56px; border-top:1px solid var\(--mb-border\);/.test(header) &&
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
  {
    label: "A안 brand links to company/founder home (kangdaejong.com)",
    ok: /const BRAND_HREF = 'https:\/\/kangdaejong\.com\/';/.test(header),
  },
  {
    label: "A안 primary nav is 제품/작업일지/뉴스레터 (workshop demoted to dropdown)",
    ok:
      /const NAV_PRIMARY = \[[^\]]*key: 'products'[^\]]*key: 'worklog'[^\]]*key: 'newsletter'[^\]]*\]/.test(header) &&
      !/const NAV_PRIMARY = \[[^\]]*key: 'workshop'/.test(header),
  },
  {
    label: "A안 overflow items live in a 더보기 dropdown (NAV_MORE + panel)",
    ok:
      /const NAV_MORE = \[/.test(header) &&
      /class="more-btn/.test(header) &&
      /class="more-panel"/.test(header),
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
