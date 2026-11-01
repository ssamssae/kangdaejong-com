// T-261013-004: 공용 디자인 값 원본(public/brand/current/tokens.css)을 읽는 모듈 + tokens.json 생성기.
// readBrandTokens() → { light: {이름: 값}, palette: [#색, …] }
//   light = :root 블록. var(--x) 는 풀어 둔다. 다크 모드는 없다(T-261024-058, 대종님 「다크를 풀고 전부 라이트」) —
//   원본에 다크 블록이 다시 들어오면 여기서 멈춘다(그림 생성기·검사가 모르는 모드를 만들지 않게).
//   palette = 라이트에 나오는 모든 #색(소문자, 긴 형식) — 다른 저장소의 복사본 검사가 이 목록을 쓴다.
// node scripts/brand-tokens.mjs → public/brand/current/tokens.json 을 쓴다(빌드 첫 단계, 저장소에는 안 올림).
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const TOKENS_CSS = path.join(ROOT, 'public/brand/current/tokens.css');
export const TOKENS_JSON = path.join(ROOT, 'public/brand/current/tokens.json');

function block(css, opener) {
  const start = css.indexOf(opener);
  if (start < 0) throw new Error(`tokens.css: ${opener} 블록이 없다`);
  let depth = 0;
  for (let i = css.indexOf('{', start); i < css.length; i += 1) {
    if (css[i] === '{') depth += 1;
    if (css[i] === '}' && --depth === 0) return css.slice(css.indexOf('{', start) + 1, i);
  }
  throw new Error(`tokens.css: ${opener} 블록이 닫히지 않았다`);
}
const decls = (text) => Object.fromEntries(
  [...text.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map(([, k, v]) => [k, v.trim()]),
);
function resolve(map) {
  const out = {};
  const value = (name, seen = new Set()) => {
    if (seen.has(name)) throw new Error(`tokens.css: ${name} 가 자기 자신을 가리킨다`);
    const raw = map[name];
    if (raw === undefined) throw new Error(`tokens.css: ${name} 정의가 없다`);
    return raw.replace(/var\(\s*(--[\w-]+)\s*\)/g, (_, ref) => value(ref, new Set([...seen, name])));
  };
  for (const name of Object.keys(map)) out[name] = value(name);
  return out;
}
export function readBrandTokens(css = readFileSync(TOKENS_CSS, 'utf8')) {
  if (/prefers-color-scheme\s*:\s*dark|\[data-theme/.test(css.replace(/\/\*[\s\S]*?\*\//g, ''))) {
    throw new Error('tokens.css: 다크 규칙이 다시 들어왔다 — 공개 사이트는 전부 라이트다(T-261024-058). 다크 블록·[data-theme] 선택자를 지운다.');
  }
  const light = resolve(decls(block(css, ':root {')));
  const palette = [...new Set(Object.values(light)
    .flatMap((v) => v.match(/#[0-9a-fA-F]{6}(?:[0-9a-fA-F]{2})?\b/g) || [])
    .map((h) => h.toLowerCase()))].sort();
  return { light, palette };
}

// 공유 카드(social.png)는 라이트 값으로 그린 그림이다(T-261024-030, 전에는 다크). 그린 때의 색 지문(social.tokens)이 지금 원본과 다르면
// 원본 색만 바뀌고 카드는 옛 색이라는 뜻 → 빌드를 멈추고 `npm run brand:render` 를 안내한다.
const SHARE_CARD_NAMES = ['--bg', '--fg', '--fg-dim', '--fg-mute', '--accent', '--border'];
export const SHARE_CARD_STAMP = path.join(ROOT, 'public/brand/current/social.tokens');
export function shareCardStamp(tokens = readBrandTokens()) {
  return SHARE_CARD_NAMES.map((name) => `${name}=${tokens.light[name]}`).join(';');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const tokens = readBrandTokens();
  writeFileSync(TOKENS_JSON, `${JSON.stringify(tokens, null, 2)}\n`);
  console.log(`brand tokens: ${Object.keys(tokens.light).length} names, ${tokens.palette.length} colors → public/brand/current/tokens.json`);
  const stamp = readFileSync(SHARE_CARD_STAMP, 'utf8').trim();
  if (stamp !== shareCardStamp(tokens)) {
    console.error(`공유 카드가 옛 색으로 그려져 있다 (social.tokens=${stamp}).\n원본 색이 바뀌었으면 npm run brand:render 로 카드를 다시 그린 뒤 빌드한다.`);
    process.exit(1);
  }
}
