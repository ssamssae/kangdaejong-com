// T-261012-040: 빌드 결과(dist·dist-protein)의 모든 HTML 이 회사홈 공용 카드와 다크 모드를 갖는지 전수 검사한다.
// 공유 카드 = 회사홈 공용 카드. SiteLayout·protein.astro 는 manifest 의 social.png sha256 앞 16자리를 ?v= 로 붙이고,
//   종료 안내 화면은 T-261012-041 고정 주소(버전 없음)를 쓴다. 둘 중 하나여야 하고 og:image·twitter:image 가 같아야 한다.
// 다크 = (1) <html data-theme="auto"> + CSS 의 prefers-color-scheme: dark 규칙(SiteLayout theme="auto"), 또는
//        (2) data-theme 없이 바로 적용되는 다크 규칙(:root·html{·body·*), 또는
//        (3) 이동 껍데기(meta refresh)의 <meta name="color-scheme" content="light dark">.
//   종료 안내 화면(logo-worker/closed.mjs·photo-app/closed.mjs)은 Worker 와 이 사이트 빌드가 같이 쓰므로 여기서 함께 잡힌다.
//   다른 사이트 CSS(https://…)는 읽지 않는다.
import fs from 'node:fs';
import path from 'node:path';

const manifest = JSON.parse(fs.readFileSync('public/brand/manifest.json', 'utf8'));
const SHARED_FIXED = 'https://kangdaejong.com/brand/current/social.png';
const SHARED = `${SHARED_FIXED}?v=${manifest.files['social.png'].sha256.slice(0, 16)}`;
const ALLOWED = new Set([SHARED, SHARED_FIXED]);
const roots = ['dist', 'dist-protein'].filter((d) => fs.existsSync(d));
if (!roots.includes('dist')) {
  console.error('dark/card verification failed: run npm run build first');
  process.exit(1);
}
const DARK = /prefers-color-scheme\s*:\s*dark/;
const UNSCOPED_DARK = /prefers-color-scheme\s*:\s*dark\s*\)\s*\{\s*(?::root|html\s*\{|body|\*)/;
const metaAny = (html, key) =>
  [...html.matchAll(/<meta\b[^>]*>/gi)]
    .map(([tag]) => tag)
    .filter((tag) => new RegExp(`(?:property|name)="${key}"`).test(tag))
    .map((tag) => (tag.match(/content="([^"]*)"/) || [])[1])
    .filter(Boolean);
function* htmlFiles(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!['_astro'].includes(entry.name)) yield* htmlFiles(full);
    } else if (entry.isFile() && entry.name.endsWith('.html')) yield full;
  }
}
const errors = [];
let pages = 0;
for (const root of roots) {
  const cache = new Map();
  const localCss = (href) => {
    const clean = href.split(/[?#]/)[0];
    if (/^[a-z]+:/i.test(clean) || clean.startsWith('//')) return '';
    const file = path.join(root, clean.replace(/^\/+/, ''));
    if (!cache.has(file)) cache.set(file, fs.existsSync(file) && fs.statSync(file).isFile() ? fs.readFileSync(file, 'utf8') : '');
    return cache.get(file);
  };
  for (const file of htmlFiles(root)) {
    const html = fs.readFileSync(file, 'utf8');
    const rel = path.join(root, path.relative(root, file));
    const cards = ['og:image', 'twitter:image'].map((key) => [key, metaAny(html, key)]);
    for (const [key, values] of cards) {
      if (values.length !== 1 || !ALLOWED.has(values[0])) errors.push(`${rel}: ${key}=${values.join(',') || '(없음)'}`);
    }
    if (cards[0][1][0] !== cards[1][1][0]) errors.push(`${rel}: og:image ≠ twitter:image`);
    const css = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1])
      .concat([...html.matchAll(/<link\b[^>]*>/gi)].map(([tag]) => tag).filter((tag) => /rel="stylesheet"/i.test(tag))
        .map((tag) => localCss((tag.match(/href="([^"]+)"/) || [])[1] || '')))
      .join('\n');
    const autoTheme = /<html\b[^>]*\bdata-theme="auto"/i.test(html);
    const redirectScheme = /http-equiv="refresh"/i.test(html) && /<meta\s+name="color-scheme"\s+content="[^"]*dark/i.test(html);
    if (!((autoTheme && DARK.test(css)) || UNSCOPED_DARK.test(css) || redirectScheme)) errors.push(`${rel}: 다크 모드 없음`);
    pages += 1;
  }
}
if (errors.length) {
  console.error(errors.slice(0, 30).join('\n'));
  console.error(`dark/card verification failed: ${errors.length} problems in ${pages} pages`);
  process.exit(1);
}
console.log(`dark/card verification passed: ${pages} pages use the shared card (${SHARED.split('?')[1]} or fixed) and have dark mode`);
