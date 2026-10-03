import {test,expect} from '@playwright/test';
test('home shows ebook closure and no purchase links',async({page})=>{
 await page.goto('/');
 await expect(page.locator('a[href="/ai-setup/"]')).toHaveCount(0);
 await expect(page.locator('main')).not.toContainText('99,000');
 await page.getByRole('link',{name:'전자책 판매 종료 안내'}).click();
 await expect(page).toHaveURL(/digital-products/);
 await expect(page.locator('h1')).toContainText('판매를 종료했습니다');
 await expect(page.locator('a[href*="kmong.com/gig"]')).toHaveCount(0);
 await expect(page.locator('main')).not.toContainText('10,000');
});
test('old installation URL closes intake and leads to replacement',async({page})=>{
 await page.goto('/ai-setup/');
 await expect(page.locator('h1')).toContainText('종료했습니다');
 await expect(page.locator('main').locator('form, select, textarea, a[href^="mailto:"]')).toHaveCount(0);
 await expect(page.locator('main')).not.toContainText('99,000');
 await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content','noindex,follow');
 await page.getByRole('link',{name:'디지털 상품 살펴보기'}).click();
 await expect(page).toHaveURL(/digital-products/);
});
test('free sample works without purchase; written support does not promise calls',async({page})=>{
 await page.goto('/digital-products/');
 await expect(page.locator('main')).toContainText('판매를 종료했습니다');
 await expect(page.locator('main a[href^="tel:"]')).toHaveCount(0);
 await expect(page.locator('form')).toHaveCount(0);
 await page.getByRole('link',{name:'반복 업무 정리 양식'}).click();
 await expect(page).toHaveURL(/t01-repeat-work-inventory/);
 await expect(page.locator('h1')).toContainText('반복 업무');
});
for(const width of [390,1440])test(`digital and closed pages render at ${width}`,async({page},info)=>{
 await page.setViewportSize({width,height:900});
 for(const route of ['digital-products','ai-setup']){
  await page.goto('/'+route+'/');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:info.outputPath(`${route}-${width}.png`),fullPage:true});
 }
});

test('home keeps books and optional bridge video reachable on mobile',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');
 await expect(page.locator('main h1')).toContainText('강대종');
 await expect(page.locator('.book-row')).toHaveCount(3);
 await expect(page.locator('main a[href="https://work.kangdaejong.com/products/"]')).toBeAttached();
 await expect(page.locator('#open-tools video')).toBeHidden();
 await page.locator('#open-tools > summary').click();
 await expect(page.locator('#open-tools video')).toBeVisible();
 await expect(page.locator('#open-tools video source')).toHaveAttribute('src',/bridge-iphone-20260923.mp4/);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
