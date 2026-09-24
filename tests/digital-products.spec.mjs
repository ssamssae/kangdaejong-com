import {test,expect} from '@playwright/test';
test('home offers digital products and no installation intake',async({page})=>{
 await page.goto('/archive/');
 await expect(page.locator('a[href="/ai-setup/"]')).toHaveCount(0);
 await expect(page.locator('main')).not.toContainText('99,000');
 await page.getByRole('link',{name:'책·양식 구성 자세히 보기'}).click();
 await expect(page).toHaveURL(/digital-products/);
 await expect(page.locator('h1')).toContainText('내 속도로');
 await expect(page.getByRole('link',{name:'크몽에서 미리보기·구매'})).toHaveAttribute('href','https://kmong.com/gig/786557');
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
 await page.getByText('문의는 어디에 남기나요?',{exact:true}).click();
 await expect(page.locator('#faq')).toContainText('실시간 응답이나 전화 상담을 제공하는 상품은 아닙니다');
 await expect(page.locator('main a[href^="tel:"]')).toHaveCount(0);
 await expect(page.locator('form')).toHaveCount(0);
 await page.getByRole('link',{name:'무료 업무 정리 양식부터 보기'}).click();
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

test('sales hero precedes records and SNS with usable mobile purchase CTA',async({page},info)=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/archive/');
 await expect(page.locator('main > section').first()).toHaveClass(/sales-hero/);
 await expect(page.locator('main h1')).toHaveText('매번 새로 쓰는 업무,다시 쓰는 양식으로.');
 const buy=page.locator('.sales-hero').getByRole('link',{name:'미리보기·구매'});
 await expect(buy).toBeInViewport();
 expect(await page.locator('.social-banner').evaluate(el=>el.compareDocumentPosition(document.querySelector('.sales-hero')) & Node.DOCUMENT_POSITION_PRECEDING)).toBeTruthy();
 await expect(page.locator('main a[href="https://work.kangdaejong.com/products/"]').first()).toBeAttached();
 await expect(page.locator('.bridge-result video source')).toHaveAttribute('src',/bridge-iphone-20260923.mp4/);
 await expect(page.locator('a[href="https://cheotireum.kangdaejong.com/sample-report"]')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:info.outputPath('sales-home-390.png'),fullPage:true});
 await page.setViewportSize({width:1440,height:1000});await page.goto('/archive/');await page.screenshot({path:info.outputPath('sales-home-1440.png'),fullPage:true});
});
