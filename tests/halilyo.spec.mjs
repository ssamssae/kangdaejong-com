import { test, expect } from '@playwright/test';

test('할일요 /privacy-halilyo/ renders the on-device, Drive backup and no-ads policy', async ({ page }) => {
  const response = await page.goto('/privacy-halilyo/');
  expect(response.status()).toBe(200);
  await expect(page.locator('h1')).toHaveText('할일요 개인정보 처리 안내');
  const main = page.locator('main');
  await expect(main).toContainText('할 일, 프로젝트, 영역, 태그, 화면 언어는 기기 안에만 저장합니다. 광고와 광고 식별자와 앱 안 구매는 쓰지 않습니다.');
  await expect(main).toContainText('https://www.googleapis.com/auth/drive.file');
  await expect(main).toContainText('최신 7개만 남기고');
  await expect(main).toContainText('이 앱은 광고를 넣지 않습니다. 광고 식별자를 읽지 않습니다.');
  await expect(main).toContainText('이 앱은 앱 안 구매를 두지 않습니다.');
  // T-261110-017: 첫 출시판은 광고·구매가 없다 — 옛 AdMob·광고 제거 구매 문구가 돌아오면 실패한다.
  await expect(main).not.toContainText('AdMob');
  await expect(main).not.toContainText('광고 제거');
  await expect(main).toContainText('30일이 지나면');
  await expect(main).toContainText('운영자: 마이너스베타스튜디오 (대표 강대종)');
  await expect(main).toContainText('적용일: 2026년 11월 10일');
  await expect(main.getByRole('link', { name: 'minusbetastudio@gmail.com' }).first()).toHaveAttribute('href', 'mailto:minusbetastudio@gmail.com');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://kangdaejong.com/privacy-halilyo/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
