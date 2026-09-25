import { test,expect } from '@playwright/test';
import { createRequire } from 'node:module';
const sharp=createRequire(new URL('../photo-app/package.json',import.meta.url))('sharp');
import { readFile,mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { unzipSync } from 'fflate';
const sample=await sharp({create:{width:400,height:300,channels:4,background:{r:120,g:90,b:60,alpha:.5}}}).png().toBuffer();
async function applyPhoto(page,file){await page.locator('#files').setInputFiles(file);await page.locator('#process').click();await expect(page.locator('#status')).toContainText('보정 완료');}
test('public categories process locally, preserve alpha, save PNG/ZIP and erase on reload',async({page},info)=>{
  const errors=[],writes=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.method()!=='GET')writes.push(r.url());});await page.goto('/photo/');await expect(page).toHaveTitle(/사진꾸러미/);await expect(page.getByRole('button',{name:/로그인|결제/})).toHaveCount(0);
  for(const category of ['인물 · 셀카','쇼핑몰 상품','음식 · 숙소']){await page.getByRole('button',{name:new RegExp('^'+category)}).click();await applyPhoto(page,{name:'sample.png',mimeType:'image/png',buffer:sample});}
  await expect(page.locator('.result-card')).toHaveCount(3);const slider=page.locator('.result-card input').first();await slider.fill('25');await slider.dispatchEvent('input');await expect(page.locator('.before').first()).toHaveCSS('clip-path','inset(0px 75% 0px 0px)');
  const pending=page.waitForEvent('download');await page.getByRole('link',{name:'PNG 다운로드'}).first().click();const download=await pending;expect(download.suggestedFilename()).toMatch(/^sajin-kureomi-.+\.png$/);const bytes=await readFile(await download.path()),meta=await sharp(bytes).metadata();expect(meta.width).toBe(400);expect(meta.height).toBe(300);expect(meta.exif).toBeUndefined();const pixel=await sharp(bytes).raw().toBuffer();expect(pixel[0]).toBeGreaterThan(120);expect(pixel[3]).toBe(128);
  const zipPending=page.waitForEvent('download');await page.getByRole('button',{name:'결과 전체 ZIP 받기'}).click();const zip=await zipPending;expect(zip.suggestedFilename()).toBe('sajin-kureomi.zip');expect(Object.keys(unzipSync(await readFile(await zip.path())))).toHaveLength(3);
  const evidence=process.env.PHOTO_EVIDENCE_DIR??info.outputPath('screens');await mkdir(evidence,{recursive:true});await page.screenshot({path:join(evidence,`${info.project.name}-public.png`),fullPage:true});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.getByRole('button',{name:'지우기',exact:true}).first().click();await expect(page.locator('.result-card')).toHaveCount(2);await page.reload();await expect(page.locator('.result-card')).toHaveCount(0);expect(writes).toEqual([]);expect(errors).toEqual([]);
});
test('JPEG orientation, WebP, corrupt input and local style deletion',async({page})=>{
  await page.goto('/photo/');const rotated=await sharp({create:{width:120,height:80,channels:3,background:'#765432'}}).withMetadata({orientation:6}).jpeg().toBuffer();await applyPhoto(page,{name:'rotated.jpg',mimeType:'image/jpeg',buffer:rotated});await expect(page.locator('.result-top')).toContainText('80×120');
  const webp=await sharp(sample).webp({lossless:true}).toBuffer();await applyPhoto(page,{name:'alpha.webp',mimeType:'image/webp',buffer:webp});await expect(page.locator('.result-card')).toHaveCount(2);
  await applyPhoto(page,{name:'bad.png',mimeType:'image/png',buffer:Buffer.from('<svg/>')});await expect(page.locator('#queue')).toContainText('움직이지 않는');await expect(page.locator('.result-card')).toHaveCount(2);
  await page.locator('#strength').fill('75');page.once('dialog',d=>d.accept('내 상품 스타일'));await page.getByRole('button',{name:'현재 스타일 저장'}).click();await page.reload();await page.locator('#saved-style').selectOption({label:'내 상품 스타일'});await expect(page.locator('#strength')).toHaveValue('75');await page.getByRole('button',{name:'선택한 스타일 지우기'}).click();await page.reload();await expect(page.locator('#saved-style option')).toHaveCount(1);
});
