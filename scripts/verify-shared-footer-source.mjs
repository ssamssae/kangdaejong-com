import { readFileSync } from "node:fs";

const components = readFileSync(new URL("../public/mb-components.js", import.meta.url), "utf8");
const layout = readFileSync(new URL("../src/layouts/SiteLayout.astro", import.meta.url), "utf8");
const footer = components.split("class MbFooter")[1] || "";
const checks = [
  ["all SiteLayout pages render the shared footer", /<mb-footer tone="studio"><\/mb-footer>/.test(layout)],
  ["shared footer custom element remains registered", /class MbFooter extends HTMLElement/.test(components) && /customElements\.define\('mb-footer', MbFooter\)/.test(components)],
  ["legal company facts remain in the shared footer", ["대표 강대종", "878-21-02478", "제 2026-서울마포-1177 호", "만리재로10길 4", "정보통신업 / 응용 소프트웨어 개발 및 공급업"].every((value) => footer.includes(value))],
  ["verified contact email remains in the footer", /mailto:minusbetastudio@gmail\.com/.test(footer)],
  // T-261024-050: 폭은 공용 톤 파일의 좌우 여백(--tone-gutter)과 호스트 폭(--mb-max)으로만 계산한다(대체값 없음) — 첫이름과 같은 20/32px 여백.
  ["footer uses the shared page width and mobile stack", /width:min\(calc\(100% - var\(--tone-gutter\) \* 2\),var\(--mb-max\)\)/.test(footer) && /@media \(max-width:640px\)/.test(footer) && /\.biz \{ display:grid;/.test(footer)],
];

const failures = checks.filter(([, ok]) => !ok);
if (failures.length) {
  console.error("Shared footer source verification failed:");
  failures.forEach(([label]) => console.error(`- ${label}`));
  process.exit(1);
}
console.log("Shared footer source verification passed");
