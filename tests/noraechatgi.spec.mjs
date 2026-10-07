import { test, expect } from '@playwright/test';

for (const width of [390, 1440]) {
  test(`노래찾기 app row shows preparing status without fake store links at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const row = page.locator('.app-row').filter({ has: page.getByRole('heading', { name: '노래찾기', exact: true }) });
    await expect(row).toHaveCount(1);
    await expect(row).toContainText('주변 음악의 제목과 가수');
    await expect(row.locator('.app-status')).toHaveText('iPhone · App Store 출시 준비 중');
    await expect(row.locator('a')).toHaveCount(0);
    const image = row.locator('img');
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate(i => i.complete && i.naturalWidth > 0)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

for (const path of ['/privacy-noraechatgi/', '/support-noraechatgi/']) {
  test(`노래찾기 ${path} renders`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator('h1')).toContainText('노래찾기');
    await expect(page.getByRole('navigation', { name: '노래찾기 안내' }).getByRole('link')).toHaveCount(2);
  });
}
