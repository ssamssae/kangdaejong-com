import { test,expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

test('retired photo page preserves styles and offers only notice, contact and home',async({page},info)=>{
 const errors=[],writes=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('request',r=>{if(r.method()!=='GET')writes.push(r.url());});
 await page.addInitScript(()=>localStorage.setItem('sajin-kureomi:styles:v1','preserved'));
 const response=await page.goto('/photo/?payment=success');
 if(process.env.PHOTO_PUBLIC_URL)expect(response.status()).toBe(410);
 await expect(page.getByRole('heading',{name:'사진꾸러미 서비스를 종료했습니다.'})).toBeVisible();
 await expect(page.getByText(/2026년 9월 30일부터/)).toBeVisible();
 await expect(page.getByText('호스팅 서비스 제공자 Cloudflare, Inc.')).toBeVisible();
 await expect(page.locator('input,button,canvas,form')).toHaveCount(0);
 await expect(page.locator('script:not([src*="email-decode"])')).toHaveCount(0);
 expect(await page.evaluate(()=>localStorage.getItem('sajin-kureomi:styles:v1'))).toBe('preserved');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 expect(errors).toEqual([]);expect(writes).toEqual([]);
 const evidence=process.env.PHOTO_EVIDENCE_DIR??info.outputPath('screens');await mkdir(evidence,{recursive:true});
 await page.screenshot({path:join(evidence,`${info.project.name}-closed.png`),fullPage:true});
 await expect(page.getByRole('link',{name:'마이너스베타스튜디오 홈으로'})).toHaveAttribute('href','https://kangdaejong.com/');
 if(process.env.PHOTO_PUBLIC_URL)await page.getByRole('link',{name:'마이너스베타스튜디오 홈으로'}).click();else await page.goto('/');
 await expect(page.locator('a[href="/photo/"],a[href="/logo/"],a[href="https://logo.kangdaejong.com/"]')).toHaveCount(0);
 await expect(page.locator('body')).toContainText('마이너스베타스튜디오');
});
