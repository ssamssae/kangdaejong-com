import { test, expect } from "@playwright/test";
import { brand, rgb } from './brand-colors.mjs';
import { readFileSync } from 'node:fs';
import { PRODUCT_PAGES } from '../workshop-router/product-guides.mjs';

const routes = ["/", "/organization/", "/system/", "/cheotireum/"];
const retiredTemplateRoutes = [
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

test("home presents apps, books and all five bridges", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toContainText("강대종");
  await expect(page.locator(".app-row")).toHaveCount(9);
  await expect(page.locator(".book-row")).toHaveCount(3);
  await page.locator("#open-tools > summary").click();
  await expect(page.locator(".bridge-links > div")).toHaveCount(5);
  for (const name of ['codex', 'claude', 'cursor', 'grok']) {
    await expect(page.locator(`#open-tools a[href="/product/${name}-telegram-bridge/"]`)).toBeVisible();
    await expect(page.locator(`#open-tools a[href="https://github.com/ssamssae/${name}-telegram-bridge/releases"]`)).toBeVisible();
  }
  // T-261024-056(#188): Grok Bot 은 웹 설명서가 아직 없어 설치 안내가 README 로 간다.
  await expect(page.locator('#open-tools a[href="https://github.com/ssamssae/grokbot-telegram-bridge/blob/main/README.ko.md"]')).toBeVisible();
  await expect(page.locator('#open-tools a[href="https://github.com/ssamssae/grokbot-telegram-bridge/releases"]')).toBeVisible();
  // T-261019-026: 10/18 닫은 초소 카드는 없다.
  await expect(page.locator('.social-grid a[href*="choso.kangdaejong.com"]')).toHaveCount(0);
});

test("organization explains public responsibility without publishing the internal roster", async ({ page }) => {
  await page.goto("/organization/");
  await expect(page.locator('h1')).toContainText('강대종이에요.');
  await expect(page.locator('dl')).toContainText('2026년 5월 4일');
  await expect(page.locator('footer')).toContainText('사업자등록번호 878-21-02478');
  await expect(page.locator('main')).not.toContainText('법적 대표');
});

test("system remains local and offers an explicit deep-document link", async ({ page }) => {
  const response = await page.goto("/system/");
  expect(response?.status()).toBe(200);
  await page.waitForTimeout(250);
  expect(new URL(page.url()).pathname).toBe("/system/");
  await expect(page.getByRole("heading", { level: 1, name: "작게 만들고, 확인하고, 오래 돌봐요." })).toBeVisible();
  await expect(page.locator('main a[href*="choso.kangdaejong.com"]')).toHaveCount(0);
  await expect(page.getByRole("link", { name: "운영 시스템 자세히 보기" })).toHaveAttribute("href", "https://kangdaejong.com/work/system/");
  await expect(page.locator('meta[http-equiv="refresh"]')).toHaveCount(0);
});

test("retired templates stay unpublished and retain the existing edge redirects", async ({ page, request }) => {
  const redirects = readFileSync(new URL('../public/_redirects', import.meta.url), 'utf8');
  for (const prefix of ['/ebook-automation-workshop/vol1/templates/', '/ai-team-ebook/vol2/templates/']) {
    expect(redirects).toContain(`${prefix}* https://kangdaejong.com/work/products/#retired-products 301`);
  }
  // Astro preview does not apply Cloudflare's _redirects; retired files stay absent locally.
  for (const route of retiredTemplateRoutes) {
    expect((await request.get(route)).status(), route).toBe(404);
    expect((await request.get(route.replace(/\/$/, '.md'))).status(), route).toBe(404);
  }
  await page.goto(retiredTemplateRoutes[0]);
  await expect(page.getByRole('heading', { name: '페이지를 찾을 수 없어요.' })).toBeVisible();
  await expect(page.locator('#template-source, [data-copy-template], a[download]')).toHaveCount(0);
  await page.getByRole('link', { name: '홈으로 돌아가기' }).click();
  await expect(page.locator('[data-product-id="cheotireum"]')).toBeVisible();
});

test("shared components use the homepage palette for every consumer", async ({ page }) => {
  await page.goto("/system/");
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
    pageStudio: brand.light['--mb-host-bg'],
    defaultConsumer: brand.light['--mb-host-bg'],
    dataToneStudio: brand.light['--mb-host-bg'],
  });
});

test("static links, anchors, and images resolve on current home and service routes", async ({ page, request }) => {
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
    const hrefs = await page.locator("a[href]").evaluateAll((anchors) => anchors.map((anchor) => anchor.href));
    for (const href of hrefs) {
      const url = new URL(href);
      if (url.origin === "http://127.0.0.1:4321") internalLinks.add(`${url.pathname}${url.search}`);
    }
    const brokenImages = await page.locator("img").evaluateAll((images) => images.filter((image) => image.complete && image.naturalWidth === 0).map((image) => image.src));
    expect(brokenImages, route).toEqual([]);
  }

  for (const href of internalLinks) {
    // These exact guide routes are served by the Worker, covered by test:work-route.
    if (PRODUCT_PAGES.includes(new URL(href, 'https://kangdaejong.com').href)) continue;
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

test("home text colors meet WCAG AA contrast", async ({ page }) => {
  await page.goto("/");
  const colors = await page.evaluate(() => {
    const body = getComputedStyle(document.body);
    const muted = getComputedStyle(document.querySelector(".intro-description"));
    const accent = getComputedStyle(document.querySelector(".intro-links a"));
    // T-261024-020: 첫 링크는 파란 버튼(흰 글자)이라 버튼 바탕과 비교한다.
    return { background: body.backgroundColor, foreground: body.color, muted: muted.color, accent: accent.color, accentBackground: accent.backgroundColor };
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
  expect(contrast(colors.accent, colors.accentBackground)).toBeGreaterThanOrEqual(4.5);
});

test("shared menu closes with Escape and keeps button state in sync", async ({ page }) => {
  await page.goto("/system/");
  const button = page.getByRole("button", { name: "둘러보기", exact: true });
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
