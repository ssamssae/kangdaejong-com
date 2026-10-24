import { test, expect } from '@playwright/test';

test('homepage card opens the public tool and the tool links back', async ({ page }) => {
  await page.goto('/');
  const card = page.locator('#projects .text-tool-card');
  await expect(card.getByRole('heading', { name: '복붙 정리기' })).toBeVisible();
  await card.getByRole('link', { name: '글 정리하기' }).click();
  await expect(page).toHaveURL(/\/tools\/text\/$/);
  await expect(page).toHaveTitle('복붙 정리기 — 글을 깔끔하게');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://kangdaejong.com/tools/text/');
  await page.locator('footer').getByRole('link', { name: '홈페이지' }).click();
  await expect(page).toHaveURL(/\/#projects$/);
});

test('the header shows the studio logo and visible home navigation on phones and desktop', async ({ page }) => {
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/tools/text/');
    const header = page.locator('header');
    const brand = header.getByRole('link', { name: '마이너스베타스튜디오 홈페이지', exact: true });
    const home = header.getByRole('link', { name: '홈페이지', exact: true });
    await expect(brand).toBeInViewport();
    await expect(brand).toHaveAttribute('href', '/');
    await expect(brand.locator('img')).toHaveAttribute('src', '/brand/current/logo.svg');
    expect(await brand.locator('img').evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
    await expect(home).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: test.info().outputPath(`text-header-${width}.png`) });
    await (width === 390 ? brand : home).click();
    await expect(page).toHaveURL('http://127.0.0.1:4321/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('강대종');
  }
});

test('cleaning modes preserve the original and reject stale results', async ({ page }) => {
  await page.goto('/tools/text/');
  await expect(page.locator('#copy')).toBeDisabled();
  await page.locator('#source').fill('  첫   문장\n이어지는 말\n\n- 항목 하나\n- 항목 둘  ');
  const original = await page.locator('#source').inputValue();
  await page.locator('#clean').click();
  await expect(page.locator('#result')).toHaveValue('첫 문장\n이어지는 말\n\n- 항목 하나\n- 항목 둘');
  await page.getByLabel('끊긴 줄 연결', { exact: true }).check();
  await expect(page.locator('#result')).toHaveValue('첫 문장 이어지는 말\n\n- 항목 하나\n- 항목 둘');
  await page.getByLabel('한 줄로', { exact: true }).check();
  await expect(page.locator('#result')).toHaveValue('첫 문장 이어지는 말 - 항목 하나 - 항목 둘');
  await expect(page.locator('#source')).toHaveValue(original);
  await page.locator('#source').fill('수정한   글');
  await expect(page.locator('#result')).toHaveValue('');
  await expect(page.locator('#copy')).toBeDisabled();
  await page.locator('#source').press('Control+Enter');
  await expect(page.locator('#result')).toHaveValue('수정한 글');
});

test('clear can be undone and the sample never replaces existing text', async ({ page }) => {
  await page.goto('/tools/text/');
  await page.locator('#source').fill('  내 원문  ');
  await expect(page.locator('#sample')).toBeDisabled();
  await page.locator('#clear').click();
  await page.locator('#undo').click();
  await expect(page.locator('#source')).toHaveValue('  내 원문  ');
  await page.locator('#clear').click();
  await page.locator('#sample').click();
  await expect(page.locator('#undo')).toBeHidden();
  await expect(page.locator('#result')).not.toHaveValue('');
});

test('copy sends only the cleaned result and offers manual copy when denied', async ({ page }) => {
  await page.goto('/tools/text/');
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', {
    configurable: true, value: { writeText: async value => { window.copiedValue = value; } },
  }));
  await page.locator('#source').fill(' 복사할   글 ');
  await page.locator('#clean').click();
  await page.locator('#copy').click();
  expect(await page.evaluate(() => window.copiedValue)).toBe('복사할 글');
  await expect(page.locator('#status')).toContainText('클립보드에 복사');
  await page.evaluate(() => {
    navigator.clipboard.writeText = async () => { throw new Error('denied'); };
    document.execCommand = () => false;
  });
  await page.locator('#copy').click();
  await expect(page.locator('#status')).toContainText('자동 복사를 할 수 없어요');
  expect(await page.locator('#result').evaluate(e => e.value.slice(e.selectionStart, e.selectionEnd))).toBe('복사할 글');
});

