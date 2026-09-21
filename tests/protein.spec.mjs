import { test, expect } from '@playwright/test';

test('protein gallery has twenty loaded structures and accessible header navigation', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('20가지');
  await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href', 'https://protein.kangdaejong.com/');
  await expect(page.getByRole('link', { name: '단백질', exact: true })).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('.amino-card')).toHaveCount(20);
  for (const img of await page.locator('.amino-card img').all()) {
    await img.scrollIntoViewIfNeeded();
    await expect(img).toHaveJSProperty('complete', true);
    expect(await img.evaluate(el => el.naturalWidth)).toBeGreaterThan(100);
  }
});

test('search, category filters and empty results work together', async ({ page }) => {
  await page.goto('/');
  const search = page.getByRole('searchbox');
  await search.fill('트립토판');
  await expect(page.locator('.amino-card:visible')).toHaveCount(1);
  await search.fill('Trp');
  await expect(page.locator('.amino-card:visible')).toHaveCount(1);
  await search.fill('');
  await page.getByRole('button', { name: '산성', exact: true }).click();
  await expect(page.locator('.amino-card:visible')).toHaveCount(2);
  await search.fill('없는이름');
  await expect(page.getByText('일치하는 아미노산이 없습니다.')).toBeVisible();
  await page.getByRole('button', { name: '초기화', exact: true }).click();
  await expect(page.locator('.amino-card:visible')).toHaveCount(20);
});

for (const width of [360, 800, 1440]) {
  test(`protein layout fits ${width}px viewport`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.getByRole('link', { name: '단백질', exact: true })).toBeVisible();
  });
}
