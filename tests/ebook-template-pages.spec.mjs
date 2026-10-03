import {test,expect} from '@playwright/test';
test('retired free templates have no current download entry',async({page})=>{
 await page.goto('/digital-products/');
 await expect(page.locator('h1')).toContainText('제공을 마쳤습니다');
 await expect(page.locator('.template-notice')).toContainText('14종');
 await expect(page.locator('a[href*="/templates/"]')).toHaveCount(0);
 await expect(page.locator('.book-list li')).toHaveCount(3);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
