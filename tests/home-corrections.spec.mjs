import {test, expect} from '@playwright/test';
import icons from '../public/brand/products/catalog.json' with {type:'json'};
import {fileURLToPath} from 'node:url';
import { rgb } from './brand-colors.mjs';
test.beforeEach(async({page})=>{
 await page.route('https://kangdaejong.com/brand/products/*.webp',route=>route.fulfill({path:fileURLToPath(new URL('../public'+new URL(route.request().url()).pathname,import.meta.url))}));
});
for(const width of [390,1440]) test(`home corrections and organization tone at ${width}`,async({page})=>{
 await page.setViewportSize({width,height:900}); await page.goto('/');
 await expect(page.locator('main')).not.toContainText('문의노트');
 for(const name of ['한줄일기','메모요','나눠요','약먹자','심플 가계부','계산기알람','살아있음','우리 사이','노래찾기']) {
  const row=page.locator('.app-row').filter({has:page.getByRole('heading',{name,exact:true})});
  const image=row.locator('img'); await expect(image).toHaveCount(1);
  await expect(image).toHaveAttribute('src',icons.products.find(i=>i.name===name)?.icon || 'missing-icon');
  await image.scrollIntoViewIfNeeded(); await expect.poll(()=>image.evaluate(i=>i.complete&&i.naturalWidth>0)).toBe(true);
 }
 const home=await page.evaluate(()=>({bg:getComputedStyle(document.body).backgroundColor,font:getComputedStyle(document.body).fontFamily,width:document.querySelector('main').getBoundingClientRect().width}));
 await page.goto('/organization/');
 const company=await page.evaluate(()=>({bg:getComputedStyle(document.body).backgroundColor,font:getComputedStyle(document.body).fontFamily,width:document.querySelector('main').getBoundingClientRect().width}));
 expect(company).toEqual(home);
 await expect(page.locator('h1 span')).toHaveCSS('color',rgb('light','--accent'));
 await expect(page.locator('dl')).toContainText('878-21-02478');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:test.info().outputPath(`organization-${width}.png`),fullPage:true});
});
// T-261120-020: 홈의 「이야기를 나눠요」「잠깐 쉬어가기」 칸을 뺐다. 연락은 공용 꼬리말이 맡는다.
test('the contact strip and pause corner are gone and 연락 lands on the shared footer',async({page})=>{
 await page.setViewportSize({width:1280,height:900}); await page.goto('/');
 await expect(page.locator('main')).not.toContainText(/이야기를 나눠요|잠깐 쉬어가기/);
 await expect(page.locator('main .contact-section, main .pause-details, main #mood')).toHaveCount(0);
 await expect(page.locator('mb-footer#contact a[href="mailto:minusbetastudio@gmail.com"]')).toBeVisible();
 await page.locator('mb-header').getByRole('link',{name:'연락'}).click();
 await expect(page).toHaveURL(/#contact$/);
 await expect(page.locator('mb-footer')).toBeInViewport();
 for(const id of ['company','choso']) await expect(page.locator(`#${id}`)).toBeAttached();
});
