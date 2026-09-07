import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/pages/index.astro", import.meta.url), "utf8");

const countEntries = (blockName) => {
  const block = source.match(new RegExp(`const ${blockName} = \\[([\\s\\S]*?)\\n\\];`))?.[1] ?? "";
  return (block.match(/(?:^|\n)\s*\{\s*(?:\n\s*)?name:/g) ?? []).length;
};

const checks = [
  {
    label: "hero uses the picked Editorial Lab statement as the H1",
    ok:
      /<mb-header active="home" tone="editorial">/.test(source) &&
      /<h1 id="page-title"><span>작게 만들고,<\/span><span>오래 운영합니다\.<\/span><\/h1>/.test(source),
  },
  {
    label: "homepage uses the warm editorial palette and two restrained accents",
    ok:
      /--bg:\s*#F6F4EE;/.test(source) &&
      /--fg:\s*#181818;/.test(source) &&
      /--accent:\s*#6D63FF;/.test(source) &&
      /--mint:\s*#39B990;/.test(source),
  },
  {
    label: "homepage keeps seven live apps",
    ok:
      countEntries("apps") === 7 &&
      ["한줄일기", "메모요", "더치페이 계산기", "약먹자", "단어요", "한컵", "포모도로"].every((name) => source.includes(`name: "${name}"`)),
  },
  {
    label: "homepage includes all three current paid web services",
    ok:
      countEntries("services") === 3 &&
      /name: "첫이름"/.test(source) &&
      /name: "한장궁합"/.test(source) &&
      /name: "한장택일"/.test(source),
  },
  {
    label: "homepage includes all four public AI bridges at verified releases",
    ok:
      /name: "Grok", version: "0\.5\.1"/.test(source) &&
      /name: "Codex", version: "0\.9\.7"/.test(source) &&
      /name: "Claude", version: "0\.14\.1"/.test(source) &&
      /name: "Cursor", version: "0\.3\.0"/.test(source) &&
      /github\.com\/ssamssae\/cursor-telegram-bridge/.test(source),
  },
  {
    label: "product total is derived from the four current catalogs",
    ok:
      /const productCount = apps\.length \+ services\.length \+ bridges\.length \+ ebooks\.length;/.test(source) &&
      /value: String\(productCount\)/.test(source),
  },
  {
    label: "homepage renders the full editorial information architecture",
    ok:
      ["selected-section", "apps-section", "automation-section", "books-section", "about-section", "connect-section", "company-section"].every((section) => source.includes(`class="${section}"`)),
  },
  {
    label: "primary actions route to selected work and the public workshop",
    ok:
      /href="#selected-work">대표 제품 보기/.test(source) &&
      /href=\{company\.work\}>작업장 열기/.test(source),
  },
  {
    label: "company facts and organization link remain available",
    ok:
      /878-21-02478/.test(source) &&
      /제 2026-서울마포-1177 호/.test(source) &&
      /href="\/organization\/">AI 운영 대표 1 · 워커 2 · 사람 감독 1/.test(source),
  },
];

const failures = checks.filter((check) => !check.ok);

if (failures.length > 0) {
  console.error("Homepage editorial renewal verification failed:");
  for (const failure of failures) console.error(`- ${failure.label}`);
  process.exit(1);
}

console.log("Homepage editorial renewal verification passed");
