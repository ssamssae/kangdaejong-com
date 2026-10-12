// T-261013-004: 회사 팔레트 색 값(public/brand/current/tokens.css 의 모든 #색)이 그 원본 밖에 복사돼 있으면 실패한다.
// 색은 원본 한 곳에서만 바꾼다 — 사이트 스타일은 var(--이름) 만 쓰고 대체값(var(--bg, #fff))도 두지 않는다.
// 같은 색이 테마와 무관해야 하는 곳(예: 원소 색 범례의 수소 = 흰색)은 그 줄에 `tokens:fixed` 를 적어 예외로 둔다.
// 검사 대상 = git 이 추적하는 스타일·마크업·스크립트. 그림 원본(svg)·문서(md)·외부 라이브러리·보관 폴더는 제외.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { readBrandTokens } from './brand-tokens.mjs';

const EXCLUDE = /^(public\/brand\/|public\/protein\/vendor\/|archive\/|callta-retired\/|node_modules\/|dist)|(^|\/)_retired\//;
const INCLUDE = /\.(css|astro|html|mjs|js|ts|py)$/;

const { palette } = readBrandTokens();
// 6자리 회사 색만 기준으로 삼는다. 그림자처럼 8자리(알파)로만 나오는 색의 바탕(예: 검정)은 회사 색이 아니다.
const longs = new Set(palette.filter((h) => h.length === 7));
const pattern = /#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?(?:[0-9a-fA-F]{2})?\b/g;
const asLong = (h) => (h.length === 4 ? `#${[...h.slice(1)].map((c) => c + c).join('')}` : h.slice(0, 7)).toLowerCase();
// rgb(36, 41, 48) / rgba(36,41,48,.5) 같은 형태로 같은 색을 적어도 복사본이다(테스트 기대값 등).
const rgbPattern = /rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,[^)]*)?\)/g;
const rgbHex = (r, g, b) => `#${[r, g, b].map((n) => Number(n).toString(16).padStart(2, '0')).join('')}`;

const files = execFileSync('git', ['ls-files'], { encoding: 'utf8' }).split('\n')
  .filter((f) => INCLUDE.test(f) && !EXCLUDE.test(f) && f !== 'scripts/verify-palette-copies.mjs');
const hits = [];
for (const file of files) {
  readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
    if (line.includes('tokens:fixed')) return;
    // 자기 자신을 가리키는 정의(--border: var(--border))는 값이 비어 색이 사라진다(T-261013-004 실사고).
    for (const m of line.matchAll(/(--[\w-]+)\s*:\s*var\(\s*(--[\w-]+)\s*\)/g)) if (m[1] === m[2]) hits.push(`${file}:${i + 1}: ${m[0]} (자기 참조)  ${line.trim().slice(0, 80)}`);
    for (const m of line.matchAll(pattern)) {
      if (longs.has(asLong(m[0]))) hits.push(`${file}:${i + 1}: ${m[0]}  ${line.trim().slice(0, 100)}`);
    }
    for (const m of line.matchAll(rgbPattern)) {
      if (longs.has(rgbHex(m[1], m[2], m[3]))) hits.push(`${file}:${i + 1}: ${m[0]}  ${line.trim().slice(0, 100)}`);
    }
  });
}
if (hits.length) {
  console.error(hits.slice(0, 40).join('\n'));
  console.error(`palette copies: ${hits.length} 곳 — 색 값 대신 var(--이름) 을 쓰거나, 테마와 무관한 색이면 그 줄에 tokens:fixed`);
  process.exit(1);
}
console.log(`palette copies: 0 — ${files.length} files, ${longs.size} palette colors (원본 public/brand/current/tokens.css)`);
