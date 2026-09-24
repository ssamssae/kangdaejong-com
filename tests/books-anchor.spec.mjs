import {test,expect} from '@playwright/test';
test('legacy book link opens all three archived ebooks', async ({page})=>{
 await page.goto('/#books');
 await expect(page).toHaveURL(/\/archive\/#books$/);
 await expect(page.locator('#books .r-book')).toHaveCount(3);
 await expect(page.locator('#books')).toBeInViewport();
 await page.goto('/');
 await expect(page.locator('h1')).toContainText('준비 중입니다');
 await page.evaluate(()=>location.hash='books');
 await expect(page).toHaveURL(/\/archive\/#books$/);
});
