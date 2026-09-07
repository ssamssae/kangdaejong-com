import { test, expect, devices } from "@playwright/test";

async function verifyHomepage(page) {
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("작게 만들고,오래 운영합니다.");
  await expect(page.locator(".service-feature, .service-card")).toHaveCount(3);
  await expect(page.locator(".app-card")).toHaveCount(7);
  await expect(page.locator(".bridge-flow > li")).toHaveCount(4);
  await expect(page.locator(".book-card")).toHaveCount(3);
  await expect(page.getByRole("heading", { name: "혼자 만들고, 네 개의 AI 작업면을 연결합니다." })).toBeVisible();
  await expect(page.getByText("Cursor", { exact: true })).toBeVisible();

  const layout = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    background: getComputedStyle(document.body).backgroundColor,
  }));
  expect(layout.scrollWidth).toBe(layout.clientWidth);
  expect(layout.background).toBe("rgb(246, 244, 238)");
  expect(consoleErrors).toEqual([]);
}

test("Editorial Lab homepage renders on desktop", async ({ browser }) => {
  const context = await browser.newContext({ ...devices["Desktop Chrome"], viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  await verifyHomepage(page);
  await page.screenshot({ path: "/tmp/T-260904-006-editorial-desktop.png", fullPage: true });
  await context.close();
});

test("Editorial Lab homepage stays complete and overflow-free on mobile", async ({ browser }) => {
  const context = await browser.newContext({ ...devices["Pixel 7"], viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await verifyHomepage(page);
  await page.screenshot({ path: "/tmp/T-260904-006-editorial-mobile.png", fullPage: true });
  await context.close();
});
