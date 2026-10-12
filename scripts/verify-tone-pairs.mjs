import { readFileSync } from 'node:fs';
const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const css = read('src/styles/home-simple.css');
const shared = read('public/brand/current/tokens.css');
const home = read('src/pages/index.astro');
const checks = [
 ['home opts into scoped styling', home.includes("../styles/home-simple.css") && home.includes('bodyClass="simple-home"')],
 // T-261013-004: 색은 공용 원본(public/brand/current/tokens.css)에만 있다 — 홈 전용 스타일은 이름만 쓰고 색을 다시 정의하지 않는다.
 ['home uses the shared palette without local color copies', !/--(bg|fg|accent)\s*:/.test(css) && /--bg:\s*#/.test(shared) && /--fg:\s*#/.test(shared) && /--accent:\s*#/.test(shared)],
 ['responsive layout covers narrow screens', /max-width:650px/.test(css) && /max-width:360px/.test(css)],
 ['focus and reduced-motion styles remain', css.includes(':focus-visible') && css.includes('prefers-reduced-motion:reduce')],
 ['home avoids chapter and legacy photographic layout', !/ProjectVersions|sales-hero|hero-desk/.test(home)],
];
const failed = checks.filter(([,ok]) => !ok);
if (failed.length) { failed.forEach(([label]) => console.error(label)); process.exit(1); }
console.log(`Home tone verification passed (${checks.length} checks; rendered contrast is checked in site-renewal.spec.mjs)`);
