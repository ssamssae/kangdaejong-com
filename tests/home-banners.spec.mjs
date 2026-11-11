import {test, expect} from '@playwright/test';
// T-261111-007: 홈 첫 자리 = 후원 사이트(왕좌 뺏기) 배너. 인사이트 배너는 숨기지 않고 「만들며 배운 것」 절 안에 둔다.
for (const width of [320, 390, 1440]) test(`home banners keep their places at ${width}`, async ({page}) => {
  await page.setViewportSize({width, height: 900}); await page.goto('/');
  const first = page.locator('#main-content > *').first();
  await expect(first).toHaveClass(/throne-banner/);
  await expect(first.getByRole('link', {name: '왕좌 보러 가기'})).toHaveAttribute('href', 'https://rich.kangdaejong.com/');
  await expect(page.locator('.insight-banner')).toHaveCount(1);
  await expect(page.locator('#books .insight-banner')).toHaveCount(1);
  await expect(page.getByRole('link', {name: '인사이트 모아보기'})).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
});
