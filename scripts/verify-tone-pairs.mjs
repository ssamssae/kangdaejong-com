import { readFileSync } from 'node:fs';
const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const css = read('src/styles/home-simple.css');
const home = read('src/pages/index.astro');
const checks = [
 ['home opts into scoped styling', home.includes("../styles/home-simple.css") && home.includes('bodyClass="simple-home"')],
 ['neutral canvas and blue link color are defined', /--bg:#fff/.test(css) && /--fg:#242930/.test(css) && /--accent:#2458cc/.test(css)],
 ['responsive layout covers narrow screens', /max-width:650px/.test(css) && /max-width:360px/.test(css)],
 ['focus and reduced-motion styles remain', css.includes(':focus-visible') && css.includes('prefers-reduced-motion:reduce')],
 ['home avoids chapter and legacy photographic layout', !/ProjectVersions|sales-hero|hero-desk/.test(home)],
];
const failed = checks.filter(([,ok]) => !ok);
if (failed.length) { failed.forEach(([label]) => console.error(label)); process.exit(1); }
console.log(`Home tone verification passed (${checks.length} checks; rendered contrast is checked in site-renewal.spec.mjs)`);
