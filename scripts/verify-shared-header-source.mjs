import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../public/mb-components.js", import.meta.url), "utf8");
const checks = [
  ["brand keeps the company-home destination", /const BRAND_HREF = 'https:\/\/kangdaejong\.com\/';/.test(source)],
  ["primary navigation follows the product visitor flow", ["products", "tools"].every((key) => new RegExp(`key: '${key}'`).test(source)) && /kangdaejong\.com\/work\/products\//.test(source) && /kangdaejong\.com\/work\/products\/\?category=tool#catalog/.test(source)],
  ["company, system, work, worklog, newsletter, and founder remain reachable", ["organization", "system", "workshop", "worklog", "newsletter", "founder"].every((key) => new RegExp(`key: '${key}'`).test(source))],
  // T-261019-026: 초소는 10/18 은퇴(T-261018-002)로 닫혔다 — 둘러보기 「초소」·「운영 정의」가 다시 들어오면 막는다.
  ["retired choso menu stays absent", !/key: 'choso'/.test(source) && !/key: 'ontology'/.test(source) && !/choso\.kangdaejong\.com/.test(source)],
  ["grouped menu keeps workshop, system and lab directly reachable", /const NAV_GROUPS/.test(source) && ["workshop", "work-system", "lab"].every(key => new RegExp(`key: '${key}'`).test(source)) && !/submenu-panel/.test(source)],
  ["protein stays with experiments and the timeline link has no .html suffix", (() => { const products = source.slice(source.indexOf("제품과 도구"), source.indexOf("회사 소개")); const lab = source.slice(source.indexOf("시스템과 실험"), source.indexOf("];", source.indexOf("시스템과 실험"))); return !products.includes("key: 'protein'") && lab.includes("key: 'protein'") && source.includes("https://kangdaejong.com/work/timeline/'") && !source.includes("timeline.html"); })()],
  // T-261013-003: 전자책은 10/4 오프보딩(T-261003-019)으로 없다 — 둘러보기 「책·템플릿」이 다시 들어오면 막는다.
  ["retired book menu stays absent", !/key: 'books'/.test(source) && !/kangdaejong\.com\/#books/.test(source)],
  ["dead cost page stays absent", !/key: 'cost'/.test(source) && !/kangdaejong\.com\/work\/cost/.test(source)],
  ["menu state supports click, outside click, and Escape", /aria-expanded="false"/.test(source) && /document\.addEventListener\('click'/.test(source) && /event\.key === 'Escape'/.test(source) && /closeMenu\(true\)/.test(source)],
  ["open shadow navigation has visible keyboard focus", /:where\(a,button\):focus-visible/.test(source)],
  ["mobile navigation retains compact responsive sizing", /@media\(max-width:380px\)/.test(source) && /width:calc\(100% - 40px\)/.test(source)],
  ["contact action keeps the verified email", /mailto:minusbetastudio@gmail\.com/.test(source)],
  // T-261024-062: 헤더는 스크롤해도 화면 위에 붙어 있어야 한다(대종님 「틀고정 효과」). 되돌리면 4면 전부 다시 사라진다.
  ["header host stays pinned to the top while scrolling", /:host \{ \$\{hostPalette\(this\)\} display:block; position:sticky; top:0; z-index:70;/.test(source) && /setProperty\('--mb-header-block'/.test(source) && /html\{scroll-padding-top:var\(--mb-header-block,calc\(var\(--tone-header-height\) \+ 1px\)\)\}/.test(readFileSync(new URL("../public/studio-page.css", import.meta.url), "utf8"))],
  ["shared consumers keep the default palette unless studio tone is explicit", /const PALETTE_DEFAULT = `/.test(source) && /const PALETTE_STUDIO = `/.test(source) && /getAttribute\('tone'\)/.test(source) && /dataset\.tone/.test(source) && /hostPalette\(this\)/.test(source)],
];

const failures = checks.filter(([, ok]) => !ok);
if (failures.length) {
  console.error("Shared header source verification failed:");
  failures.forEach(([label]) => console.error(`- ${label}`));
  process.exit(1);
}
console.log("Shared header source verification passed");
