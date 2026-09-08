import { test, expect } from "@playwright/test";

const routes = [
  "/",
  "/organization/",
  "/system/",
  "/ai-team-ebook/vol2/templates/t01-task-queue/",
  "/ai-team-ebook/vol2/templates/t02-distribution-rules/",
  "/ai-team-ebook/vol2/templates/t03-approval-gate/",
  "/ai-team-ebook/vol2/templates/t04-incident-response/",
  "/ebook-automation-workshop/vol1/templates/t01-repeat-work-inventory/",
  "/ebook-automation-workshop/vol1/templates/t02-automation-priority-score/",
  "/ebook-automation-workshop/vol1/templates/t03-ai-assistant-role-card/",
  "/ebook-automation-workshop/vol1/templates/t04-customer-reply-prompt/",
  "/ebook-automation-workshop/vol1/templates/t05-naver-kakao-log/",
  "/ebook-automation-workshop/vol1/templates/t06-content-calendar-prompt/",
  "/ebook-automation-workshop/vol1/templates/t07-zoom-consulting-summary/",
  "/ebook-automation-workshop/vol1/templates/t08-proposal-estimate-prompt/",
  "/ebook-automation-workshop/vol1/templates/t09-weekly-automation-review/",
  "/ebook-automation-workshop/vol1/templates/t10-privacy-quality-check/",
];

test("home leads with products and uses an editorial index instead of repeated cards", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "작고 분명한 도구를 만듭니다." })).toBeVisible();
  await expect(page.locator("#products")).toBeVisible();
  await expect(page.locator("#books")).toBeVisible();
  await expect(page.locator("#open-tools")).toBeVisible();
  await expect(page.locator("#company")).toBeVisible();
  await expect(page.locator(".product-card, .tool-card, .proof-strip")).toHaveCount(0);
  const cheotireumLinks = page.getByRole("link", { name: "첫이름 시작하기" });
  await expect(cheotireumLinks).toHaveCount(2);
  await expect(cheotireumLinks.first()).toHaveAttribute("href", "https://cheotireum.kangdaejong.com/");
});

test("organization explains public responsibility without publishing the internal roster", async ({ page }) => {
  await page.goto("/organization/");
  await expect(page.getByRole("heading", { level: 1, name: "작게 운영해도, 책임은 선명하게." })).toBeVisible();
  await expect(page.getByText("법적 대표 강대종")).toBeVisible();
  await expect(page.locator("main").getByText(/아테나|헤르메스|볼칸/)).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "AI는 도구이고, 결정은 사람의 일입니다." })).toBeVisible();
});

test("system remains local and offers an explicit deep-document link", async ({ page }) => {
  const response = await page.goto("/system/");
  expect(response?.status()).toBe(200);
  await page.waitForTimeout(250);
  expect(new URL(page.url()).pathname).toBe("/system/");
  await expect(page.getByRole("heading", { level: 1, name: "작게 만들고, 확인하고, 오래 돌봅니다." })).toBeVisible();
  await expect(page.getByRole("link", { name: "운영 시스템 자세히 보기" })).toHaveAttribute("href", "https://work.kangdaejong.com/system/");
  await expect(page.locator('meta[http-equiv="refresh"]')).toHaveCount(0);
});

test("template pages expose working copy and download actions near the title", async ({ context, page }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: "http://127.0.0.1:4321" });
  await page.goto("/ebook-automation-workshop/vol1/templates/t03-ai-assistant-role-card/");
  const copy = page.getByRole("button", { name: "Markdown 전체 복사" });
  const download = page.getByRole("link", { name: "Markdown 다운로드" });
  await expect(copy).toBeVisible();
  await expect(download).toHaveAttribute("download", "t03-ai-assistant-role-card.md");
  const downloadEvent = page.waitForEvent("download");
  await download.click();
  expect((await downloadEvent).suggestedFilename()).toBe("t03-ai-assistant-role-card.md");
  await copy.click();
  await expect(page.getByRole("status")).toHaveText("복사했습니다.");
  await expect(copy).toBeFocused();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain("AI 비서 역할 카드");
});

test("offscreen template source stays out of the keyboard tab order", async ({ page }) => {
  await page.goto("/ebook-automation-workshop/vol1/templates/t03-ai-assistant-role-card/");
  const source = page.locator("#template-source");

  await expect(source).toHaveAttribute("aria-hidden", "true");
  await expect(source).toHaveAttribute("tabindex", "-1");

  const focusedIds = [];
  for (let step = 0; step < 20; step += 1) {
    await page.keyboard.press("Tab");
    focusedIds.push(await page.evaluate(() => {
      let active = document.activeElement;
      while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
      return active?.id || active?.getAttribute?.("data-copy-template") || active?.tagName || "";
    }));
  }
  expect(focusedIds).not.toContain("template-source");
});

test("copy fallback reports failure when execCommand returns false", async ({ page }) => {
  await page.goto("/ebook-automation-workshop/vol1/templates/t03-ai-assistant-role-card/");
  await page.evaluate(() => {
    Object.defineProperty(navigator, "clipboard", { value: undefined, configurable: true });
    document.execCommand = () => false;
  });

  const copy = page.getByRole("button", { name: "Markdown 전체 복사" });
  await copy.click();
  await expect(page.getByRole("status")).toHaveText("복사하지 못했습니다. 원본 파일을 열어 복사해 주세요.");
  await expect(page.locator("#template-source")).toHaveAttribute("aria-hidden", "true");
  await expect(copy).toBeFocused();
});

