import { test, expect } from '@playwright/test';

test('protein gallery has twenty loaded structures and accessible header navigation', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('20가지');
  await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href', 'https://protein.kangdaejong.com/');
  await expect(page.getByRole('link', { name: '단백질', exact: true })).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('.amino-card')).toHaveCount(20);
  for (const img of await page.locator('.amino-card img').all()) {
    await img.scrollIntoViewIfNeeded();
    await expect(img).toHaveJSProperty('complete', true);
    expect(await img.evaluate(el => el.naturalWidth)).toBeGreaterThan(100);
  }
});

test('search, category filters and empty results work together', async ({ page }) => {
  await page.goto('/');
  const search = page.getByRole('searchbox');
  await search.fill('트립토판');
  await expect(page.locator('.amino-card:visible')).toHaveCount(1);
  await search.fill('Trp');
  await expect(page.locator('.amino-card:visible')).toHaveCount(1);
  await search.fill('');
  await page.getByRole('button', { name: '산성', exact: true }).click();
  await expect(page.locator('.amino-card:visible')).toHaveCount(2);
  await search.fill('없는이름');
  await expect(page.getByText('일치하는 아미노산이 없습니다.')).toBeVisible();
  await page.getByRole('button', { name: '초기화', exact: true }).click();
  await expect(page.locator('.amino-card:visible')).toHaveCount(20);
});

for (const width of [360, 800, 1440]) {
  test(`protein layout fits ${width}px viewport`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.getByRole('link', { name: '단백질', exact: true })).toBeVisible();
  });
}

test('all twenty molecules open with one reusable 3D canvas and lazy loading', async ({ page }) => {
  test.setTimeout(90000);
  const requests = [];
  page.on('request', r => requests.push(r.url()));
  await page.goto('/');
  expect(requests.some(url => url.includes('3Dmol-min.js'))).toBe(false);
  const buttons = page.getByRole('button', { name: /3D로 보기$/ });
  await expect(buttons).toHaveCount(20);
  for (const button of await buttons.all()) {
    await button.click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.locator('#molecule-status')).toHaveText('드래그해서 돌려보세요.');
    await expect(page.locator('#molecule-stage canvas')).toHaveCount(1);
    await page.getByRole('button', { name: '3D 보기 닫기' }).click();
    await expect(button).toBeFocused();
  }
  expect(requests.filter(url => url.includes('3Dmol-min.js'))).toHaveLength(1);
});

test('mouse drag, wheel, buttons and reset change the visible molecular view', async ({ browser, baseURL }) => {
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 }, baseURL });
  try {
    await page.goto('/');
    await page.getByRole('button', { name: '트립토판 3D로 보기', exact: true }).click();
    await expect(page.locator('#molecule-status')).toHaveText('드래그해서 돌려보세요.');
    const canvas = page.locator('#molecule-stage canvas');
    const before = await canvas.screenshot();
    const box = await canvas.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down(); await page.mouse.move(box.x + box.width / 2 + 85, box.y + box.height / 2 + 40, { steps: 12 }); await page.mouse.up();
    expect((await canvas.screenshot()).equals(before)).toBe(false);
    await page.getByRole('button', { name: '원래대로' }).click();
    expect((await canvas.screenshot()).equals(before)).toBe(true);
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.wheel(0, -140);
    await expect.poll(async () => (await canvas.screenshot()).equals(before)).toBe(false);
    await page.getByRole('button', { name: '원래대로' }).click();
    await page.getByRole('button', { name: '확대', exact: true }).click();
    expect((await canvas.screenshot()).equals(before)).toBe(false);
    await page.locator('#molecule-stage').focus(); await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByRole('button', { name: '트립토판 3D로 보기', exact: true })).toBeFocused();
  } finally { await page.close(); }
});

test('failed structure download offers retry and never shows the previous molecule', async ({ page }) => {
  await page.goto('/');
  await page.route('**/protein/structures/alanine.sdf', r => r.fulfill({ status: 503, body: '' }));
  await page.getByRole('button', { name: '알라닌 3D로 보기', exact: true }).click();
  await expect(page.getByRole('button', { name: '다시 시도' })).toBeVisible();
  await expect(page.getByRole('button', { name: '확대', exact: true })).toBeDisabled();
  await page.unroute('**/protein/structures/alanine.sdf');
  await page.getByRole('button', { name: '다시 시도' }).click();
  await expect(page.locator('#molecule-status')).toHaveText('드래그해서 돌려보세요.');
  await page.getByRole('button', { name: '3D 보기 닫기' }).click();
});

test('mobile touch rotation and pinch zoom work without overflowing the dialog', async ({ page, context }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/');
  await page.getByRole('button', { name: '알라닌 3D로 보기', exact: true }).click();
  await expect(page.locator('#molecule-status')).toHaveText('드래그해서 돌려보세요.');
  const canvas = page.locator('#molecule-stage canvas');
  const box = await canvas.boundingBox();
  const before = await canvas.screenshot();
  const client = await context.newCDPSession(page);
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1 }] });
  for (let i = 1; i <= 8; i++) await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + i * 6, y: y + i * 2, id: 1 }] });
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  expect((await canvas.screenshot()).equals(before)).toBe(false);
  await page.getByRole('button', { name: '원래대로' }).click();
  await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x - 25, y, id: 1 }, { x: x + 25, y, id: 2 }] });
  for (let i = 1; i <= 6; i++) await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x - 25 - i * 5, y, id: 1 }, { x: x + 25 + i * 5, y, id: 2 }] });
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  expect((await canvas.screenshot()).equals(before)).toBe(false);
  const bounds = await page.getByRole('dialog').boundingBox();
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(360);
  await page.getByRole('button', { name: '3D 보기 닫기' }).click();
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe('hidden');
});

test('closing during loading does not replace a subsequently opened molecule', async ({ page }) => {
  let release;
  const pending = new Promise(resolve => { release = resolve; });
  await page.route('**/protein/structures/alanine.sdf', async route => { await pending; await route.continue().catch(() => {}); });
  await page.goto('/');
  await page.getByRole('button', { name: '알라닌 3D로 보기', exact: true }).click();
  await page.getByRole('button', { name: '3D 보기 닫기' }).click();
  await page.getByRole('button', { name: '트립토판 3D로 보기', exact: true }).click();
  release();
  await expect(page.locator('#molecule-status')).toHaveText('드래그해서 돌려보세요.');
  await expect(page.getByRole('dialog')).toHaveAccessibleName('트립토판 · Trp');
  await page.getByRole('button', { name: '3D 보기 닫기' }).click();
});
