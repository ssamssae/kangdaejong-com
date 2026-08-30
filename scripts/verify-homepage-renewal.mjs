import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/pages/index.astro", import.meta.url), "utf8");

// T-260821-007 — 브랜드 H1 검사를 ★마크업 리터럴 대조에서 「의미 대조」로 바꾼다.
//   종전 검사는 <h1 id="page-title">{company.name}</h1> 라는 한 가지 표기만 인정했다.
//   현행 마크업은 같은 브랜드를 span 두 개(마이너스 / 베타스튜디오)로 쪼개 그린다 —
//   의도(브랜드가 H1)는 그대로인데 표기만 바뀌었고, 검사만 ★상시 빨강으로 남았다.
//   계기가 상시 빨강이면 그린 판정 자체가 무의미해지므로 고칠 것은 페이지가 아니라 계기다.
//   그래서 H1 안의 태그를 걷어낸 ★텍스트를 같은 파일의 company.name 과 대조한다.
//   이러면 표기(span·개행·중첩)가 바뀌어도 통과하되, H1 이 브랜드가 아니게 되면 여전히 빨강이다.
const brandName = source.match(/name:\s*"([^"]+)"/)?.[1] ?? "";
const pageTitleH1 = source.match(/<h1 id="page-title">([\s\S]*?)<\/h1>/)?.[1] ?? null;
const pageTitleText =
  pageTitleH1 === null ? null : pageTitleH1.replace(/<[^>]*>/g, "").replace(/\s+/g, "");
// 하위호환: 마크업이 다시 {company.name} 보간 한 줄로 돌아가도 의도는 같으므로 인정한다.
const h1IsBrand =
  pageTitleText !== null &&
  brandName !== "" &&
  (pageTitleText === brandName || pageTitleText === "{company.name}");

const checks = [
  {
    label: "hero uses a full-width brand layout instead of a split panel",
    ok:
      /<section class="hero" id="top" aria-labelledby="page-title">/.test(source) &&
      /<div class="hero-inner">/.test(source) &&
      /class="hero-mark"/.test(source) &&
      !/hero-panel/.test(source),
  },
  {
    label: "hero keeps the brand as the H1 and moves value props into supporting copy",
    ok:
      h1IsBrand &&
      /class="lead"[\s\S]*\{sloganKo\}/.test(source),
  },
  {
    label: "hero primary actions route to products, work, and contact",
    ok:
      /href=\{company\.products\}>제품 보기<\/a>/.test(source) &&
      /href=\{company\.work\}>작업장 보기<\/a>/.test(source) &&
      /href=\{`mailto:\$\{company\.email\}`\}>문의하기<\/a>/.test(source),
  },
  {
    label: "renewal adds a proof strip for fast scanning",
    ok:
      /const proofPoints = \[/.test(source) &&
      /<section class="proof-strip" aria-label="스튜디오 요약">/.test(source) &&
      /proofPoints\.map/.test(source),
  },
  {
    label: "sections stay constrained below the full-width hero",
    ok:
      /<div class="page-shell">/.test(source) &&
      /main \{ width: 100%;/.test(source) &&
      /\.page-shell \{ width: min\(calc\(100% - 92px\), 1250px\); margin: 0 auto;/.test(source),
  },
  {
    label: "open tools include the public Grok Telegram Bridge",
    ok: /name:\s*"Grok Telegram Bridge"/.test(source) && /github\.com\/ssamssae\/grok-telegram-bridge/.test(source),
  },
  {
    label: "featured web product keeps 첫이름 with live price",
    ok: /name:\s*"첫이름"/.test(source) && /₩19,900/.test(source) && /cheotireum\.kangdaejong\.com/.test(source),
  },
];

const failures = checks.filter((check) => !check.ok);

if (failures.length > 0) {
  console.error("Homepage renewal verification failed:");
  for (const failure of failures) {
    console.error(`- ${failure.label}`);
  }
  process.exit(1);
}

console.log("Homepage renewal verification passed");
