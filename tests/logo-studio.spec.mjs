import {test,expect} from '@playwright/test';
for(const path of ['/logo/','/logo/terms/','/logo/privacy/'])test(`retired page ${path} has no editor or checkout`,async({page})=>{
 const calls=[];page.on('request',r=>{if(r.url().includes('/logo/api/')||r.url().includes('tosspayments'))calls.push(r.url());});
 await page.goto(path);await expect(page.getByRole('heading',{name:'로고꾸러미 서비스를 종료했습니다.'})).toBeVisible();
 await expect(page.locator('input,button')).toHaveCount(0);expect(calls).toEqual([]);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('homepage removes the retired service and keeps photo service',async({page})=>{
 await page.goto('/');await expect(page.locator('a[href="https://logo.kangdaejong.com/"]')).toHaveCount(0);
 await expect(page.locator('a[href="/photo/"]')).toBeVisible();
});
