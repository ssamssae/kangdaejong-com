import { test, expect } from '@playwright/test';

test('쉬운 글 검사기 /privacy-easy-writing/ renders the no-send, no-storage policy', async ({ page }) => {
  const response = await page.goto('/privacy-easy-writing/');
  expect(response.status()).toBe(200);
  await expect(page.locator('h1')).toHaveText('쉬운 글 검사기 개인정보 처리 안내');
  const main = page.locator('main');
  await expect(main).toContainText('검사는 이용자의 컴퓨터 안에서만 합니다. 글을 운영자나 다른 서버로 보내지 않습니다.');
  await expect(main).toContainText('글과 검사 결과를 저장하지 않습니다.');
  await expect(main).toContainText('activeTab');
  await expect(main).toContainText('scripting');
  await expect(main).toContainText('운영자: 마이너스베타스튜디오 (대표 강대종)');
  await expect(main).toContainText('적용일: 2026년 11월 22일');
  await expect(main.getByRole('link', { name: 'minusbetastudio@gmail.com' }).first()).toHaveAttribute('href', 'mailto:minusbetastudio@gmail.com');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://kangdaejong.com/privacy-easy-writing/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
