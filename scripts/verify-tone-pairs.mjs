import { readFileSync } from 'node:fs';
const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const css = read('src/styles/home-simple.css');
const shared = read('public/brand/current/tokens.css');
const home = read('src/pages/index.astro');
const banner = read('src/components/InsightBanner.astro');
// T-261024-028: 사이트 자기 값·하위 페이지 공용 스타일도 공용 톤 파일에 연결돼 있어야 한다.
const siteTokens = read('src/styles/tokens.css');
const studio = read('public/studio-page.css');
// T-261024-050: 회사 홈은 라이트 고정(SiteLayout 기본 "light", "auto" 는 단백질 도감만), 공용 부품(입력칸·링크·표·접기)도 원본에 있어야 한다.
const layout = read('src/layouts/SiteLayout.astro');
const components = read('public/mb-components.js');
const execFileSync = (await import('node:child_process')).execFileSync;
// T-261024-058: 다크 모드는 없다 — theme="auto" 를 넘기는 파일이 0 이어야 한다(git grep 은 0건이면 rc=1 이라 빈 목록으로 받는다).
const autoPages = (() => { try { return execFileSync('git', ['grep', '-l', 'theme="auto"', '--', 'src'], { encoding: 'utf8' }).split('\n').filter(Boolean); } catch { return []; } })();
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
 ['shared tone file holds the shared parts', ['.mb-btn {', '.mb-btn.mb-btn--primary,', '.mb-btn.mb-btn--secondary,', '.mb-card {', '.mb-chip.mb-chip {', '.mb-eyebrow.mb-eyebrow {'].every((part) => shared.includes(part))],
 // T-261024-050: 첫이름 입력칸·글 링크·표·접기·이름값 줄·폭 부품과 900px 이상 값도 원본에 있다.
 ['shared tone file holds the input, link, table, faq and shell parts', ['.mb-shell {', '.mb-prose {', '.mb-link.mb-link {', '.mb-field {', '.mb-label.mb-label {', '.mb-input.mb-input, .mb-textarea.mb-textarea, .mb-select.mb-select {', '.mb-option.mb-option {', '.mb-table.mb-table {', '.mb-faq.mb-faq {', '.mb-row.mb-row {'].every((part) => shared.includes(part)) && toneValue('page-max', '1080px') && toneValue('header-height', '64px') && toneValue('section-gap', '56px') && new RegExp('@media \\(min-width: 900px\\) \\{\\s*:root \\{[^}]*' + '--tone-' + 'gutter: 32px').test(shared)],
 // T-261024-058: 전부 라이트 — 레이아웃이 data-theme="light"·color-scheme light 를 고정으로 내보내고, theme="auto" 를 넘기는 페이지가 없고, 원본에 다크 블록이 없다.
 ['every page is light-only and the shared tone file has no dark block', /<html lang="ko" data-theme="light">/.test(layout) && /<meta name="color-scheme" content="light" \/>/.test(layout) && autoPages.length === 0 && !/prefers-color-scheme\s*:\s*dark|\[data-theme/.test(shared.replace(/\/\*[\s\S]*?\*\//g, ''))],
 ['shared header and footer read the tone names instead of numbers', ['min-height:var(--tone-header-height)', 'var(--tone-label-size)/var(--tone-label-line) var(--tone-font)', 'border-radius:var(--tone-radius-sheet)', 'width:min(calc(100% - var(--tone-gutter) * 2),var(--mb-max))'].every((part) => components.includes(part)) && !/min-height:9[45]px|font-size:1[0-3]px|border-radius:9px/.test(components)],
 ['home buttons and chips use the shared parts', home.includes('mb-btn mb-btn--primary') && home.includes('mb-btn mb-btn--secondary') && home.includes('mb-chip') && banner.includes('mb-btn mb-btn--primary')],
 ['home keeps no local copies of tone values', ![css, banner].some((text) => /border-radius:\s*(14|20)px|min-height:\s*5[26]px/.test(text))],
 ['generic home link hover skips shared buttons', css.includes('.simple-home a:not(.mb-btn):hover')],
 ['site tokens connect to the shared tone file', ['--sans: var(--tone-font)', '--radius-card: var(--tone-radius-card)', '--radius-btn: var(--tone-radius-control)', '--radius-pill: var(--tone-radius-pill)', '--text-body: var(--tone-body-size)'].every((link) => siteTokens.includes(link))],
 ['shared subpage styles connect to the shared tone file', ['body.studio-page{font-family:var(--tone-font)', '.studio-card{border:0;border-radius:var(--tone-radius-card)', 'a.r-button{min-height:var(--tone-control-height)', 'font-size:var(--tone-body-size);line-height:var(--tone-body-line)', 'mb-header:not(:defined){display:block;min-height:calc(var(--tone-header-height) + 1px)}'].every((link) => studio.includes(link)) && !/font-size:\d+px|border-radius:\d+px|padding:\d+px/.test(studio)],
 ['company home connects its page width to the shared tone width', siteTokens.includes('--page-max: var(--tone-page-max)') && css.includes('calc(100% - var(--tone-gutter) * 2)')],
 ['home avoids chapter and legacy photographic layout', !/ProjectVersions|sales-hero|hero-desk/.test(home)],
];
const failed = checks.filter(([,ok]) => !ok);
if (failed.length) { failed.forEach(([label]) => console.error(label)); process.exit(1); }
console.log(`Home tone verification passed (${checks.length} checks; rendered contrast is checked in site-renewal.spec.mjs)`);
