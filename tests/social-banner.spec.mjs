import { test, expect } from '@playwright/test';

const names = ['GitHub', 'Instagram', 'Threads', 'X', 'YouTube', 'LinkedIn', 'Facebook', '네이버 블로그', 'Substack', '작업실', '전체 제품', '초소'];
for (const width of [360, 768, 1440]) {
  test(`public channels are visible, readable and safe at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/#contact');
    const banner = page.getByRole('navigation', { name: 'SNS와 공개 채널' });
    await expect(banner).toBeVisible();
    const links = banner.getByRole('link');
    await expect(links).toHaveCount(names.length);
    for (const name of names) {
      const link = banner.getByRole('link', { name: new RegExp(`^${name} —`) });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute('href', /^https:\/\//);
      await expect(link).toHaveAttribute('target', '_blank');
      await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      const box = await link.boundingBox();
      expect(box.height).toBeGreaterThanOrEqual(44);
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(width);
    }
    expect(new Set(await links.evaluateAll(items => items.map(item => item.href))).size).toBe(names.length);
    await expect(links.first()).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await links.first().focus();
    await page.keyboard.press('Tab');
    await expect(links.nth(1)).toBeFocused();
    await page.screenshot({ path: test.info().outputPath(`social-${width}.png`), fullPage: false });
  });
}
