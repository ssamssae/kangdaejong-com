import { test, expect } from "@playwright/test";

test("moods change the landscape and quote with one selected button", async ({ page }) => {
  await page.goto("/#mood");
  const corner = page.locator("#mood");
  await expect(corner.getByRole("heading", { name: "잠깐, 오늘의 기분." })).toBeVisible();
  const initialSky = await corner.evaluate(el => getComputedStyle(el).getPropertyValue("--mood-sky"));
  for (const [name, mood, quote] of [
    ["차분함", "calm", "서두르지 않아도, 물결은 앞으로 가요."],
    ["설렘", "spark", "아직 만나지 않은 좋은 일이 있을 거예요."],
    ["잠깐 쉬기", "rest", "아무것도 하지 않는 틈도 하루의 일부니까."],
    ["맑음", "clear", "오늘은 작은 일에도 빛이 드는 날."],
  ]) {
    await corner.getByRole("button", { name, exact: true }).click();
    await expect(corner).toHaveAttribute("data-mood", mood);
    await expect(corner.getByRole("status")).toHaveText(quote);
    await expect(corner.locator(".mood-options [aria-pressed=true]")).toHaveCount(1);
    if (mood !== "clear") expect(await corner.evaluate(el => getComputedStyle(el).getPropertyValue("--mood-sky"))).not.toBe(initialSky);
  }
});

test("keyboard selection and motion pause preserve focus and state", async ({ page }) => {
  await page.goto("/#mood");
  const corner = page.locator("#mood");
  const calm = corner.getByRole("button", { name: "차분함", exact: true });
  await calm.focus();
  await page.keyboard.press("Enter");
  await expect(calm).toHaveAttribute("aria-pressed", "true");
  await expect(calm).toBeFocused();
  const pause = corner.getByRole("button", { name: "움직임 멈추기" });
  await pause.click();
  await expect(corner.locator(".mood-orb")).toHaveCSS("animation-play-state", "paused");
  await corner.getByRole("button", { name: "설렘", exact: true }).click();
  await expect(corner.locator(".mood-orb")).toHaveCSS("animation-play-state", "paused");
  await corner.getByRole("button", { name: "움직임 켜기" }).click();
  await expect(corner.locator(".mood-orb")).toHaveCSS("animation-play-state", "running");
});

test("reduced motion stays still and reacts to preference changes", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#mood");
  const corner = page.locator("#mood");
  await expect(corner.locator(".mood-orb")).toHaveCSS("animation-name", "none");
  await expect(corner.getByRole("button", { name: "움직임 줄이기 설정 중" })).toBeDisabled();
  await corner.getByRole("button", { name: "잠깐 쉬기", exact: true }).click();
  await expect(corner.getByRole("status")).toContainText("아무것도 하지 않는 틈");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(corner.getByRole("button", { name: "움직임 멈추기" })).toBeEnabled();
});

test("small screens fit the corner and all controls", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/#mood");
  for (const name of ["맑음", "차분함", "설렘", "잠깐 쉬기"]) {
    await page.locator("#mood").getByRole("button", { name, exact: true }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  }
});

test("without JavaScript the default landscape remains and inactive controls are hidden", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:4321/#mood");
  await expect(page.locator("#mood").getByRole("status")).toHaveText("오늘은 작은 일에도 빛이 드는 날.");
  await expect(page.locator("#mood .mood-controls")).toBeHidden();
  await expect(page.locator("#mood .mood-orb")).toHaveCSS("animation-play-state", "paused");
  await context.close();
});
