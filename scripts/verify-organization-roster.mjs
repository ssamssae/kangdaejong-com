import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/pages/organization.astro", import.meta.url), "utf8");
const checks = [
  ["legal owner remains explicit", /legal owner/i.test(source) && /법적 대표 \{company\.representative\}/.test(source)],
  ["AI is described as a tool rather than a legal actor", /AI는 도구이고/.test(source) && /결정은 사람의 일입니다/.test(source)],
  ["human gates for direction, publication, and cost remain", /무엇을 만들고 무엇을 멈출지/.test(source) && /공개 전에는 다시 확인합니다/.test(source) && /결제와 비용/.test(source)],
  ["internal codenames and devices stay off the visitor page", !/(아테나|헤르메스|볼칸|라이덴|테미스|맥 미니|맥북 프로)/.test(source)],
  ["founder identity and contact remain", /representative: "강대종"/.test(source) && /minusbetastudio@gmail\.com/.test(source)],
];

const failures = checks.filter(([, ok]) => !ok);
if (failures.length) {
  console.error("organization responsibility verification failed:");
  failures.forEach(([label]) => console.error(`- ${label}`));
  process.exit(1);
}
console.log("organization responsibility verification passed");
