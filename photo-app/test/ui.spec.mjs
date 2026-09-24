import { test, expect } from '@playwright/test';
import sharp from 'sharp';
import { readFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { unzipSync } from 'fflate';
const sample=await sharp(Buffer.from('<svg width="720" height="540" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="a"><stop stop-color="#857855"/><stop offset="1" stop-color="#cdc3a1"/></linearGradient></defs><rect width="720" height="540" fill="url(#a)"/><rect y="390" width="720" height="150" fill="#847961"/><ellipse cx="400" cy="407" rx="150" ry="25" fill="#5c5747"/><rect x="270" y="210" width="200" height="200" rx="32" fill="#b48662"/><path d="M365 220V80M365 150Q250 40 300 140ZM365 160Q490 60 445 165Z" fill="#657853" stroke="#475536" stroke-width="7"/></svg>')).png().toBuffer();
async function signup(page){await page.getByRole('button',{name:'로그인 / 시작하기'}).click();await page.getByLabel('아이디',{exact:true}).fill('ui-'+Date.now().toString(36));await page.getByLabel('비밀번호',{exact:true}).fill('test-only-password-123');await page.getByRole('button',{name:'무료 3장으로 시작하기',exact:true}).click();await expect(page.locator('#account-dialog')).not.toBeVisible();await expect(page.locator('#balance')).toContainText('3크레딧');}
test('three categories, real correction, compare, download, ZIP, reload and deletion',async({page},info)=>{
  const evidence=process.env.PHOTO_EVIDENCE_DIR??info.outputPath('screenshots');await mkdir(evidence,{recursive:true});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));await page.goto('/');
  await expect(page.getByRole('heading',{name:'어떤 사진을 다듬을까요?'})).toBeVisible();
  await page.screenshot({path:join(evidence,`${info.project.name}-landing.png`),fullPage:true});
  await signup(page);
  for(const [category,preset] of [['인물 · 셀카','soft'],['쇼핑몰 상품','clean'],['음식 · 숙소','food']]){
    await page.getByRole('button',{name:new RegExp('^'+category.replace(' · ',' · '))}).click();await page.locator('#preset').selectOption(preset);
    await page.locator('#files').setInputFiles({name:'test-still-life.png',mimeType:'image/png',buffer:sample});await expect(page.locator('#estimate')).toContainText('총 1크레딧');await page.locator('#process').click();await expect(page.locator('#status')).toContainText('1장 보정 완료');
  }
  await expect(page.locator('.result-card')).toHaveCount(3);await expect(page.locator('#balance')).toContainText('0크레딧');
  const slider=page.locator('.result-card input[type=range]').first();await slider.fill('25');await slider.dispatchEvent('input');await expect(page.locator('.before').first()).toHaveCSS('clip-path','inset(0px 75% 0px 0px)');await expect(page.locator('.compare img:not(.before)').first()).toHaveCSS('clip-path','inset(0px 0px 0px 25%)');
  const downloadPromise=page.waitForEvent('download');await page.getByRole('link',{name:'PNG 다운로드'}).first().click();const download=await downloadPromise;const bytes=await readFile(await download.path());expect((await sharp(bytes).metadata()).format).toBe('png');expect(bytes.equals(sample)).toBe(false);
  const zipPromise=page.waitForEvent('download');await page.getByRole('button',{name:'결과 전체 ZIP 받기'}).click();const zip=await zipPromise;expect(Object.keys(unzipSync(await readFile(await zip.path())))).toHaveLength(3);
  await page.reload();await expect(page.locator('.result-card')).toHaveCount(3);await expect(page.locator('#balance')).toContainText('0크레딧');
  await page.locator('#results-section').scrollIntoViewIfNeeded();await page.screenshot({path:join(evidence,`${info.project.name}-results.png`),fullPage:true});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  page.once('dialog',dialog=>dialog.accept());await page.getByRole('button',{name:'삭제',exact:true}).first().click();await expect(page.locator('.result-card')).toHaveCount(2);
  await page.getByRole('button',{name:'내 계정',exact:true}).click();page.once('dialog',dialog=>dialog.accept());await page.getByRole('button',{name:'계정과 사진 모두 삭제'}).click();await expect(page.locator('#balance')).toHaveText('가입하면 무료 3크레딧');await expect(page.locator('#results-section')).not.toBeVisible();expect(errors).toEqual([]);
});
test('batch cost, failure refund and no accidental paid checkout',async({page})=>{
  await page.goto('/');await signup(page);await expect(page.getByRole('button',{name:'유료 이용 준비 중'})).toHaveCount(2);for(const button of await page.getByRole('button',{name:'유료 이용 준비 중'}).all())await expect(button).toBeDisabled();
  await page.locator('#files').setInputFiles([{name:'a.png',mimeType:'image/png',buffer:sample},{name:'b.png',mimeType:'image/png',buffer:sample}]);await expect(page.locator('#estimate')).toContainText('총 2크레딧');await page.locator('#process').click();await expect(page.locator('#status')).toContainText('2장 보정 완료');await expect(page.locator('#balance')).toContainText('1크레딧');
  await page.locator('#files').setInputFiles({name:'broken.png',mimeType:'image/png',buffer:Buffer.from('invalid image')});await page.locator('#process').click();await expect(page.locator('#status')).toContainText('읽을 수 없는 사진');await expect(page.locator('#balance')).toContainText('1크레딧');
});
