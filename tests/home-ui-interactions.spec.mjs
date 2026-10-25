// T-261025-009 · 인사이트 「바이브코더 필수 UI 용어 24가지」에서 고른 홈 UI —
//   ① 누르는 카드(호버·눌림) ② 메일 주소 복사 + 토스트 ③ 스크롤 리빌 + 스태거.
// 공용 머리글 파일(mb-components.js)은 라이브가 아니라 이 저장소의 사본으로 검사한다.
import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { rgb } from './brand-colors.mjs';

const components = fileURLToPath(new URL('../public/mb-components.js', import.meta.url));
const EMAIL = 'minusbetastudio@gmail.com';
// 라이브 HTML 에서 Cloudflare 가 가린 mailto 주소(2026-10-25 kangdaejong.com 실측).
const CF_PROTECTED_EMAIL = '/cdn-cgi/l/email-protection#016c686f74726364756072757465686e41666c60686d2f626e6c';

test.beforeEach(async ({ page }) => {
  await page.route('https://kangdaejong.com/mb-components.js', (route) => route.fulfill({ path: components, contentType: 'text/javascript' }));
});

const card = (page, name) => page.locator('#projects .project-card').filter({ has: page.getByRole('heading', { name, exact: true }) });
// 카드 제목 한가운데를 눌렀을 때 실제로 맞는 링크(없으면 null).
const linkUnderTitle = (page, name) => card(page, name).locator('h3').evaluate((title) => {
  const box = title.getBoundingClientRect();
  return document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)?.closest('a')?.getAttribute('href') ?? null;
});

test.describe('pressable tool cards', () => {
  test.use({ isMobile: false, hasTouch: false, viewport: { width: 1440, height: 900 } });

  test('a single-link card opens its link from anywhere on the card', async ({ page }) => {
    await page.goto('/');
    for (const [name, href] of [
      ['텔레그램 브릿지', '#open-tools'],
      ['입타', '/ipta/'],
      ['자비스', 'https://github.com/ssamssae/jarvis-mac'],
      ['복붙 정리기', '/tools/text/'],
    ]) {
      await card(page, name).scrollIntoViewIfNeeded();
      expect(await linkUnderTitle(page, name), name).toBe(href);
    }
    // 설명 글자 자리를 사람처럼 누른다(덮개 링크가 클릭을 받는 것이 이 기능이다).
    const description = await card(page, '입타').locator('p').boundingBox();
    await page.mouse.click(description.x + description.width / 2, description.y + description.height / 2);
    await expect(page).toHaveURL(/\/ipta\/$/);
  });

  test('cards with several links stay plain so each link keeps its own target', async ({ page }) => {
    await page.goto('/');
    await card(page, '첫이름').scrollIntoViewIfNeeded();
    expect(await linkUnderTitle(page, '첫이름')).toBeNull();
    await expect(card(page, '첫이름')).not.toHaveClass(/mb-press-card/);
    await expect(page.locator('.app-row.mb-press-card')).toHaveCount(0);
  });

  test('hover darkens the card one grey step and pressing shrinks it like a button', async ({ page }) => {
    await page.goto('/');
    const ipta = card(page, '입타');
    await expect(ipta).toHaveCSS('background-color', rgb('light', '--bg-elev'));
    await ipta.hover();
    await expect(ipta).toHaveCSS('background-color', rgb('light', '--bg-elev2'));
    await page.mouse.down();
    await expect(ipta).toHaveCSS('transform', 'matrix(0.98, 0, 0, 0.98, 0, 0)');
    // 카드 밖에서 손을 떼야 링크로 넘어가지 않는다(카드 전체가 링크다).
    await page.mouse.move(2, 2);
    await page.mouse.up();
    await expect(ipta).toHaveCSS('transform', 'none');
    await expect(ipta).toHaveCSS('background-color', rgb('light', '--bg-elev'));
  });

  test('keyboard focus outlines the whole card and reduced motion keeps its size', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    const link = card(page, '입타').getByRole('link', { name: '입타 알아보기' });
    await link.focus();
    expect(await link.evaluate((a) => getComputedStyle(a, '::after').outlineStyle)).toBe('solid');
    await card(page, '입타').hover();
    await page.mouse.down();
    await expect(card(page, '입타')).toHaveCSS('transform', 'none');
    await page.mouse.move(2, 2);
    await page.mouse.up();
  });
});

