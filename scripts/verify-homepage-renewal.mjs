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
 ['retired apps are not promoted', !/단어요|한컵|포모도로|한장택일|한장궁합/.test(home + data)],
 ['Cheotireum paid web service is promoted', home.includes('첫이름') && home.includes('data-product-id="cheotireum"') && home.includes('https://cheotireum.kangdaejong.com/?src=kdj-card')],
 ['Cheotireum sample, Hanja check and guide remain reachable', home.includes('https://cheotireum.kangdaejong.com/sample-report?src=kdj-sample') && home.includes('https://cheotireum.kangdaejong.com/hanja-check?src=kdj-hanja') && home.includes('href="/cheotireum/"')],
 ['free books link to public PDFs', !data.includes('kmong.com/gig/') && (data.match(/\/books\/[a-z-]+\.pdf/g) || []).length === 3 && !home.includes('판매 종료') && home.includes('무료로 읽기')],
 ['four bridge repos and releases remain', ['grok','codex','claude','cursor'].every(name => data.includes(`ssamssae/${name}-telegram-bridge`) && data.includes(`ssamssae/${name}-telegram-bridge/releases`))],
 // T-261120-020: 홈의 연락 칸과 「잠깐 쉬어가기」는 뺐다. 연락은 공용 꼬리말이 맡고, 머리말 「연락」(#contact)은 꼬리말에 닿는다.
 ['contact lives in the shared footer and the #contact anchor still lands', home.includes('<mb-footer tone="studio" id="contact"') && !home.includes('<MoodCorner') && !home.includes('<SocialBanner') && (read('public/mb-components.js').split('class MbFooter')[1] || '').includes('mailto:minusbetastudio@gmail.com')],
 ['business details remain', (read('public/mb-components.js').split('class MbFooter')[1] || '').includes('878-21-02478')],
];
const failed = checks.filter(([,ok]) => !ok);
if (failed.length) { failed.forEach(([label]) => console.error(label)); process.exit(1); }
console.log(`Homepage renewal verification passed (${checks.length} checks)`);
