import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../public/mb-components.js", import.meta.url), "utf8");
const checks = [
  ["brand keeps the company-home destination", /const BRAND_HREF = 'https:\/\/kangdaejong\.com\/';/.test(source)],
  ["primary navigation follows the product visitor flow", ["products", "books", "tools"].every((key) => new RegExp(`key: '${key}'`).test(source)) && /work\.kangdaejong\.com\/products\//.test(source) && /kangdaejong\.com\/#books/.test(source) && /work\.kangdaejong\.com\/products\/\?category=tool#catalog/.test(source)],
  ["company, system, choso, work, worklog, newsletter, and founder remain reachable", ["organization", "system", "choso", "workshop", "worklog", "newsletter", "founder"].every((key) => new RegExp(`key: '${key}'`).test(source))],
  ["choso guest destination stays public", /key: 'choso'/.test(source) && /https:\/\/choso\.kangdaejong\.com\/guest/.test(source)],
  ["workshop submenu keeps system above lab", /label: '작업장 둘러보기'[\s\S]*label: '시스템'[\s\S]*href: 'https:\/\/work\.kangdaejong\.com\/system\/'[\s\S]*label: '실험실'/.test(source)],
  ["dead cost page stays absent", !/key: 'cost'/.test(source) && !/work\.kangdaejong\.com\/cost/.test(source)],
  ["menu state supports click, outside click, and Escape", /aria-expanded="false"/.test(source) && /document\.addEventListener\('click'/.test(source) && /event\.key === 'Escape'/.test(source) && /closeMenu\(true\)/.test(source)],
  ["open shadow navigation has visible keyboard focus", /:where\(a,button\):focus-visible/.test(source)],
  ["mobile navigation remains on a dedicated scroll-safe row", /grid-column:1 \/ -1; grid-row:2/.test(source) && /overflow-x:auto/.test(source)],
  ["contact action keeps the verified email", /mailto:minusbetastudio@gmail\.com/.test(source)],
  ["shared consumers keep the default palette unless studio tone is explicit", /const PALETTE_DEFAULT = `/.test(source) && /const PALETTE_STUDIO = `/.test(source) && /getAttribute\('tone'\)/.test(source) && /dataset\.tone/.test(source) && /hostPalette\(this\)/.test(source)],
];

const failures = checks.filter(([, ok]) => !ok);
if (failures.length) {
  console.error("Shared header source verification failed:");
  failures.forEach(([label]) => console.error(`- ${label}`));
  process.exit(1);
}
console.log("Shared header source verification passed");
