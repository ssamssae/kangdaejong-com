import { test, expect, devices } from "@playwright/test";

async function visitOrganization(page) {
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  const response = await page.goto("/organization/");
  expect(response?.status()).toBe(200);
  await expect(page.locator("main h1").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "아테나" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "강대종" })).toBeVisible();
  await expect(page.getByText("인턴이 승인하는 세 지점")).toBeVisible();
  return consoleErrors;
}

test("organization page renders the editorial tone on desktop without console errors", async ({ browser }) => {
  const context = await browser.newContext({
    ...devices["Desktop Chrome"],
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();
  const consoleErrors = await visitOrganization(page);
  await page.screenshot({ path: "/tmp/T-260824-044-organization-desktop.png", fullPage: true });
  expect(consoleErrors).toEqual([]);
  await context.close();
});

test("organization page renders the editorial tone on mobile without console errors", async ({ browser }) => {
  const context = await browser.newContext({ ...devices["Pixel 7"] });
  const page = await context.newPage();
  const consoleErrors = await visitOrganization(page);
  await page.screenshot({ path: "/tmp/T-260824-044-organization-mobile.png", fullPage: true });
  expect(consoleErrors).toEqual([]);
  await context.close();
});
