import { test, expect } from '@playwright/test';

for (const width of [320, 390, 768, 1440]) {
  test(`one page is readable and navigable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('강대종');
    await expect(page.locator('.project-versions, .edition, .chapters')).toHaveCount(0);
    await expect(page.locator('#projects .project-card')).toHaveCount(3);
    await expect(page.locator('#products .app-row')).toHaveCount(6);
    await expect(page.locator('#books .book-row')).toHaveCount(3);
    await expect(page.locator('main')).not.toContainText(/단어요|한컵|포모도로|첫이름|한장궁합|한장택일/);
    await expect(page.getByRole('navigation', { name: '페이지 메뉴' }).getByRole('link')).toHaveCount(3);
    await page.getByRole('navigation', { name: '페이지 메뉴' }).getByRole('link', { name: '앱' }).click();
    await expect(page).toHaveURL(/#products$/);
    await expect(page.locator('#products')).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const broken = await page.locator('img').evaluateAll(imgs => imgs.filter(i => i.complete && !i.naturalWidth).map(i => i.src));
    expect(broken).toEqual([]);
    expect(errors).toEqual([]);
    await page.goto('/');
    await page.screenshot({ path: test.info().outputPath(`home-${width}.png`), fullPage: true });
    await page.screenshot({ path: test.info().outputPath(`top-${width}.png`) });
  });
}

test('old chapter links keep anchors and open bridge details', async ({ page }) => {
  await page.goto('/archive/?from=old#open-tools');
  await expect(page).toHaveURL(/\/\?from=old#open-tools$/);
  await expect(page.locator('#open-tools')).toHaveAttribute('open', '');
  await expect(page.locator('#open-tools a[href*="/releases"]')).toHaveCount(4);
  await expect(page.locator('#open-tools')).toBeInViewport();
  await page.goto('/archive/#books');
  await expect(page).toHaveURL(/\/#books$/);
  await expect(page.locator('#books')).toBeInViewport();
});

test('keyboard, reduced motion and local anchors work', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: '본문으로 건너뛰기' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe('auto');
  const missing = await page.locator('a[href^="#"]').evaluateAll(links => links.map(l=>l.hash).filter(h=>!document.getElementById(decodeURIComponent(h.slice(1)))));
  expect(missing).toEqual([]);
});

test('without JavaScript primary content and links remain usable', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4321/');
  await expect(page.locator('#products .app-row')).toHaveCount(6);
  await page.locator('#open-tools summary').click();
  await expect(page.locator('#open-tools a[href*="codex-telegram-bridge"]').first()).toBeVisible();
  await context.close();
});

 test('bridge link reopens details after closing at the same fragment', async ({ page }) => {
  await page.goto('/#open-tools');
  const details = page.locator('#open-tools');
  await expect(details).toHaveAttribute('open', '');
  await details.locator('summary').click();
  await expect(details).not.toHaveAttribute('open');
  await page.locator('.project-card').getByRole('link', {name: '설치 안내', exact: true}).click();
  await expect(details).toHaveAttribute('open', '');
 });
