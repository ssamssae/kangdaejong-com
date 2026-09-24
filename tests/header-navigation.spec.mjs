import { test, expect } from "@playwright/test";

const more = page => page.getByRole('button', { name: '둘러보기', exact: true });
const menu = page => page.getByRole('navigation', { name: '스튜디오 둘러보기' });

test('all secondary destinations are reachable in one panel', async ({ page }) => {
  await page.goto('/archive/');
  await more(page).click();
  await expect(menu(page).getByRole('link')).toHaveCount(10);
  for (const [label, href] of [
    ['회사·조직도', 'https://kangdaejong.com/organization/'],
    ['작업장', 'https://work.kangdaejong.com/'],
    ['개발·운영 시스템', 'https://work.kangdaejong.com/system/'],
    ['실험실', 'https://work.kangdaejong.com/lab/'],
    ['초소', 'https://choso.kangdaejong.com/guest'],
  ]) {
    const link = menu(page).getByRole('link', { name: new RegExp('^' + label) });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', href);
  }
});

test('newsletter opens safely in a new tab without changing the original route', async ({ page, context }) => {
  await context.route('https://minusbetastudio.substack.com/**', route => route.fulfill({ body: 'Newsletter' }));
  await page.goto('/organization/');
  const originalUrl = page.url();
  await more(page).click();
  const popupPromise = context.waitForEvent('page');
  await menu(page).getByRole('link', { name: /^뉴스레터/ }).click();
  const popup = await popupPromise;
  await expect(popup).toHaveURL('https://minusbetastudio.substack.com/');
  expect(page.url()).toBe(originalUrl);
  expect(await popup.evaluate(() => window.opener)).toBeNull();
});

test('keyboard opens at the first destination and Escape restores the trigger', async ({ page }) => {
  await page.goto('/organization/');
  await more(page).focus();
  await page.keyboard.press('ArrowDown');
  await expect(menu(page).getByRole('link', { name: /^회사·조직도/ })).toBeFocused();
  await expect(menu(page).getByRole('link', { name: /^회사·조직도/ })).toHaveAttribute('aria-current', 'page');
  await page.keyboard.press('Escape');
  await expect(menu(page)).toBeHidden();
  await expect(more(page)).toBeFocused();
  await expect(more(page)).toHaveAttribute('aria-expanded', 'false');
});

for (const width of [320, 390, 800, 1280]) {
  test(`menu stays within the viewport at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 700 });
    await page.goto('/archive/');
    await more(page).click();
    const box = await menu(page).boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(width);
    expect(box.y + box.height).toBeLessThanOrEqual(700);
    await page.getByRole('button', { name: '둘러보기 닫기' }).click();
    await expect(menu(page)).toBeHidden();
    await expect(more(page)).toBeFocused();
  });
}

test('outside click and focus departure close the panel', async ({ page }) => {
  await page.goto('/organization/');
  await more(page).click();
  await page.mouse.click(2, 600);
  await expect(menu(page)).toBeHidden();
  await more(page).click();
  await page.getByRole('link', { name: '문의', exact: true }).focus();
  await expect(menu(page)).toBeHidden();
});

test('lab is a direct destination without a hover flyout', async ({ page, context }) => {
  await context.route('https://work.kangdaejong.com/lab/', route => route.fulfill({ body: 'Lab' }));
  await page.goto('/archive/');
  await more(page).click();
  await menu(page).getByRole('link', { name: /^실험실/ }).click();
  await expect(page).toHaveURL('https://work.kangdaejong.com/lab/');
});

test("protein tab follows public tools and opens the dedicated subdomain", async ({ page, context }) => {
  await context.route('https://protein.kangdaejong.com/', route => route.fulfill({ body: 'Protein atlas' }));
  await page.goto('/archive/');
  const links = page.getByRole('navigation', { name: '주요 메뉴' }).getByRole('link');
  await expect(links).toHaveText(['제품', '책·템플릿', '공개 도구', '단백질']);
  await page.getByRole('link', { name: '단백질', exact: true }).click();
  await expect(page).toHaveURL('https://protein.kangdaejong.com/');
});
