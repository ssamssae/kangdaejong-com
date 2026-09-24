import { test, expect } from '@playwright/test';
for (const width of [390, 1440]) test(`preparing home and archive at ${width}`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('준비 중입니다');
  await expect(page.locator('body')).not.toContainText('첫이름');
  await expect(page.locator('mb-header, mb-footer')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: `/tmp/T-260924-046-${width}.png`, fullPage: true });
  await page.getByRole('link', { name: '이전 프로젝트' }).click();
  await expect(page).toHaveURL(/\/archive\//);
  await expect(page.locator('main')).toContainText('첫이름');
  await expect(page.locator('main')).toContainText('메모요');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://kangdaejong.com/archive/');
});
