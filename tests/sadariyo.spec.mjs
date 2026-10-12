import { test, expect } from '@playwright/test';

test('사다리요 /privacy-sadariyo/ renders the no-collection policy', async ({ page }) => {
  const response = await page.goto('/privacy-sadariyo/');
  expect(response.status()).toBe(200);
  await expect(page.locator('h1')).toHaveText('사다리요 개인정보 처리 안내');
  const main = page.locator('main');
  await expect(main).toContainText('사다리요는 개인정보를 수집하지 않습니다.');
  await expect(main).toContainText('앱은 이 정보를 기기 밖으로 보내지 않습니다.');
  await expect(main).toContainText('운영자: 마이너스베타스튜디오 (대표 강대종)');
  await expect(main).toContainText('적용일: 2026년 10월 12일');
  await expect(main.getByRole('link', { name: 'minusbetastudio@gmail.com' })).toHaveAttribute('href', 'mailto:minusbetastudio@gmail.com');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://kangdaejong.com/privacy-sadariyo/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
