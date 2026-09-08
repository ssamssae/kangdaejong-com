import { test, expect, devices } from "@playwright/test";

async function visitOrganization(page) {
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  const response = await page.goto("/organization/");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1, name: "작게 운영해도, 책임은 선명하게." })).toBeVisible();
  await expect(page.getByText("법적 대표 강대종")).toBeVisible();
  await expect(page.getByRole("heading", { name: "AI는 도구이고, 결정은 사람의 일입니다." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "내보내기 전에 보는 세 가지." })).toBeVisible();
  await expect(page.locator("main").getByText(/아테나|헤르메스|볼칸/)).toHaveCount(0);
  return errors;
}

test("organization page explains responsibility on desktop without console errors", async ({ browser }) => {
  const context = await browser.newContext({ ...devices["Desktop Chrome"], viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  expect(await visitOrganization(page)).toEqual([]);
  await page.screenshot({ path: "/tmp/T-260908-056-organization-desktop.png", fullPage: true });
  await context.close();
});

test("organization page explains responsibility on mobile without console errors", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  expect(await visitOrganization(page)).toEqual([]);
  const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
  await page.screenshot({ path: "/tmp/T-260908-056-organization-mobile.png", fullPage: true });
  await context.close();
});
