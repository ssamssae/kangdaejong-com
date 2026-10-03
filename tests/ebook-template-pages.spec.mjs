import {test,expect} from '@playwright/test';
test('retired free templates have no current download entry',async({page})=>{
 await page.goto('/');
 await expect(page.locator('a[href*="/templates/"]')).toHaveCount(0);
 await expect(page.locator('.book-list .book-row')).toHaveCount(3);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
