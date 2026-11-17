import {test, expect} from '@playwright/test';
// T-261111-007: 인사이트 배너는 숨기지 않고 「만들며 배운 것」 절 안에 둔다.
// T-261118-009: 왕좌 뺏기는 맨 위 배너가 아니라 맨 아래 구석의 글씨 없는 왕관 그림(대종님 「대놓고 표시하지 말고」).
for (const width of [320, 390, 1440]) test(`home banners keep their places at ${width}`, async ({page}) => {
  await page.setViewportSize({width, height: 900}); await page.goto('/');
  await expect(page.locator('#main-content > *').first()).toHaveClass(/intro/);
  const last = page.locator('#main-content > *').last();
  await expect(last).toHaveClass(/throne-egg/);
  const throne = last.getByRole('link', {name: '왕좌 뺏기'});
  await expect(throne).toHaveAttribute('href', 'https://rich.kangdaejong.com/');
  await expect(throne).toBeVisible();
  expect((await throne.innerText()).trim()).toBe('');
  await expect(page.getByText('왕좌 보러 가기')).toHaveCount(0);
  await expect(page.locator('.insight-banner')).toHaveCount(1);
  await expect(page.locator('#books .insight-banner')).toHaveCount(1);
  await expect(page.getByRole('link', {name: '인사이트 모아보기'})).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
});
