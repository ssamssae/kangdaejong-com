import { test, expect } from '@playwright/test';
for (const width of [390, 1440]) test(`single home retains business disclosure at ${width}`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('강대종');
  await expect(page.locator('main')).not.toContainText('첫이름');
  await expect(page.locator('mb-header, mb-footer')).toHaveCount(0);
  const business = page.locator('footer details');
  await expect(business).not.toHaveAttribute('open');
  await business.locator('summary').click();
  await expect(business).toContainText('878-21-02478');
  await expect(business.locator('a[href="tel:01074842927"]')).toBeVisible();
  await page.locator('footer').getByRole('link', { name: '프로젝트', exact: true }).click();
  await expect(page).toHaveURL(/\/#projects$/);
  await expect(page.locator('#projects')).toBeInViewport();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://kangdaejong.com/');
});