test("copy fallback restores its hidden buffer when execCommand throws", async ({ page }) => {
  await page.goto("/ebook-automation-workshop/vol1/templates/t03-ai-assistant-role-card/");
  await page.evaluate(() => {
    Object.defineProperty(navigator, "clipboard", { value: undefined, configurable: true });
    document.execCommand = () => { throw new Error("copy unavailable"); };
  });

  const copy = page.getByRole("button", { name: "Markdown 전체 복사" });
  await copy.click();
  await expect(page.getByRole("status")).toHaveText("복사하지 못했습니다. 원본 파일을 열어 복사해 주세요.");
  await expect(page.locator("#template-source")).toHaveAttribute("aria-hidden", "true");
  await expect(copy).toBeFocused();
});

test("copy fallback restores visible focus when execCommand returns true", async ({ page }) => {
  await page.goto("/ebook-automation-workshop/vol1/templates/t03-ai-assistant-role-card/");
  await page.evaluate(() => {
    Object.defineProperty(navigator, "clipboard", { value: undefined, configurable: true });
    document.execCommand = () => true;
  });

  const copy = page.getByRole("button", { name: "Markdown 전체 복사" });
  await copy.click();
  await expect(page.getByRole("status")).toHaveText("복사했습니다.");
  await expect(page.locator("#template-source")).toHaveAttribute("aria-hidden", "true");
  await expect(copy).toBeFocused();
});

test("shared components scope the warm palette to explicit studio tone", async ({ page }) => {
  await page.goto("/");
  const palettes = await page.evaluate(() => {
    const readBackground = (element) => getComputedStyle(element).getPropertyValue("--mb-bg").trim().toLowerCase();
    const defaultHeader = document.createElement("mb-header");
    const dataToneFooter = document.createElement("mb-footer");
    dataToneFooter.setAttribute("data-tone", "studio");
    document.body.append(defaultHeader, dataToneFooter);
    return {
      pageStudio: readBackground(document.querySelector("mb-header")),
      defaultConsumer: readBackground(defaultHeader),
      dataToneStudio: readBackground(dataToneFooter),
    };
  });

  expect(palettes).toEqual({
    pageStudio: "#11100e",
    defaultConsumer: "#08090a",
    dataToneStudio: "#11100e",
  });
});

test("local links, anchors, and images resolve on every public route", async ({ page, request }) => {
  const imageFailures = [];
  page.on("response", (response) => {
    if (response.request().resourceType() === "image" && response.status() >= 400) {
      imageFailures.push(`${response.status()} ${response.url()}`);
    }
  });

  const internalLinks = new Set();
  for (const route of routes) {
    await page.goto(route, { waitUntil: "networkidle" });
    await page.locator("body").press("End");
    const hrefs = await page.locator("a").evaluateAll((anchors) => anchors.map((anchor) => anchor.href));
    for (const href of hrefs) {
      const url = new URL(href);
      if (url.origin === "http://127.0.0.1:4321") internalLinks.add(`${url.pathname}${url.search}`);
    }
    const brokenImages = await page.locator("img").evaluateAll((images) => images.filter((image) => image.complete && image.naturalWidth === 0).map((image) => image.src));
    expect(brokenImages, route).toEqual([]);
  }

  for (const href of internalLinks) {
    const response = await request.get(href);
    expect(response.status(), href).toBeLessThan(400);
  }
  expect(imageFailures).toEqual([]);
  for (const id of ["products", "books", "open-tools", "company"]) {
    await expect(page.locator(`body`)).not.toHaveCount(0);
    const response = await request.get(`/#${id}`);
    expect(response.status()).toBe(200);
  }
});

test("core text colors meet WCAG AA contrast on the warm canvas", async ({ page }) => {
  await page.goto("/");
  const colors = await page.evaluate(() => {
    const body = getComputedStyle(document.body);
    const muted = getComputedStyle(document.querySelector(".section-intro"));
    const accent = getComputedStyle(document.querySelector(".eyebrow"));
    return { background: body.backgroundColor, foreground: body.color, muted: muted.color, accent: accent.color };
  });
  const rgb = (value) => value.match(/[\d.]+/g).slice(0, 3).map(Number);
  const luminance = (value) => {
    const channels = rgb(value).map((channel) => channel / 255).map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  };
  const contrast = (foreground, background) => {
    const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
    return (values[0] + 0.05) / (values[1] + 0.05);
  };
  expect(contrast(colors.foreground, colors.background)).toBeGreaterThanOrEqual(4.5);
  expect(contrast(colors.muted, colors.background)).toBeGreaterThanOrEqual(4.5);
  expect(contrast(colors.accent, colors.background)).toBeGreaterThanOrEqual(4.5);
});

test("shared menu closes with Escape and keeps button state in sync", async ({ page }) => {
  await page.goto("/");
  const button = page.getByRole("button", { name: /더보기/ });
  await button.click();
  await expect(button).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Escape");
  await expect(button).toHaveAttribute("aria-expanded", "false");
});

test("all public routes provide core SEO metadata and no console errors", async ({ page }) => {
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  for (const route of routes) {
    const response = await page.goto(route);
    expect(response?.status(), route).toBe(200);
    await expect(page.locator('meta[name="description"]'), route).toHaveAttribute("content", /.{20,}/);
    await expect(page.locator('link[rel="canonical"]'), route).toHaveAttribute("href", /^https:\/\/kangdaejong\.com\//);
    await expect(page.locator("main h1").first(), route).toBeVisible();
  }

  expect(errors).toEqual([]);
});

test("all public routes fit a 360px viewport without page-level overflow", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 360, height: 800 } });
  const page = await context.newPage();

  for (const route of routes) {
    await page.goto(route);
    const dimensions = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(dimensions.scrollWidth, route).toBeLessThanOrEqual(dimensions.clientWidth);
  }

  await context.close();
});
