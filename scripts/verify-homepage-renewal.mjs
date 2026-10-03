import { readFileSync } from 'node:fs';
const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const home = read('src/pages/index.astro');
const data = read('src/data/home.ts');
const archive = read('src/pages/archive.astro');
const checks = [
 ['single home keeps all destinations', ['projects','products','books','open-tools','contact','company'].every(id => home.includes(`id="${id}"`))],
 ['chapter navigation is gone', !home.includes('ProjectVersions') && !home.includes('/archive/')],
 ['old archive forwards query and fragment', archive.includes('window.location.replace') && archive.includes('window.location.search') && archive.includes('window.location.hash')],
 ['edge redirects old archive', read('public/_redirects').includes('/archive/ / 301')],
 ['six active apps remain', ['한줄일기','메모요','더치페이 계산기','약먹자','심플 가계부','계산기알람'].every(name => data.includes(name))],
 ['retired apps are not promoted', !/단어요|한컵|포모도로|첫이름|한장택일|한장궁합/.test(home + data)],
 ['three book destinations remain', ['786557','786749','798202'].every(id => data.includes('https://kmong.com/gig/' + id))],
 ['four bridge repos and releases remain', ['grok','codex','claude','cursor'].every(name => data.includes(`ssamssae/${name}-telegram-bridge`) && data.includes(`ssamssae/${name}-telegram-bridge/releases`))],
 ['optional content and contact remain', home.includes('<MoodCorner') && home.includes('<SocialBanner compact') && home.includes('<StudioFooter compact')],
 ['business details remain', read('src/components/StudioFooter.astro').includes('878-21-02478')],
];
const failed = checks.filter(([,ok]) => !ok);
if (failed.length) { failed.forEach(([label]) => console.error(label)); process.exit(1); }
console.log(`Homepage renewal verification passed (${checks.length} checks)`);
