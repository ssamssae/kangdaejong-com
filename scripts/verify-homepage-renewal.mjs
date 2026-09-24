import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/pages/index.astro", import.meta.url), "utf8");
const checks = [
  ["home uses the shared layout", /import SiteLayout/.test(source) && /<SiteLayout[\s\S]*canonical="https:\/\/kangdaejong\.com\/"/.test(source)],
  ["hero starts with the purchasable digital product", /id="sales-title"/.test(source) && /매번 새로 쓰는 업무/.test(source) && /미리보기·구매/.test(source)],
  ["products, books, open tools, and company remain first-class destinations", ["products", "books", "open-tools", "company"].every((id) => source.includes(`id="${id}"`))],
  ["old repeated card and proof-strip structures stay removed", !/(product-card|tool-card|proof-strip|focusAreas|proofPoints)/.test(source)],
  ["featured first-name service keeps verified price and destination", /name: "첫이름"/.test(source) && /₩19,900/.test(source) && /https:\/\/cheotireum\.kangdaejong\.com\//.test(source)],
  ["web services for fortune, dates, pet names, and shop names remain listed", ["사주운세", "한장택일", "펫이름", "한장궁합", "한장상호"].every((name) => source.includes(`name: "${name}"`)) && source.includes("https://cheotireum.kangdaejong.com/unse") && source.includes("https://taekil.kangdaejong.com/") && source.includes("https://cheotireum.kangdaejong.com/pet") && source.includes("https://hanjang.kangdaejong.com/") && source.includes("https://sangho.kangdaejong.com/") && source.includes("₩4,900") && source.includes("₩2,900")],
  ["all seven mobile apps remain listed", ["한줄일기", "메모요", "더치페이 계산기", "약먹자", "단어요", "한컵", "포모도로"].every((name) => source.includes(`name: "${name}"`))],
  ["hankeup keeps the live Play listing", source.includes("https://play.google.com/store/apps/details?id=com.ssamssae.hankeup")],
  ["all three books keep purchase links", ["786557", "786749", "798202"].every((id) => source.includes(`https://kmong.com/gig/${id}`))],
  ["all four public bridges keep repository and release links", ["grok", "codex", "claude", "cursor"].every((name) => source.includes(`ssamssae/${name}-telegram-bridge`) && source.includes(`ssamssae/${name}-telegram-bridge/releases`))],
  ["choso guest board remains a public destination", /id="choso"/.test(source) && /https:\/\/choso\.kangdaejong\.com\/guest/.test(source) && /초소 둘러보기/.test(source)],
  ["company intro keeps the business opening date", /since: "2026년 5월 4일"/.test(source) && /Since \{company\.sinceShort\}/.test(source)],
  ["real existing studio images are used", /\/studio\/cheotireum\.jpg/.test(source)],
];

const failures = checks.filter(([, ok]) => !ok);
if (failures.length) {
  console.error("Homepage renewal verification failed:");
  failures.forEach(([label]) => console.error(`- ${label}`));
  process.exit(1);
}
console.log("Homepage renewal verification passed");
