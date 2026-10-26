import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
test('home offers the three ebooks as free PDFs and no purchase links',async({page})=>{
 await page.goto('/');
 await expect(page.locator('a[href="/ai-setup/"]')).toHaveCount(0);
 await expect(page.locator('main')).not.toContainText('99,000');
 await expect(page.locator('#books a.book-row[href^="/books/"][href$=".pdf"]')).toHaveCount(3);
 await expect(page.locator('#books')).not.toContainText('판매 종료');
 await expect(page.locator('a[href*="kmong.com/gig"]')).toHaveCount(0);
 await expect(page.locator('main')).not.toContainText('10,000');
 for(const href of ['/books/solo-company-ai-automation.pdf','/books/solo-ai-team.pdf','/books/phone-controls-my-computer-ai.pdf']){
  const res=await page.request.get(href);expect(res.status()).toBe(200);expect(res.headers()['content-type']).toContain('pdf');
 }
});
test('old installation URL closes intake and leads to replacement',async({page})=>{
 await page.goto('/ai-setup/');
 await expect(page.locator('h1')).toContainText('종료했어요');
 await expect(page.locator('main').locator('form, select, textarea, a[href^="mailto:"]')).toHaveCount(0);
 await expect(page.locator('main')).not.toContainText('99,000');
 await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content','noindex,follow');
 await expect(page.locator('main').getByRole('link',{name:'제공 종료 안내 보기'})).toHaveAttribute('href','https://kangdaejong.com/work/products/#retired-products');
 await expect(page.locator('main').getByRole('link',{name:'전체 제품 보기'})).toHaveAttribute('href','https://kangdaejong.com/work/products/');
});
test('retired digital products page is not built and moves to the retired list',async({page})=>{
 // T-261004-002(#134): 디지털 상품 쪽과 무료 양식은 작업장 제품 목록의 제공 종료 칸으로 옮겼다.
 expect((await page.request.get('/digital-products/')).status()).toBe(404);
 expect(readFileSync(new URL('../public/_redirects',import.meta.url),'utf8')).toContain('/digital-products/ https://kangdaejong.com/work/products/#retired-products 301');
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
 await expect(page.locator('main a[href="https://kangdaejong.com/work/products/"]')).toBeAttached();
 await expect(page.locator('#open-tools video')).toBeHidden();
 await page.locator('#open-tools > summary').click();
 await expect(page.locator('#open-tools video')).toBeVisible();
 await expect(page.locator('#open-tools video source')).toHaveAttribute('src',/bridge-iphone-20260923.mp4/);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
