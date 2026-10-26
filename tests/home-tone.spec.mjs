import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';

test.beforeEach(async ({ page }) => {
  await page.route('https://kangdaejong.com/brand/products/*.webp', route => route.fulfill({
    path: fileURLToPath(new URL('../public' + new URL(route.request().url()).pathname, import.meta.url)),
  }));
});

const ALLOWED_KO_IN_EN = [
  '한국어', // The language selector keeps each language's native name.
  '텔레그램 브릿지', '입타', '자비스', '복붙 정리기', '첫이름',
  '한줄일기', '메모요', '더치페이 계산기', '약먹자', '심플 가계부',
  '계산기알람', '살아있음', '우리 사이', '노래찾기',
  '1인회사 AI자동화', '혼자서 AI팀', '폰으로 내 컴퓨터 AI 부리기',
];
const pageCopy = page => page.evaluate(() => {
  const roots = [document.body, ...[...document.querySelectorAll('mb-header, mb-footer')].map(host => host.shadowRoot).filter(Boolean)];
  return roots.flatMap(root => {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const texts = [];
    while (walker.nextNode()) {
      if (!walker.currentNode.parentElement?.closest('script, style, noscript, template')) texts.push(walker.currentNode.textContent);
    }
    return texts;
  }).join('\n');
});

for (const width of [360, 390, 768, 1440]) {
  test(`homepage navigation and layout at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('안녕하세요.만드는 사람 강대종이에요.'); // T-261024-020: 공개 문구 = 해요체
    await expect(page.locator('#menu-picker')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: '만드는 도구' })).toBeVisible();
    await expect(page.locator('#projects h3')).toHaveText(['텔레그램 브릿지', '입타', '자비스', '복붙 정리기', '첫이름']);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.getByRole('link', { name: '설치 안내', exact: true })).toHaveAttribute('href', '#open-tools');
    await expect(page.getByRole('link', { name: '입타 알아보기' })).toHaveAttribute('href', '/ipta/');
    await page.getByRole('link', { name: '프로젝트 둘러보기' }).click();
    await expect(page).toHaveURL(/#projects$/);
    await expect(page.locator('#projects')).toBeInViewport();
    await expect(page.locator('footer')).toContainText('878-21-02478');
    await page.goto('/');
    await page.screenshot({ path: test.info().outputPath(`home-${width}.png`), fullPage: true });
    await page.screenshot({ path: test.info().outputPath(`home-${width}-top.png`) });
    expect(errors).toEqual([]);
  });
}
test('keyboard entry and reduced motion stay usable', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name:'본문으로 건너뛰기' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#main-content$/);
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe('auto');
});

test('homepage uses friendly Korean and translates copy except product names and the language label', async ({ page }) => {
  await page.goto('/');
  expect(await pageCopy(page)).not.toMatch(/습니다|합니다|입니다/);
  await page.locator('mb-header .lang-button[data-lang="en"]').click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  let copy = await pageCopy(page);
  for (const name of ALLOWED_KO_IN_EN) copy = copy.replaceAll(name, '');
  expect(copy).not.toMatch(/[가-힣]/);
});

for (const width of [390, 1440]) for (const theme of ['light', 'dark']) {
  test(`Cheotireum links and translation fit ${width}px in ${theme} mode`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ colorScheme: theme });
    await page.goto('/');
    const card = page.locator('#projects [data-product-id="cheotireum"]');
    const icon = card.locator('img.project-icon');
    await expect(card.locator('.project-mark')).toHaveCount(0);
    await expect(icon).toHaveCount(1);
    await expect(icon).toHaveAttribute('src', 'https://kangdaejong.com/brand/products/cheotireum.webp');
    await expect(icon).toHaveAttribute('srcset', 'https://kangdaejong.com/brand/products/cheotireum.webp, https://kangdaejong.com/brand/products/cheotireum@2x.webp 2x');
    await expect.poll(() => icon.evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
    await expect(card.locator('.project-note')).toHaveText('웹 서비스 · 작명서 1,000원');
    for (const [name, href] of [
      ['웹에서 시작하기', 'https://cheotireum.kangdaejong.com/'],
      ['무료 샘플', 'https://cheotireum.kangdaejong.com/sample-report'],
      ['한자 확인', 'https://cheotireum.kangdaejong.com/hanja-check'],
      ['서비스 안내', '/cheotireum/'],
    ]) await expect(card.getByRole('link', { name })).toHaveAttribute('href', href);

    for (const lang of ['ko', 'en']) {
      await page.locator(`mb-header .lang-button[data-lang="${lang}"]`).click();
      await expect(page.locator('html')).toHaveAttribute('lang', lang);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const layout = await card.evaluate(el => {
        const box = el.getBoundingClientRect();
        return [...el.querySelectorAll('a')].map(link => {
          const r = link.getBoundingClientRect();
          return { inside: r.left >= box.left && r.right <= box.right, height: r.height };
        });
      });
      expect(layout.every(link => link.inside && link.height >= (width <= 720 ? 44 : 36))).toBe(true);
      await card.screenshot({ path: test.info().outputPath(`cheotireum-${width}-${theme}-${lang}.png`) });
    }
    await expect(card.locator('h3')).toHaveText('Cheotireum (First Name)');
    await expect(card.locator('.project-note')).toHaveText('Web service · Naming report ₩1,000');
    await expect(card.locator('.service-sublinks a')).toHaveText(['Free sample↗', 'Hanja check↗', 'Service guide→']);
    await expect(card.locator('p')).toHaveText('Create a baby naming report with Four Pillars, Five Elements, Hanja meanings, and pronunciation.');
    await expect(card.locator(':scope > a')).toHaveText('Start on the web↗');
    await expect(card).not.toContainText(/[가-힣]/);
    await page.locator('mb-header .lang-button[data-lang="ko"]').click();
    await expect(card.locator('h3')).toHaveText('첫이름');
    await expect(card.locator('.project-mark')).toHaveCount(0);
    await expect(icon).toHaveAttribute('src', 'https://kangdaejong.com/brand/products/cheotireum.webp');
    await card.getByRole('link', { name: '서비스 안내' }).click();
    await expect(page).toHaveURL(/\/cheotireum\/$/);
    await expect(page.locator('main')).toContainText('부족한 오행을 무료로 먼저 살펴보고, 작명서(1,000원)의 제공 내용을 확인한 뒤 결제할 수 있어요.');
  });
}
