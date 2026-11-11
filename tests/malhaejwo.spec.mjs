import { test, expect } from '@playwright/test';

test('말해줘 /privacy-malhaejwo/ renders the on-device, speech and ads policy', async ({ page }) => {
  const response = await page.goto('/privacy-malhaejwo/');
  expect(response.status()).toBe(200);
  await expect(page.locator('h1')).toHaveText('말해줘 개인정보 처리 안내');
  const main = page.locator('main');
  await expect(main).toContainText('운영자는 개인정보를 수집하지 않습니다.');
  await expect(main).toContainText('최근에 말한 문장 20개');
  await expect(main).toContainText('안드로이드의 음성 인식 서비스');
  await expect(main).toContainText('Google AdMob 배너 광고');
  await expect(main).toContainText('광고 제거 구매와 구매 복원은 Google Play가 처리합니다.');
  await expect(main).not.toContainText('iPhone');
  await expect(main).not.toContainText('iCloud');
  await expect(main).not.toContainText('App Store');
  await expect(main).toContainText('마이크와 음성 인식 권한은 마이크 버튼을 처음 누를 때만 요청합니다.');
  await expect(main).toContainText('운영자: 마이너스베타스튜디오 (대표 강대종)');
  await expect(main).toContainText('적용일: 2026년 11월 1일');
  await expect(main.getByRole('link', { name: 'minusbetastudio@gmail.com' })).toHaveAttribute('href', 'mailto:minusbetastudio@gmail.com');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://kangdaejong.com/privacy-malhaejwo/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
