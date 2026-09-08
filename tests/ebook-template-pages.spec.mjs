import { test, expect } from "@playwright/test";

const templateRoutes = [
  ...[
    "t01-task-queue",
    "t02-distribution-rules",
    "t03-approval-gate",
    "t04-incident-response",
  ].map((slug) => `/ai-team-ebook/vol2/templates/${slug}/`),
  ...[
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
  ].map((slug) => `/ebook-automation-workshop/vol1/templates/${slug}/`),
];

test("all public template pages render with usable source actions", async ({ page }) => {
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  for (const route of templateRoutes) {
    const response = await page.goto(route);
    expect(response?.status(), route).toBe(200);
    expect(response?.headers()["content-type"], route).toContain("text/html");
    await expect(page.locator("main h1").first(), route).toBeVisible();
    await expect(page.getByRole("button", { name: "Markdown 전체 복사" }), route).toBeVisible();
    await expect(page.getByRole("link", { name: "Markdown 다운로드" }), route).toHaveAttribute("download", /\.md$/);
  }

  expect(consoleErrors).toEqual([]);
  await page.screenshot({ path: "/tmp/T-260908-056-template-mobile.png", fullPage: true });
});
