import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { readBrandTokens, shareCardStamp } from './brand-tokens.mjs';
// Reuse the approved current logo; only the share-card layout follows the homepage.
// T-261012-032: 공유 카드는 보는 사람 설정과 무관한 그림 한 장이라 라이트·다크 겸용 1장이다.
// T-261024-030: 회사홈 밝은 톤(공용 톤 파일의 라이트 값 = 첫이름 값)으로 그린다. 문구는 해요체.
const logo = readFileSync('public/brand/current/logo.svg', 'utf8');
// T-261013-004: 색은 공용 원본 값(T-261024-030 부터 라이트). 그린 색의 지문을 social.tokens 에 남겨, 원본 색이 바뀌었는데 다시 안 그리면 빌드가 멈춘다.
const c = readBrandTokens().light;
const browser = await chromium.launch({headless:true});
try {
  const page = await browser.newPage({viewport:{width:1200,height:630},deviceScaleFactor:1});
  await page.setContent(`<style>*{box-sizing:border-box}body{margin:0;background:${c['--bg']};color:${c['--fg']};font-family:'Apple SD Gothic Neo',sans-serif;padding:64px 80px;width:1200px;height:630px}header{display:flex;align-items:center;gap:20px;font-size:25px}header svg{width:62px;height:62px}small{display:block;font-size:15px;color:${c['--fg-mute']};margin-top:5px}h1{font-size:68px;line-height:1.3;letter-spacing:-4px;font-weight:600;margin:64px 0 20px}h1 span{color:${c['--accent']}}p{font-size:25px;letter-spacing:-.6px;color:${c['--fg-dim']};margin:0}footer{margin-top:46px;padding-top:24px;border-top:1px solid ${c['--border']};font-size:19px;color:${c['--fg-mute']}}</style><header>${logo}<div>강대종<small>마이너스베타스튜디오</small></div></header><h1>만들고, 써 보고,<br/><span>다듬어요.</span></h1><p>직접 만드는 작은 도구와 일상의 앱.</p><footer>kangdaejong.com</footer>`);
  await page.evaluate(()=>document.fonts.ready);
  const bytes=await page.screenshot();
  writeFileSync('public/brand/current/social.png',bytes);
  writeFileSync('public/brand/current/social.tokens',`${shareCardStamp()}\n`);
  const manifest=JSON.parse(readFileSync('public/brand/manifest.json','utf8'));
  manifest.files['social.png'].sha256=createHash('sha256').update(bytes).digest('hex');
  manifest.version=createHash('sha256').update(JSON.stringify(manifest.files)).digest('hex').slice(0,16);
  writeFileSync('public/brand/manifest.json',JSON.stringify(manifest,null,2)+'\n');
} finally { await browser.close(); }
