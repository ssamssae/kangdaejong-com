import { test, expect } from '@playwright/test';

test('통역요 /privacy-tongyeokyo/ renders the on-device policy and ML Kit disclosure', async ({ page }) => {
  const response = await page.goto('/privacy-tongyeokyo/');
  expect(response.status()).toBe(200);
  await expect(page.locator('h1')).toHaveText('통역요 개인정보 처리 안내');
  const main = page.locator('main');
  await expect(main).toContainText('운영자: 마이너스베타스튜디오 (대표 강대종)');
  await expect(main).toContainText('적용일: 2026년 11월 27일 · 대상: Android 앱 1.0.0 (com.daejongkang.tongyeokyo)');
  await expect(main).toContainText('대화의 소리와 글은 인터넷으로 보내지 않습니다.');
  await expect(main).toContainText('진단 기록에는 대화 글이 들어 있지 않습니다.');
  await expect(main).toContainText('앱은 안드로이드 자동 백업을 켜 두지 않습니다.');
  await expect(main.locator('h2')).toHaveText(['대화의 소리와 글', '번역 라이브러리가 보내는 정보', '기기에 저장하는 정보', '네트워크·광고·분석', '권한', '안내 변경', '문의']);
  await expect(main.locator('li')).toHaveCount(2);
  await expect(main.getByRole('link', { name: 'minusbetastudio@gmail.com' })).toHaveAttribute('href', 'mailto:minusbetastudio@gmail.com');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://kangdaejong.com/privacy-tongyeokyo/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
