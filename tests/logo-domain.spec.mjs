import {test,expect} from '@playwright/test';
import fs from 'node:fs';
const html=fs.readFileSync(new URL('../dist/logo/index.html',import.meta.url),'utf8');
async function mockOrigins(page){
 await page.route('**/*',route=>{
  const url=new URL(route.request().url());
  if(route.request().isNavigationRequest()&&url.hostname==='kangdaejong.com')return route.fulfill({contentType:'text/html',body:html});
  if(route.request().isNavigationRequest()&&url.hostname==='logo.kangdaejong.com')return route.fulfill({contentType:'text/html',body:'<h1>New logo origin</h1>'});
  return route.abort();
 });
}
test('old address sends a new visitor to the service domain with query and section',async({page})=>{
 await mockOrigins(page);await page.goto('https://kangdaejong.com/logo/?source=home#studio');
 await expect(page).toHaveURL('https://logo.kangdaejong.com/?source=home#studio');
});
for(const key of ['logo-draft','logo-order','logo-payment'])test(`old origin preserves existing ${key}`,async({page})=>{
 await mockOrigins(page);await page.addInitScript(key=>localStorage.setItem(key,'preserved'),key);
 await page.goto('https://kangdaejong.com/logo/');await expect(page).toHaveURL('https://kangdaejong.com/logo/');
 await expect(page.locator('#legacy-notice')).toBeVisible();expect(await page.evaluate(key=>localStorage.getItem(key),key)).toBe('preserved');
});
test('payment callback stays on the originating address',async({page})=>{
 await mockOrigins(page);await page.goto('https://kangdaejong.com/logo/?payment=success');
 await expect(page).toHaveURL('https://kangdaejong.com/logo/?payment=success');await expect(page.locator('#legacy-notice')).toBeVisible();
});
