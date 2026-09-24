import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/pages/organization.astro", import.meta.url), "utf8");
const checks = [
  ["owner and contact remain explicit", source.includes('representative: "강대종"') && source.includes('minusbetastudio@gmail.com')],
  ["verified business facts remain", ['2026년 5월 4일', '878-21-02478', '2026-서울마포-1177'].every(value => source.includes(value))],
  ["current preparation status is clear", source.includes('새로운 서비스를 준비하고 있습니다')],
  ["past products remain reachable discreetly", source.includes('<StudioFooter />') && readFileSync(new URL('../src/components/StudioFooter.astro', import.meta.url), 'utf8').includes('href="/archive/"')],
  ["internal codenames and AI hierarchy stay off the visitor page", !/(아테나|헤르메스|볼칸|LEGAL OWNER|r-owner-map)/.test(source)],
];

const failures = checks.filter(([, ok]) => !ok);
if (failures.length) {
  console.error("organization responsibility verification failed:");
  failures.forEach(([label]) => console.error(`- ${label}`));
  process.exit(1);
}
console.log("organization responsibility verification passed");
