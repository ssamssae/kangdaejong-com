import { test, expect } from "@playwright/test";

test("newsletter opens a separate page and preserves the current route", async ({ page, context }) => {
  await context.route("https://minusbetastudio.substack.com/**", (route) => route.fulfill({ body: "Newsletter" }));
  await page.goto("/organization/");
  const originalUrl = page.url();
  await page.getByRole("button", { name: /더보기/ }).click();
  const newsletter = page.getByRole("link", { name: "뉴스레터", exact: true });
  await expect(newsletter).toHaveAttribute("target", "_blank");
  const popupPromise = context.waitForEvent("page");
  await newsletter.click();
  const popup = await popupPromise;
  await expect(popup).toHaveURL("https://minusbetastudio.substack.com/");
  expect(page.url()).toBe(originalUrl);
  expect(await popup.evaluate(() => window.opener)).toBeNull();
});

test("desktop workshop opens a right flyout with reachable destinations and keyboard dismissal", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/organization/");
  await page.getByRole("button", { name: /더보기/ }).click();
  const workshop = page.getByRole("button", { name: "작업장", exact: true });
  await workshop.focus();
  await page.keyboard.press("ArrowRight");
  await expect(workshop).toHaveAttribute("aria-expanded", "true");
  const panel = page.getByRole("navigation", { name: "작업장 하위 메뉴" });
  await expect(panel).toBeVisible();
  await expect(panel.getByRole("link", { name: /작업장 둘러보기/ })).toBeFocused();
  await expect(panel.getByRole("link", { name: /실험실/ })).toHaveAttribute("href", "https://work.kangdaejong.com/lab/");
  await expect(panel.getByRole("link", { name: /타임라인/ })).toHaveAttribute("href", "https://work.kangdaejong.com/timeline.html/");
  const parentBox = await workshop.boundingBox();
  const panelBox = await panel.boundingBox();
  expect(panelBox.x).toBeGreaterThanOrEqual(parentBox.x + parentBox.width);
  expect(panelBox.x + panelBox.width).toBeLessThanOrEqual(1280);
  await page.keyboard.press("Escape");
  await expect(panel).toBeHidden();
  await expect(workshop).toBeFocused();
  await expect(page.getByRole("button", { name: /더보기/ })).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: /더보기/ })).toHaveAttribute("aria-expanded", "false");
});

test("mobile workshop expands inline without overflow and resets after outside dismissal", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/");
  const more = page.getByRole("button", { name: /더보기/ });
  await more.click();
  const workshop = page.getByRole("button", { name: "작업장", exact: true });
  await workshop.click();
  const panel = page.getByRole("navigation", { name: "작업장 하위 메뉴" });
  await expect(panel).toBeVisible();
  const parentBox = await workshop.boundingBox();
  const panelBox = await panel.boundingBox();
  expect(panelBox.y).toBeGreaterThanOrEqual(parentBox.y + parentBox.height);
  expect(panelBox.x).toBeGreaterThanOrEqual(0);
  expect(panelBox.x + panelBox.width).toBeLessThanOrEqual(360);
  await page.mouse.click(16, 720);
  await expect(more).toHaveAttribute("aria-expanded", "false");
  await more.click();
  await expect(workshop).toHaveAttribute("aria-expanded", "false");
  await expect(panel).toBeHidden();
});

test("mouse hover and click keep the right flyout usable at the desktop breakpoint", async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 800, height: 720 } });
  await page.goto("http://127.0.0.1:4321/organization/");
  await page.getByRole("button", { name: /더보기/ }).click();
  const workshop = page.getByRole("button", { name: "작업장", exact: true });
  await workshop.hover();
  const panel = page.getByRole("navigation", { name: "작업장 하위 메뉴" });
  await expect(panel).toBeVisible();
  await workshop.click();
  await expect(panel).toBeVisible();
  await panel.getByRole("link", { name: /실험실/ }).hover();
  await expect(panel).toBeVisible();
  const box = await panel.boundingBox();
  expect(box.x + box.width).toBeLessThanOrEqual(800);
  await page.setViewportSize({ width: 360, height: 720 });
  const mobileBox = await panel.boundingBox();
  expect(mobileBox.x + mobileBox.width).toBeLessThanOrEqual(360);
  await page.close();
});