test.describe('copy the email address', () => {
  test.beforeEach(async ({ context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  });

  test('copies the address and shows a toast for about three seconds', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: '주소 복사' }).click();
    const toast = page.locator('.mb-toast');
    await expect(toast).toBeVisible();
    await expect(toast).toHaveText('메일 주소를 복사했어요');
    await expect(toast).toHaveAttribute('role', 'status');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(EMAIL);
    await page.waitForTimeout(2000);
    await expect(toast).toBeVisible();
    await expect(toast).toBeHidden({ timeout: 4000 });
  });

  test('reads the address back from a Cloudflare-protected link', async ({ page }) => {
    await page.goto('/');
    await page.locator('.contact-email').evaluate((a, href) => a.setAttribute('href', href), CF_PROTECTED_EMAIL);
    await page.getByRole('button', { name: '주소 복사' }).click();
    await expect(page.locator('.mb-toast')).toHaveText('메일 주소를 복사했어요');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(EMAIL);
  });

  test('says so when the browser refuses to copy', async ({ page }) => {
    await page.addInitScript(() => {
      navigator.clipboard.writeText = () => Promise.reject(new Error('denied'));
      document.execCommand = () => false;
    });
    await page.goto('/');
    await page.getByRole('button', { name: '주소 복사' }).click();
    await expect(page.locator('.mb-toast')).toHaveText('복사하지 못했어요. 이메일 보내기를 눌러 주세요');
  });

  test('the button and the toast follow the English page', async ({ page }) => {
    await page.goto('/');
    await page.locator('mb-header .lang-button[data-lang="en"]').click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await page.getByRole('button', { name: 'Copy address' }).click();
    await expect(page.locator('.mb-toast')).toHaveText('Email address copied');
  });
});

test.describe('scroll reveal', () => {
  // Playwright 는 navigator.webdriver = true 라 리빌이 꺼진다(배포 검사·화면 캡처 보호). 리빌 자체를 볼 때만 끈다.
  const asVisitor = (page) => page.addInitScript(() => Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false }));

  test('app cards below the fold stay hidden until they scroll into view', async ({ page }) => {
    await asVisitor(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    const apps = page.locator('.app-grid > .app-row');
    await expect(apps.first()).toHaveCSS('opacity', '0');
    await apps.first().scrollIntoViewIfNeeded();
    await expect(apps.first()).toHaveCSS('opacity', '1');
    await expect(apps.last()).toHaveCSS('opacity', '0');
  });

  test('cards that enter together come in one after another', async ({ page }) => {
    await asVisitor(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    const apps = page.locator('.app-grid > .app-row');
    await apps.first().scrollIntoViewIfNeeded();
    await expect(apps.nth(2)).toHaveCSS('opacity', '1');
    const delays = await apps.evaluateAll((items) => items.slice(0, 3).map((item) => parseFloat(getComputedStyle(item).animationDelay)));
    expect(delays[0]).toBeLessThan(delays[1]);
    expect(delays[1]).toBeLessThan(delays[2]);
  });

  test('cards already on the first screen never blink out', async ({ page }) => {
    await asVisitor(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    const featured = page.locator('.project-card.featured');
    await expect(featured).toHaveCSS('opacity', '1');
    await expect(featured).toHaveCSS('animation-name', 'none');
  });

  test('reduced motion and automated browsers see every card at once', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await expect(page.locator('.app-grid > .app-row').last()).toHaveCSS('opacity', '1');
    await asVisitor(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await expect(page.locator('.app-grid > .app-row').last()).toHaveCSS('opacity', '1');
  });
});
