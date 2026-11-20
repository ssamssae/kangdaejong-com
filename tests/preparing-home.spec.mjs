import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';

test.beforeEach(async ({ page }) => {
  await page.route('https://kangdaejong.com/mb-components.js', route => route.fulfill({
    path: fileURLToPath(new URL('../public/mb-components.js', import.meta.url)),
    contentType: 'application/javascript',
  }));
});

for (const width of [390, 1440]) test(`single home retains business disclosure at ${width}`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('강대종');
  await expect(page.locator('main')).toContainText('첫이름');
  await expect(page.locator('mb-header')).toHaveCount(1);
  const footer = page.locator('mb-footer');
  await expect(footer).toHaveAttribute('tone', 'studio');
  await expect(footer.locator('.biz')).toContainText('사업자등록번호 878-21-02478');
  await footer.getByRole('link', { name: '프로젝트', exact: true }).click();
  await expect(page).toHaveURL(/\/#projects$/);
  await expect(page.locator('#projects')).toBeInViewport();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://kangdaejong.com/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
