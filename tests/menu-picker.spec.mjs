import { test, expect } from '@playwright/test';

const url = process.env.MENU_TEST_URL || '/';
test('draw excludes eaten meals, avoids immediate repeats and persists only today', async ({ page }) => {
  await page.goto(url);
  const card = page.locator('#menu-picker');
  await card.getByText('오늘 먹은 메뉴 제외하기').click();
  await card.getByRole('checkbox', { name: '쌀국수', exact: true }).check();
  const draw = card.getByRole('button', { name: '메뉴 뽑기', exact: true });
  await draw.click();
  const result = card.locator('[data-menu-name]');
  let previous = await result.textContent();
  expect(previous).not.toBe('쌀국수');
  for (let i = 0; i < 10; i++) {
    await draw.click();
    const current = await result.textContent();
    expect(current).not.toBe('쌀국수');
    expect(current).not.toBe(previous);
    previous = current;
  }
  await page.reload();
  await card.getByText('오늘 먹은 메뉴 제외하기').click();
  await expect(card.getByRole('checkbox', { name: '쌀국수', exact: true })).toBeChecked();
  await page.evaluate(() => localStorage.setItem('mb-menu-picker', JSON.stringify({ date: '2000-01-01', eaten: ['pho'] })));
  await page.reload();
  await card.getByText('오늘 먹은 메뉴 제외하기').click();
  await expect(card.getByRole('checkbox', { name: '쌀국수', exact: true })).not.toBeChecked();
});

test('one remaining meal, exhausted list and reset stay usable', async ({ page }) => {
  await page.goto(url);
  const card = page.locator('#menu-picker');
  await card.getByText('오늘 먹은 메뉴 제외하기').click();
  const boxes = card.getByRole('checkbox');
  for (let i = 1; i < await boxes.count(); i++) await boxes.nth(i).check();
  await card.getByRole('button', { name: '메뉴 뽑기', exact: true }).click();
  await expect(card.locator('[data-menu-name]')).toHaveText('비빔밥');
  await card.getByRole('button', { name: '이 메뉴 먹었어요' }).click();
  await expect(card.getByRole('button', { name: '메뉴 뽑기', exact: true })).toBeDisabled();
  await expect(card.locator('[data-menu-name]')).toHaveText('모두 먹었네요!');
  await card.getByRole('button', { name: '제외 목록 초기화' }).click();
  await expect(card.getByRole('button', { name: '메뉴 뽑기', exact: true })).toBeEnabled();
  await expect(card.getByRole('checkbox', { checked: true })).toHaveCount(0);
});

test('blocked storage and narrow screen still allow keyboard drawing', async ({ page }) => {
  await page.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); } }); });
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto(url);
  const card = page.locator('#menu-picker');
  await card.getByRole('button', { name: '메뉴 뽑기', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(card.locator('[data-menu-name]')).not.toHaveText('오늘의 한 끼는?');
  expect(await card.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
});

for (const width of [390, 1440]) test(`homepage card layout at ${width}`, async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width, height: 1000 });
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  const card = page.locator('#menu-picker');
  await card.getByRole('button', { name: '메뉴 뽑기', exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await card.screenshot({ path: test.info().outputPath(`menu-${width}.png`) });
  expect(errors).toEqual([]);
});
