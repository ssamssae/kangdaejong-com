import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('sitemap advertises current canonical pages only', async () => {
  const xml=await readFile('dist/sitemap.xml','utf8');
  const urls=[...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]).sort();
  const paths=['/','/ipta/','/organization/','/system/','/our-sai/','/our-sai/privacy/','/our-sai/support/','/our-sai/terms/','/privacy-stillhere/','/support-stillhere/'];
  expect(urls).toEqual(paths.map(p=>'https://kangdaejong.com'+p).sort());
});
test('unknown addresses have a usable custom 404 artifact', async ({page}) => {
  expect(await readFile('dist/404.html','utf8')).toContain('페이지를 찾을 수 없습니다');
  const response=await page.goto('/missing-audit-route/');expect(response.status()).toBe(404);
  await expect(page.getByRole('heading',{name:'페이지를 찾을 수 없습니다.'})).toBeVisible();
  await expect(page.getByRole('link',{name:'홈으로 돌아가기'})).toHaveAttribute('href','/');
});
test('download buttons keep readable contrast including hover', async ({page}) => {
  await page.goto('/ipta/');
  for(const button of await page.locator('.r-button').all()){
    for(const hover of [false,true]){
      if(hover)await button.hover();
      const ratio=await button.evaluate(e=>{
        const s=getComputedStyle(e);const lum=c=>c.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);
        const a=lum(s.color),b=lum(s.backgroundColor);return(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
      });expect(ratio).toBeGreaterThanOrEqual(4.5);
    }
  }
});
test('mobile books show retirement status without false links', async ({page}) => {
  await page.setViewportSize({width:320,height:850});await page.goto('/');
  for(const status of await page.locator('.book-action').all())await expect(status).toBeVisible();
  expect(await page.locator('.book-row strong').first().evaluate(e=>getComputedStyle(e,'::after').content)).not.toContain('↗');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await expect(page.locator('a[href*="callta.kangdaejong.com"]')).toHaveCount(0);
  await expect(page.getByRole('link',{name:'인사이트 모아보기'})).toBeVisible();
});
