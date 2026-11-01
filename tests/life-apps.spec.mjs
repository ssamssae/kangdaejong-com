import { test, expect } from '@playwright/test';
import { brand, rgb } from './brand-colors.mjs';

const apps = [
  { name: '살아있음', text: '서로의 안부', links: [['살아있음 App Store', 'https://apps.apple.com/kr/app/id6812609143'], ['살아있음 Google Play', 'https://play.google.com/store/apps/details?id=com.daejongkang.stillhere'], ['살아있음 앱 안내와 지원', '/support-stillhere/']] },
  { name: '우리 사이', text: '둘만의 일상', note: 'iPhone · Android 준비 중', links: [['우리 사이 App Store', 'https://apps.apple.com/kr/app/id6816725770'], ['우리 사이 앱 안내와 지원', '/our-sai/']] },
];

for (const width of [390, 1440]) {
  test(`살아있음·우리 사이 app rows link only to live store pages at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    for (const app of apps) {
      const row = page.locator('#products .app-row').filter({ has: page.getByRole('heading', { name: app.name, exact: true }) });
      await expect(row).toHaveCount(1);
      await expect(row).toContainText(app.text);
      if (app.note) await expect(row.locator('.app-status')).toHaveText(app.note);
      await expect(row.locator('a')).toHaveCount(app.links.length);
      for (const [name, href] of app.links) await expect(row.getByRole('link', { name })).toHaveAttribute('href', href);
      const image = row.locator('img');
      await image.scrollIntoViewIfNeeded();
      await expect.poll(() => image.evaluate(i => i.complete && i.naturalWidth > 0)).toBe(true);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

// T-261024-020·026: 앱 줄은 구분선 대신 회색 면 카드다(첫이름·토스 톤). 모서리는 공용 톤 파일 값.
test('app rows are gray cards without divider lines at 1440px', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const rows = await page.locator('#products .app-row').evaluateAll(els => els.map(e => { const s = getComputedStyle(e); return { border: s.borderBottomWidth, radius: s.borderTopLeftRadius, background: s.backgroundColor }; }));
  expect(rows.length).toBeGreaterThan(0);
  for (const row of rows) {
    expect(row.border).toBe('0px');
    expect(row.radius).toBe(brand.light['--tone-radius-card']);
    expect(row.background).toBe(rgb('light', '--bg-elev'));
  }
});

test('우리 사이 intro note links to the App Store and says Android is in preparation', async ({ page }) => {
  await page.goto('/our-sai/');
  const note = page.locator('.note');
  await expect(note).not.toContainText('정식 다운로드는 아직');
  await expect(note.getByRole('link', { name: 'App Store' })).toHaveAttribute('href', 'https://apps.apple.com/kr/app/id6816725770');
  await expect(note).toContainText('Android 버전은 준비하고 있어요');
});
