import { test, expect } from '@playwright/test';

for (const width of [360, 390, 768, 1440]) {
  test(`homepage navigation and layout at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('안녕하세요.만드는 사람 강대종입니다.');
    await expect(page.locator('#menu-picker')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: '만드는 도구' })).toBeVisible();
    await expect(page.locator('#projects h3')).toHaveText(['텔레그램 브릿지', '입타', '자비스']);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.getByRole('link', { name: '설치 안내', exact: true })).toHaveAttribute('href', '#open-tools');
    await expect(page.getByRole('link', { name: '입타 알아보기' })).toHaveAttribute('href', '/ipta/');
    await page.getByRole('link', { name: '프로젝트 둘러보기' }).click();
    await expect(page).toHaveURL(/#projects$/);
    await expect(page.locator('#projects')).toBeInViewport();
    await expect(page.locator('footer')).toContainText('878-21-02478');
    await page.goto('/');
    await page.screenshot({ path: test.info().outputPath(`home-${width}.png`), fullPage: true });
    await page.screenshot({ path: test.info().outputPath(`home-${width}-top.png`) });
    expect(errors).toEqual([]);
  });
}
test('keyboard entry and reduced motion stay usable', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name:'본문으로 건너뛰기' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#main-content$/);
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe('auto');
});
