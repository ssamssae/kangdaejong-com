// T-261012-040: 빌드 결과(dist·dist-protein)의 모든 HTML 이 회사홈 공용 카드와 다크 모드를 갖는지 전수 검사한다.
// 공유 카드 = 회사홈 공용 카드. SiteLayout·protein.astro 는 manifest 의 social.png sha256 앞 16자리를 ?v= 로 붙이고,
//   종료 안내 화면은 T-261012-041 고정 주소(버전 없음)를 쓴다. 둘 중 하나여야 하고 og:image·twitter:image 가 같아야 한다.
// 다크·색 = T-261013-004 부터 공용 원본 하나: 모든 페이지가 /brand/current/tokens.css(회사홈은 같은 사이트 경로,
//        단백질·종료 안내는 https://kangdaejong.com 주소)를 읽고, <html data-theme="light"> 로 다크를 끄지 않아야 한다.
//        이동 껍데기(meta refresh)는 화면이 없으므로 <meta name="color-scheme" content="light dark"> 로도 통과한다.
//   종료 안내 화면(logo-worker/closed.mjs·photo-app/closed.mjs)은 Worker 와 이 사이트 빌드가 같이 쓰므로 여기서 함께 잡힌다.
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
  for (const file of htmlFiles(root)) {
    const html = fs.readFileSync(file, 'utf8');
    const rel = path.join(root, path.relative(root, file));
    const cards = ['og:image', 'twitter:image'].map((key) => [key, metaAny(html, key)]);
    for (const [key, values] of cards) {
      if (values.length !== 1 || !ALLOWED.has(values[0])) errors.push(`${rel}: ${key}=${values.join(',') || '(없음)'}`);
    }
    if (cards[0][1][0] !== cards[1][1][0]) errors.push(`${rel}: og:image ≠ twitter:image`);
    const tokensLinked = [...html.matchAll(/<link\b[^>]*>/gi)].map(([tag]) => tag)
      .some((tag) => /rel="stylesheet"/i.test(tag) && /href="(?:https:\/\/kangdaejong\.com)?\/brand\/current\/tokens\.css"/i.test(tag));
    const lightOnly = /<html\b[^>]*\bdata-theme="light"/i.test(html);
    const redirectScheme = /http-equiv="refresh"/i.test(html) && /<meta\s+name="color-scheme"\s+content="[^"]*dark/i.test(html);
    if (!((tokensLinked && !lightOnly) || redirectScheme)) errors.push(`${rel}: 공용 tokens.css 를 안 읽는다(색·다크 없음)`);
    pages += 1;
  }
}
if (errors.length) {
  console.error(errors.slice(0, 30).join('\n'));
  console.error(`dark/card verification failed: ${errors.length} problems in ${pages} pages`);
  process.exit(1);
}
console.log(`dark/card verification passed: ${pages} pages use the shared card (${SHARED.split('?')[1]} or fixed) and read the shared tokens.css`);
