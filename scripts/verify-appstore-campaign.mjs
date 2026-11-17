// T-261117-097: 빌드 결과의 우리 앱 App Store 링크마다 홈페이지 캠페인 표식(pt·ct·mt)이 있는지 본다.
// 사용: node scripts/verify-appstore-campaign.mjs [--dist <폴더>]  (기본 dist)
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { OUR_APP_IDS } from '../src/lib/app-store-link.mjs';

const REQUIRED = { pt: '128771490', ct: 'homepage', mt: '8' };
const args = process.argv.slice(2);
const distArg = args.includes('--dist') ? args[args.indexOf('--dist') + 1] : 'dist';
if (!distArg) { console.error('--dist 뒤에 폴더 경로가 필요합니다'); process.exit(1); }
const dist = resolve(distArg);
if (!existsSync(dist)) { console.error(`${dist} 없음 — 먼저 npm run build`); process.exit(1); }

const htmlFiles = dir => readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
  const path = join(dir, entry.name);
  if (entry.isDirectory()) return htmlFiles(path);
  return entry.isFile() && entry.name.endsWith('.html') ? [path] : [];
});

const ours = new Set(OUR_APP_IDS);
const missing = [];
let checked = 0;
for (const file of htmlFiles(dist)) {
  const html = readFileSync(file, 'utf8');
  for (const [, href] of html.matchAll(/href=["'](https:\/\/apps\.apple\.com\/[^"']*)["']/gi)) {
    const url = new URL(href.replaceAll('&amp;', '&'));
    const id = url.pathname.match(/\/id(\d+)/)?.[1];
    if (!id || !ours.has(id)) continue;
    checked++;
    const absent = Object.entries(REQUIRED).filter(([key, value]) => url.searchParams.get(key) !== value).map(([key, value]) => `${key}=${value}`);
    if (absent.length) missing.push(`${relative(dist, file)}: id${id} — 빠진 표식 ${absent.join(', ')}`);
  }
}

if (!checked) { console.error(`${dist} 안에 우리 앱 App Store 링크가 하나도 없습니다 — 검사 대상이 사라졌습니다`); process.exit(1); }
if (missing.length) { missing.forEach(line => console.error(line)); process.exit(1); }
console.log(`App Store campaign verification passed (${checked} links)`);
