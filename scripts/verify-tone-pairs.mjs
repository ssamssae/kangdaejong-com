import { readFileSync } from 'node:fs';
const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const css = read('src/styles/home-simple.css');
const shared = read('public/brand/current/tokens.css');
const home = read('src/pages/index.astro');
const banner = read('src/components/InsightBanner.astro');
// T-261024-026: 공용 톤 값 이름은 문자열로 만든다 — 이 파일 자체가 톤 값 복사본으로 잡히지 않게.
const toneValue = (name, value) => new RegExp(`--tone-${name}\\s*:\\s*${value}`).test(shared);
const checks = [
 ['home opts into scoped styling', home.includes("../styles/home-simple.css") && home.includes('bodyClass="simple-home"')],
 // T-261013-004: 색은 공용 원본(public/brand/current/tokens.css)에만 있다 — 홈 전용 스타일은 이름만 쓰고 색을 다시 정의하지 않는다.
 ['home uses the shared palette without local color copies', !/--(bg|fg|accent)\s*:/.test(css) && /--bg:\s*#/.test(shared) && /--fg:\s*#/.test(shared) && /--accent:\s*#/.test(shared)],
 ['responsive layout covers narrow screens', /max-width:650px/.test(css) && /max-width:360px/.test(css)],
 ['focus and reduced-motion styles remain', css.includes(':focus-visible') && css.includes('prefers-reduced-motion:reduce')],
 // T-261024-026: 공용 톤 파일 — 토스 톤(첫이름) 값과 공용 부품이 원본에 있고, 홈은 숫자를 다시 적지 않고 그 값·부품을 쓴다.
 ['shared tone file holds the Toss tone values', toneValue('radius-control', '14px') && toneValue('radius-card', '20px') && toneValue('control-height', '56px') && toneValue('body-size', '17px')],
 ['shared tone file holds the shared parts', ['.mb-btn {', '.mb-btn--primary', '.mb-btn--secondary', '.mb-card {', '.mb-chip {', '.mb-eyebrow {'].every((part) => shared.includes(part))],
 ['home buttons and chips use the shared parts', home.includes('mb-btn mb-btn--primary') && home.includes('mb-btn mb-btn--secondary') && home.includes('mb-chip') && banner.includes('mb-btn mb-btn--primary')],
 ['home keeps no local copies of tone values', ![css, banner].some((text) => /border-radius:\s*(14|20)px|min-height:\s*5[26]px/.test(text))],
 ['generic home link hover skips shared buttons', css.includes('.simple-home a:not(.mb-btn):hover')],
 ['home avoids chapter and legacy photographic layout', !/ProjectVersions|sales-hero|hero-desk/.test(home)],
];
const failed = checks.filter(([,ok]) => !ok);
if (failed.length) { failed.forEach(([label]) => console.error(label)); process.exit(1); }
console.log(`Home tone verification passed (${checks.length} checks; rendered contrast is checked in site-renewal.spec.mjs)`);
