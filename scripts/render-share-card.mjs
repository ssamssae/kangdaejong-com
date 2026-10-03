import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
// Reuse the approved current logo; only the share-card layout follows the homepage.
const logo = readFileSync('public/brand/current/logo.svg', 'utf8');
const browser = await chromium.launch({headless:true});
try {
  const page = await browser.newPage({viewport:{width:1200,height:630},deviceScaleFactor:1});
  await page.setContent(`<style>*{box-sizing:border-box}body{margin:0;background:white;color:#242930;font-family:'Apple SD Gothic Neo',sans-serif;padding:64px 80px;width:1200px;height:630px}header{display:flex;align-items:center;gap:20px;font-size:25px}header svg{width:62px;height:62px}small{display:block;font-size:15px;color:#69717d;margin-top:5px}h1{font-size:68px;line-height:1.3;letter-spacing:-4px;font-weight:600;margin:64px 0 20px}h1 span{color:#2458cc}p{font-size:25px;letter-spacing:-.6px;color:#626b78;margin:0}footer{margin-top:46px;padding-top:24px;border-top:1px solid #e6e8ed;font-size:19px;color:#69717d}</style><header>${logo}<div>강대종<small>마이너스베타스튜디오</small></div></header><h1>만들고, 써 보고,<br/><span>다듬습니다.</span></h1><p>직접 만드는 작은 도구와 일상의 앱.</p><footer>kangdaejong.com</footer>`);
  await page.evaluate(()=>document.fonts.ready);
  const bytes=await page.screenshot();
  writeFileSync('public/brand/current/social.png',bytes);
  const manifest=JSON.parse(readFileSync('public/brand/manifest.json','utf8'));
  manifest.files['social.png'].sha256=createHash('sha256').update(bytes).digest('hex');
  manifest.version=createHash('sha256').update(JSON.stringify(manifest.files)).digest('hex').slice(0,16);
  writeFileSync('public/brand/manifest.json',JSON.stringify(manifest,null,2)+'\n');
} finally { await browser.close(); }
