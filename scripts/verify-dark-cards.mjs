// T-261012-040: 빌드 결과(dist·dist-protein)의 모든 HTML 이 회사홈 공용 카드와 공용 톤 파일 연결을 갖는지 전수 검사한다.
// 공유 카드 = 회사홈 공용 카드. SiteLayout·protein.astro 는 manifest 의 social.png sha256 앞 16자리를 ?v= 로 붙이고,
//   종료 안내 화면은 T-261012-041 고정 주소(버전 없음)를 쓴다. 둘 중 하나여야 하고 og:image·twitter:image 가 같아야 한다.
// 색 = T-261013-004 부터 공용 원본 하나: 모든 페이지가 /brand/current/tokens.css(회사홈은 같은 사이트 경로,
//        단백질·종료 안내는 https://kangdaejong.com 주소)를 읽어야 한다.
// 모드 = T-261024-050 부터 회사 홈(dist)은 다크를 풀었다(대종님 「다크도 풀자」, 첫이름과 같은 라이트 하나):
//        dist 의 모든 화면은 <html data-theme="light"> 여야 한다 — 단, /protein/ 은 단백질 도감(별도 사이트, 다크 그림 세트)이라 "auto" 를 유지하고,
//        이동 껍데기(meta refresh)는 화면이 없으므로 예외다. 단백질 빌드(dist-protein)의 첫 화면은 기기 설정을 따르는 "auto" 여야 한다.
//        (파일 이름은 그대로 둔다 — package.json·tests/test_dark_cards.sh·CI 가 이 이름을 부른다.)
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
// 기기 설정을 따르는 화면 = 단백질 도감뿐(회사 홈 빌드의 /protein/ 과 단백질 빌드의 첫 화면). 단백질 빌드에 복사되는 public/ 정적 파일(복붙 정리기 등)은 회사 홈 화면이라 라이트다.
const DEVICE_THEME_PAGES = new Set(['dist/protein/index.html', 'dist-protein/index.html']);
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
let light = 0;
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
    const theme = (html.match(/<html\b[^>]*\bdata-theme="([^"]*)"/i) || [])[1] || '';
    const redirect = /http-equiv="refresh"/i.test(html);
    const colorScheme = (html.match(/<meta\s+name="color-scheme"\s+content="([^"]*)"/i) || [])[1] || '';
    if (!tokensLinked && !redirect) errors.push(`${rel}: 공용 tokens.css 를 안 읽는다(색 없음)`);
    if (redirect) {
      // 이동 껍데기는 화면이 없다 — 공용 tokens.css 나 color-scheme 메타 중 하나만 있으면 된다.
      if (!tokensLinked && !colorScheme) errors.push(`${rel}: 이동 껍데기에 color-scheme 메타가 없다`);
    } else if (DEVICE_THEME_PAGES.has(rel)) {
      if (theme !== 'auto') errors.push(`${rel}: 단백질 도감은 기기 설정을 따라야 한다(data-theme="auto")`);
    } else {
      if (theme !== 'light') errors.push(`${rel}: 회사 홈은 라이트 고정이어야 한다(data-theme="light", T-261024-050)`);
      if (/dark/i.test(colorScheme)) errors.push(`${rel}: 회사 홈 color-scheme 메타에 dark 가 남아 있다`);
      light += 1;
    }
    pages += 1;
  }
}
// T-261013-004: 공용 tokens.css 는 https://kangdaejong.com 에서 온다. www·다른 경로에서 그 파일을 막는 CSP 가 있으면
// 페이지가 색 없이 뜬다(실사고: www.kangdaejong.com/photo/ 의 style-src 'self'). style-src 를 가진 모든 CSP 가 그 주소를 허용해야 한다.
for (const line of fs.readFileSync('public/_headers', 'utf8').split('\n')) {
  const csp = line.match(/Content-Security-Policy:\s*(.*)$/i);
  if (!csp) continue;
  const style = csp[1].split(';').map((s) => s.trim()).find((s) => s.startsWith('style-src'));
  if (style && !style.split(/\s+/).includes('https://kangdaejong.com')) errors.push(`public/_headers: style-src 가 공용 tokens.css 주소를 막는다 — ${style}`);
}
if (errors.length) {
  console.error(errors.slice(0, 30).join('\n'));
  console.error(`dark/card verification failed: ${errors.length} problems in ${pages} pages`);
  process.exit(1);
}
console.log(`dark/card verification passed: ${pages} pages use the shared card (${SHARED.split('?')[1]} or fixed) and read the shared tokens.css; ${light} company-home pages are light-only, protein follows the device`);
