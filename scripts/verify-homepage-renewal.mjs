import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/pages/index.astro", import.meta.url), "utf8");
const checks = [
  ["home uses the shared layout", /import SiteLayout/.test(source) && /<SiteLayout[\s\S]*canonical="https:\/\/kangdaejong\.com\/"/.test(source)],
  ["hero states the visitor-facing promise", /작고 분명한[\s\S]*도구를 만듭니다\./.test(source)],
  ["products, books, open tools, and company remain first-class destinations", ["products", "books", "open-tools", "company"].every((id) => source.includes(`id="${id}"`))],
  ["old repeated card and proof-strip structures stay removed", !/(product-card|tool-card|proof-strip|focusAreas|proofPoints)/.test(source)],
  ["featured first-name service keeps verified price and destination", /name: "첫이름"/.test(source) && /₩19,900/.test(source) && /https:\/\/cheotireum\.kangdaejong\.com\//.test(source)],
  ["all seven mobile apps remain listed", ["한줄일기", "메모요", "더치페이 계산기", "약먹자", "단어요", "한컵", "포모도로"].every((name) => source.includes(`name: "${name}"`))],
  ["all three books keep purchase links", ["786557", "786749", "798202"].every((id) => source.includes(`https://kmong.com/gig/${id}`))],
  ["all three public bridges keep repository and release links", ["grok", "codex", "claude"].every((name) => source.includes(`ssamssae/${name}-telegram-bridge`) && source.includes(`ssamssae/${name}-telegram-bridge/releases`))],
  ["real existing studio images are used", /\/studio\/hero-desk\.jpg/.test(source) && /\/studio\/cheotireum\.jpg/.test(source)],
];

const failures = checks.filter(([, ok]) => !ok);
if (failures.length) {
  console.error("Homepage renewal verification failed:");
  failures.forEach(([label]) => console.error(`- ${label}`));
  process.exit(1);
}
console.log("Homepage renewal verification passed");
