// verify-tone-copies.mjs — 생김새 원본(회사홈 공용 tokens.css) 밖의 복사본·되돌림을 막는 게이트 (T-261024-058).
// 왜: 10/24 대종님 「뭘 바꿔도 한 번에 안 바뀐다」 — 색은 공용 파일 하나였지만 모양·글자·간격·다크 규칙은 사이트마다
//     자기 CSS 숫자로 남아 있어 공용 파일을 고쳐도 닿지 않았다. 이 검사는 그 숫자가 다시 늘지 못하게 한다.
// 규칙(원본 파일 자신은 제외):
//   ① 다크 규칙 금지 — 공개 사이트는 전부 라이트(2026-10-24 「다크를 풀고 전부 라이트」). prefers-color-scheme: dark,
//      [data-theme=…] 선택자, color-scheme: dark, data-theme="auto|dark", content="light dark", dark-href, dataset.theme 이 나오면 실패.
//   ② 톤 값 정의 금지 — --tone-*: 은 원본에서만 정의한다(사이트는 var(--tone-이름) 으로만 쓴다).
//   ③ 직접 숫자 래칫 — 모양·글자·간격 속성(border-radius·font-size·font·line-height·letter-spacing·min-height·max-width·
//      padding*·gap·margin*)에 px/rem/em 숫자를 직접 적은 곳과 글꼴 묶음 복사(Pretendard·-apple-system …)를 파일별로 센다.
//      기준선(tone-copies-baseline.json)보다 많아지면 실패. 줄이면 `--update` 로 기준선을 내린다(기준선은 올릴 수 없고 내릴 수만 있다).
//      정말 고정이어야 하는 줄(그림 크기 등)은 그 줄에 `tone:fixed` 를 적고 이유를 남긴다 — 그 줄은 세지 않는다.
// 사용: node scripts/verify-tone-copies.mjs [--update]
// 저장소마다 아래 CONFIG 만 다르다. 나머지는 같은 코드다(세 저장소: kangdaejong-com·daejong-page·ssamssae.github.io).
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const CONFIG = {
  // 생김새 원본. 회사홈 저장소만 원본을 갖는다(다른 저장소는 null — 원본은 https://kangdaejong.com/brand/current/tokens.css).
  origin: 'public/brand/current/tokens.css',
  baseline: 'scripts/tone-copies-baseline.json',
  include: /\.(css|astro|html|mjs|js|ts)$/,
  exclude: /^(node_modules\/|dist|public\/brand\/|public\/protein\/|public\/fonts\/|archive\/|callta-retired\/|photo-app\/|logo-worker\/|workshop-router\/|tests\/|scripts\/|site-release-report\/)|(^|\/)_retired\//,
};

const DARK_RULES = [
  [/prefers-color-scheme\s*:\s*dark/, 'prefers-color-scheme: dark'],
  [/\[data-theme\s*[=\]]/, '[data-theme] 선택자'],
  [/color-scheme\s*:\s*dark/, 'color-scheme: dark'],
  [/data-theme\s*=\s*["'](auto|dark)["']/, 'data-theme="auto|dark"'],
  [/content\s*=\s*["'][^"']*\bdark\b[^"']*["']/, 'color-scheme 메타 dark'],
  [/dark-href|darkHref|dataset\.theme/, '다크 그림 전환 코드'],
];
const SIZE_PROPS = /(?<![\w-])(border-radius|font-size|font|line-height|letter-spacing|min-height|max-width|padding(?:-(?:top|right|bottom|left|block|inline))?|row-gap|column-gap|gap|margin(?:-(?:top|right|bottom|left|block|inline))?)\s*:\s*([^;{}"']*)/g;
const LENGTH = /(?<![\w.-])(\d*\.?\d+)(px|rem|em)\b/g;
const FONT_COPY = /font(?:-family)?\s*:[^;{}]*(Pretendard|-apple-system|BlinkMacSystemFont|Apple SD Gothic)/;

const update = process.argv.includes('--update');
const files = execFileSync('git', ['ls-files'], { encoding: 'utf8' }).split('\n')
  .filter((f) => f && CONFIG.include.test(f) && !CONFIG.exclude.test(f) && f !== CONFIG.origin && !f.endsWith('verify-tone-copies.mjs'));
const baseline = existsSync(CONFIG.baseline) ? JSON.parse(readFileSync(CONFIG.baseline, 'utf8')) : {};
const errors = [];
const counts = {};
for (const file of files) {
  let count = 0;
  readFileSync(file, 'utf8').split('\n').forEach((raw, i) => {
    let line = raw;
    if (line.includes('tone:fixed')) return;
    for (const [rule, label] of DARK_RULES) if (rule.test(raw)) errors.push(`${file}:${i + 1}: 다크 규칙(${label})  ${raw.trim().slice(0, 90)}`);
    for (const m of raw.matchAll(/(--tone-[\w-]+)\s*:/g)) errors.push(`${file}:${i + 1}: ${m[1]} 정의 복사(원본에서만 정의)`);
    // @media (max-width: 760px) 같은 조건식은 속성이 아니다 — 직접 숫자를 셀 때만 조건식을 지운다(다크 규칙 검사는 원문으로).
    line = raw.replace(/@(?:media|container|supports)[^{]*/g, '');
    for (const m of line.matchAll(SIZE_PROPS)) {
      const literals = [...m[2].matchAll(LENGTH)].filter((l) => Number(l[1]) !== 0);
      count += literals.length;
    }
    if (FONT_COPY.test(line)) count += 1;
  });
  if (count) counts[file] = count;
}
const total = Object.values(counts).reduce((a, b) => a + b, 0);
const baseTotal = Object.values(baseline).reduce((a, b) => a + b, 0);
const over = Object.entries(counts).filter(([file, count]) => count > (baseline[file] || 0));
const under = Object.entries(baseline).filter(([file, count]) => (counts[file] || 0) < count);
if (update) {
  const next = Object.fromEntries(Object.entries(counts).sort());
  const raised = Object.entries(next).filter(([file, count]) => existsSync(CONFIG.baseline) && count > (baseline[file] || 0));
  if (raised.length) {
    console.error(raised.map(([file, count]) => `${file}: ${baseline[file] || 0} → ${count}`).join('\n'));
    console.error('tone copies: 기준선은 올릴 수 없다 — 직접 숫자를 var(--tone-*) 로 바꾸거나 tone:fixed 이유를 적는다');
    process.exit(1);
  }
  writeFileSync(CONFIG.baseline, `${JSON.stringify(next, null, 2)}\n`);
  console.log(`tone copies: 기준선 갱신 ${baseTotal} → ${total} (${Object.keys(next).length} files)`);
  process.exit(0);
}
if (over.length) errors.push(...over.map(([file, count]) => `${file}: 직접 숫자 ${count} > 기준선 ${baseline[file] || 0} — var(--tone-*)·.mb-* 를 쓰거나 그 줄에 tone:fixed 이유`));
if (errors.length) {
  console.error(errors.slice(0, 40).join('\n'));
  console.error(`tone copies: 실패 ${errors.length} 건 (직접 숫자 ${total}, 기준선 ${baseTotal})`);
  process.exit(1);
}
if (under.length) console.log(`tone copies: ${under.length} 파일이 기준선보다 줄었다 — node scripts/verify-tone-copies.mjs --update 로 기준선을 내린다`);
console.log(`tone copies: 통과 — 다크 규칙 0, 톤 정의 복사 0, 직접 숫자 ${total} ≤ 기준선 ${baseTotal} (${files.length} files)`);
