import {test,expect} from '@playwright/test';
for(const key of ['logo-draft','logo-order','logo-payment'])test(`closure preserves existing ${key}`,async({page})=>{
 await page.addInitScript(key=>localStorage.setItem(key,'preserved'),key);
 await page.goto('/logo/?payment=success');
 await expect(page.getByRole('heading',{name:'로고꾸러미 서비스를 종료했습니다.'})).toBeVisible();
 expect(await page.evaluate(key=>localStorage.getItem(key),key)).toBe('preserved');
});
