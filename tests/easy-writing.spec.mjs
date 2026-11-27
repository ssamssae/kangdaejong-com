import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';

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

// T-261122-018: 회사 홈 「만드는 도구」 카드 — 대종님 2026-11-27 승인 카드 원문(이름·한 줄 소개·이용 정보·단추·「가」 아이콘)을 그대로 보여 준다.
for (const width of [390, 1440]) test(`home lists the 쉬운 글 검사기 Chrome extension card at ${width}px`, async ({ page }) => {
  await page.route('https://kangdaejong.com/brand/products/*.webp', route => route.fulfill({ path: fileURLToPath(new URL('../public' + new URL(route.request().url()).pathname, import.meta.url)) }));
  await page.setViewportSize({ width, height: 900 });
  await page.goto('/');
  const card = page.locator('#projects article[data-product-id="easy-writing"]');
  await expect(card.locator('h3')).toHaveText('쉬운 글 검사기');
  await expect(card.locator('p')).toHaveText('긴 문장·어려운 말·겹친 피동·영어 낱말을 찾아 쉬운 한국어로 고치게 도와줘요. 글은 이 컴퓨터 밖으로 보내지 않아요.');
  await expect(card.locator('.project-note')).toHaveText('무료 · 광고 없음 · 크롬 확장(PC) · 가입 없이 사용');
  const link = card.getByRole('link', { name: '크롬 웹스토어에서 받기' });
  await expect(link).toHaveAttribute('href', 'https://chromewebstore.google.com/detail/annognjibpjomgopeakkbcnbabgpbpol');
  const icon = card.locator('img.project-icon');
  await expect(icon).toHaveAttribute('src', 'https://kangdaejong.com/brand/products/easy-writing.webp');
  await expect(icon).toHaveAttribute('srcset', 'https://kangdaejong.com/brand/products/easy-writing.webp, https://kangdaejong.com/brand/products/easy-writing@2x.webp 2x');
  await card.scrollIntoViewIfNeeded();
  await expect.poll(() => icon.evaluate(i => i.complete && i.naturalWidth > 0)).toBe(true);
  const box = await card.boundingBox();
  const inner = await card.evaluate(el => [...el.querySelectorAll('*')].every(child => { const r = child.getBoundingClientRect(), c = el.getBoundingClientRect(); return r.left >= c.left - 0.5 && r.right <= c.right + 0.5; }));
  expect(inner).toBe(true);
  expect(box.width).toBeGreaterThan(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
