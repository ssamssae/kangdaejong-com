import { test, expect } from '@playwright/test';

test('Minus Beta Stats /privacy-minusbeta-stats/ renders the AdMob read-only policy', async ({ page }) => {
  const response = await page.goto('/privacy-minusbeta-stats/');
  expect(response.status()).toBe(200);
  await expect(page.locator('h1')).toHaveText('Minus Beta Stats 개인정보 처리 안내');
  const main = page.locator('main');
  await expect(main).toContainText("도구는 운영자가 한 번 동의한 Google 계정에 'AdMob 데이터 보기'(admob.readonly) 권한만 요청합니다.");
  await expect(main).toContainText('이 정보를 판매하거나 제3자와 공유하지 않습니다.');
  await expect(main).toContainText('Google 계정 > 보안 > 서드파티 연결에서 언제든 접근을 끊을 수 있습니다.');
  await expect(main).toContainText('운영자: 마이너스베타스튜디오 (대표 강대종)');
  await expect(main).toContainText('적용일: 2026년 10월 26일');
  await expect(main.getByRole('link', { name: 'minusbetastudio@gmail.com' })).toHaveAttribute('href', 'mailto:minusbetastudio@gmail.com');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://kangdaejong.com/privacy-minusbeta-stats/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
