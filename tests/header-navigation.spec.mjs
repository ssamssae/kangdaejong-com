import { test, expect } from "@playwright/test";
import {fileURLToPath} from 'node:url';

test.beforeEach(async({page})=>{
  await page.route('https://kangdaejong.com/mb-components.js',route=>route.fulfill({path:fileURLToPath(new URL('../public/mb-components.js',import.meta.url)),contentType:'text/javascript'}));
});

const more = page => page.getByRole('button', { name: '둘러보기', exact: true });
const menu = page => page.getByRole('navigation', { name: '스튜디오 둘러보기' });

test('all secondary destinations are reachable in one panel', async ({ page }) => {
  await page.goto('/system/');
  await more(page).click();
  await expect(menu(page).getByRole('link')).toHaveCount(13);
  // T-261013-003: 오프보딩한 전자책 메뉴는 없다.
  await expect(menu(page).getByRole('link', { name: /^책·템플릿/ })).toHaveCount(0);
  // T-261019-026: 10/18 닫은 초소의 「초소」·「운영 정의」 메뉴는 없다.
  await expect(menu(page).getByRole('link', { name: /^(초소|운영 정의)/ })).toHaveCount(0);
  for (const [label, href] of [
    ['스튜디오 소개', 'https://kangdaejong.com/organization/'],
    ['작업장', 'https://kangdaejong.com/work/'],
    ['제품 사용 안내', 'https://kangdaejong.com/product/'],
    ['개발·운영 시스템', 'https://kangdaejong.com/work/system/'],
    ['실험실', 'https://kangdaejong.com/work/lab/'],
  ]) {
    const link = menu(page).getByRole('link', { name: new RegExp('^' + label) });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', href);
  }
});

test('newsletter opens the workshop newsletter page in the same tab', async ({ page, context }) => {
  await context.route('https://kangdaejong.com/work/newsletter/', route => route.fulfill({ body: 'Newsletter' }));
  await page.goto('/system/');
  await more(page).click();
  const link = menu(page).getByRole('link', { name: /^뉴스레터/ });
  await expect(link).toHaveAttribute('href', 'https://kangdaejong.com/work/newsletter/');
  await expect(link).not.toHaveAttribute('target', '_blank');
  await link.click();
  await expect(page).toHaveURL('https://kangdaejong.com/work/newsletter/');
});

test('keyboard opens at the first destination and Escape restores the trigger', async ({ page }) => {
  await page.goto('/system/');
  await more(page).focus();
  await page.keyboard.press('ArrowDown');
  await expect(menu(page).getByRole('link', { name: /^전체 제품/ })).toBeFocused();
  // The deep-document destination is on work.kangdaejong.com, not this local summary.
  await expect(menu(page).getByRole('link', { name: /^개발·운영 시스템/ })).not.toHaveAttribute('aria-current', 'page');
  await page.keyboard.press('Escape');
  await expect(menu(page)).toBeHidden();
  await expect(more(page)).toBeFocused();
  await expect(more(page)).toHaveAttribute('aria-expanded', 'false');
});

for (const width of [320, 390, 800, 1280]) {
  test(`menu stays within the viewport at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 700 });
    await page.goto('/system/');
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
  await page.goto('/system/');
  await more(page).click();
  await page.mouse.click(2, 600);
  await expect(menu(page)).toBeHidden();
  await more(page).click();
  await page.getByRole('link', { name: '연락', exact: true }).focus();
  await expect(menu(page)).toBeHidden();
});

test('lab is a direct destination without a hover flyout', async ({ page, context }) => {
  await context.route('https://kangdaejong.com/work/lab/', route => route.fulfill({ body: 'Lab' }));
  await page.goto('/system/');
  await more(page).click();
  await menu(page).getByRole('link', { name: /^실험실/ }).click();
  await expect(page).toHaveURL('https://kangdaejong.com/work/lab/');
});

test("protein remains reachable from the shared menu and opens the company path", async ({ page, context }) => {
  await context.route('https://kangdaejong.com/protein/', route => route.fulfill({ body: 'Protein atlas' }));
  await page.goto('/system/');
  const links = page.getByRole('navigation', { name: '주요 메뉴' }).getByRole('link');
  await expect(links).toHaveText(['프로젝트', '앱', '연락']);
  await more(page).click();
  await menu(page).getByRole('link', { name: '단백질', exact: true }).click();
  await expect(page).toHaveURL('https://kangdaejong.com/protein/');
});