test('text remains local, literal and unsaved, including HTML-looking input', async ({ page, context }) => {
  const requests = [];
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/tools/text/');
  // The branded favicon can load after the document load event. Observe only
  // requests triggered by input after the page's static assets have settled.
  await page.waitForLoadState('networkidle');
  page.on('request', request => requests.push(request.url()));
  await page.locator('#source').fill('<img src="https://invalid.example/x" onerror="window.bad=true">  🧑🏽‍💻');
  await page.locator('#clean').click();
  await expect(page.locator('#result')).toHaveValue('<img src="https://invalid.example/x" onerror="window.bad=true"> 🧑🏽‍💻');
  expect(await page.locator('.workspace img').count()).toBe(0);
  expect(await page.evaluate(() => window.bad)).toBeUndefined();
  expect(requests).toEqual([]);
  expect(await page.evaluate(() => [localStorage.length, sessionStorage.length])).toEqual([0, 0]);
  expect(await context.cookies()).toEqual([]);
  await page.reload();
  await expect(page.locator('#source')).toHaveValue('');
  expect(errors).toEqual([]);
});

test('the tool works without overflow at phone, tablet and desktop widths', async ({ page }) => {
  await page.goto('/tools/text/');
  await page.locator('#sample').click();
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.locator('#copy').scrollIntoViewIfNeeded();
    await expect(page.locator('#copy')).toBeVisible();
    await page.screenshot({ path: test.info().outputPath(`text-${width}.png`), fullPage: true });
  }
});

test('the tool follows the homepage palette, typography and width in both system themes', async ({ page }) => {
  const errors = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', error => errors.push(error.message));
  const appearance = () => page.evaluate(async () => {
    await document.fonts.ready;
    const body = getComputedStyle(document.body);
    const main = document.querySelector('main');
    const title = getComputedStyle(document.querySelector('h1'));
    return {
      background: body.backgroundColor,
      color: body.color,
      font: body.fontFamily,
      headingSize: title.fontSize,
      headingWeight: title.fontWeight,
      accent: body.getPropertyValue('--accent').trim(),
      width: main.getBoundingClientRect().width,
    };
  });
  for (const width of [320, 390, 768, 1440, 1920]) {
    await page.setViewportSize({ width, height: 1000 });
    const homepage = {};
    for (const colorScheme of ['light', 'dark']) {
      await page.emulateMedia({ colorScheme });
      await page.goto('/');
      homepage[colorScheme] = await appearance();
    }
    await page.goto('/tools/text/');
    await page.locator('#sample').click();
    const result = await page.locator('#result').inputValue();
    for (const colorScheme of ['light', 'dark']) {
      await page.emulateMedia({ colorScheme });
      expect(await appearance()).toEqual(homepage[colorScheme]);
      await expect(page.locator('#result')).toHaveValue(result);
      await expect(page.locator('#copy')).toBeEnabled();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      expect(await page.evaluate(() => document.fonts.check('600 16px "Pretendard Variable"'))).toBe(true);
      await page.screenshot({ path: test.info().outputPath(`text-tone-${colorScheme}-${width}.png`), fullPage: true });
    }
    // T-261024-050: 회사 홈은 다크를 풀었다 — 기기 설정이 달라도 같은 라이트 값이다.
    expect(homepage.light.background).toBe(homepage.dark.background);
    expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe('light');
  }
  expect(errors).toEqual([]);
});

test('the sitemap includes the selected public address', async ({ request }) => {
  const response = await request.get('/sitemap.xml');
  expect(response.ok()).toBe(true);
  expect(await response.text()).toContain('<loc>https://kangdaejong.com/tools/text/</loc>');
});
