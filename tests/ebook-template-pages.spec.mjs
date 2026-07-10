import { test, expect } from "@playwright/test";

const vol1Templates = [
  "t01-repeat-work-inventory",
  "t02-automation-priority-score",
  "t03-ai-assistant-role-card",
  "t04-customer-reply-prompt",
  "t05-naver-kakao-log",
  "t06-content-calendar-prompt",
  "t07-zoom-consulting-summary",
  "t08-proposal-estimate-prompt",
  "t09-weekly-automation-review",
  "t10-privacy-quality-check",
];

test("Vol1 template pages render on mobile without console errors", async ({ page }) => {
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  for (const slug of vol1Templates) {
    const response = await page.goto(`/ebook-automation-workshop/vol1/templates/${slug}`);
    expect(response?.status(), slug).toBe(200);
    expect(response?.headers()["content-type"], slug).toContain("text/html");
    await expect(page.locator("main h1").first(), slug).toBeVisible();
    await expect(page.getByText("원본 Markdown 파일"), slug).toBeVisible();
  }

  expect(consoleErrors).toEqual([]);
  await page.screenshot({ path: "/tmp/T-260711-03-vol1-mobile.png", fullPage: true });
});
