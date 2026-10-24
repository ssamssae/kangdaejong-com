import { test, expect, devices } from "@playwright/test";

async function visitOrganization(page) {
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  const response = await page.goto("/organization/");
  expect(response?.status()).toBe(200);
  await expect(page.locator('h1')).toContainText('강대종이에요.');
  await expect(page.locator('dl')).toContainText('878-21-02478');
  await expect(page.getByRole('heading', {name:'작은 도구를 만들어 운영하고 있어요.'})).toBeVisible();
  await expect(page.getByRole('link', {name:'프로젝트 보기'})).toHaveAttribute('href','/#projects');
  await expect(page.getByRole('link', {name:'앱 보기'})).toHaveAttribute('href','/#products');
  await expect(page.locator('main')).not.toContainText('새로운 서비스를 준비하고 있습니다');
  await expect(page.getByRole('link', {name:'minusbetastudio@gmail.com ↗'})).toHaveAttribute('href','mailto:minusbetastudio@gmail.com');
  await expect(page.locator('mb-header')).toHaveCount(1);
  return errors;
}

test("organization page explains responsibility on desktop without console errors", async ({ browser }) => {
  const context = await browser.newContext({ ...devices["Desktop Chrome"], viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  expect(await visitOrganization(page)).toEqual([]);
  await page.screenshot({ path: "/tmp/T-260924-049-organization-desktop.png", fullPage: true });
  await context.close();
});

test("organization page explains responsibility on mobile without console errors", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  expect(await visitOrganization(page)).toEqual([]);
  const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
  await page.screenshot({ path: "/tmp/T-260924-049-organization-mobile.png", fullPage: true });
  await context.close();
});
