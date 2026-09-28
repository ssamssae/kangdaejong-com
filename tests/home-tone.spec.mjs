import { test, expect } from '@playwright/test';

for (const width of [360, 390, 768, 1440]) {
  test(`homepage navigation and layout at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('내 컴퓨터의 AI를,더 가까이.');
    await expect(page.locator('#projects h3')).toHaveText(['텔레그램 브릿지', '입타', '자비스']);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.getByRole('link', { name: '브릿지 시연·설치 안내 보기' })).toHaveAttribute('href', '/archive/#open-tools');
    await expect(page.getByRole('link', { name: '설치·사용 방법 보기' })).toHaveAttribute('href', '/ipta/');
    await page.getByRole('link', { name: '대표 프로젝트 보기' }).click();
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
