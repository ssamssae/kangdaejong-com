import {test,expect} from '@playwright/test';
test('book links stay on the single home and legacy archive links arrive there', async ({page})=>{
 for (const route of ['/#books', '/archive/#books']) {
  await page.goto(route);
  await expect(page).toHaveURL(/\/#books$/);
  await expect(page.locator('#books .book-row')).toHaveCount(3);
  await expect(page.locator('#books')).toBeInViewport();
 }
 await page.goto('/');
 await page.evaluate(()=>location.hash='books');
 await expect(page).toHaveURL(/\/#books$/);
 await expect(page.locator('#books')).toBeInViewport();
});
