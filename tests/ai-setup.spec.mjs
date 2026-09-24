import { test, expect } from '@playwright/test';
const base = process.env.SETUP_BASE_URL || 'http://127.0.0.1:14339';
async function fill(page, os = 'mac') {
  await page.selectOption('#os', os);
  await page.selectOption('#ai', 'codex');
  for (const id of ['ready', 'telegram', 'online']) await page.selectOption(`#${id}`, 'yes');
  await page.getByRole('button', {name:'점검 결과 보기'}).click();
}
test('homepage links to offer; no checkout or fake successful submission', async ({page}) => {
  await page.goto(base);
  await page.getByRole('link', {name:'내 환경 확인하기'}).click();
  await expect(page).toHaveURL(/ai-setup/);
  await expect(page.locator('h1')).toContainText('내 컴퓨터가 답하도록');
  await expect(page.locator('.hero')).toContainText('현재는 사전 상담만');
  await expect(page.locator('#result')).toBeHidden();
});
test('ready environment gets a reviewable mail draft without transmitting answers', async ({page}) => {
  await page.goto(`${base}/ai-setup/`);
  const outgoing = [];
  page.on('request', r => { if (r.method() !== 'GET') outgoing.push(r.url()); });
  await fill(page);
  await expect(page.locator('#result-title')).toHaveText('기본 준비 조건을 확인했어요.');
  await expect(page.locator('#result-text')).toContainText('확정된 것은 아닙니다');
  const href = await page.locator('#email').getAttribute('href');
  expect(href).toMatch(/^mailto:minusbetastudio@gmail.com/);
  expect(decodeURIComponent(href)).toContain('Codex');
  expect(outgoing).toEqual([]);
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
  await page.selectOption('#os','windows');
  await expect(page.locator('#result')).toBeHidden();
  await expect(page.locator('#inquiry')).toHaveValue('');
  await expect(page.locator('#email')).not.toHaveAttribute('href');
});
test('unsupported and unprepared environments are not accepted', async ({page}) => {
  await page.goto(`${base}/ai-setup/`);
  await fill(page, 'windows');
  await expect(page.locator('#result-text')).toContainText('유료 설치 가능 판정이 아닙니다');
  await page.selectOption('#os','mac');
  await page.selectOption('#ready','no');
  await page.getByRole('button',{name:'점검 결과 보기'}).click();
  await expect(page.locator('#result-title')).toHaveText('먼저 확인할 준비 사항이 있어요.');
});
test('required fields and clipboard denial remain usable', async ({page}) => {
  await page.goto(`${base}/ai-setup/`);
  await page.getByRole('button',{name:'점검 결과 보기'}).click();
  await expect(page.locator('#result')).toBeHidden();
  await fill(page);
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', {value:{writeText:async()=>{throw new Error('denied');}}, configurable:true}));
  await page.getByRole('button',{name:'문의 내용 복사'}).click();
  await expect(page.locator('#copy-status')).toContainText('직접 복사');
  await expect(page.locator('#inquiry')).toBeFocused();
});
for (const width of [390, 1440]) test(`layout ${width}`, async ({page}, testInfo) => {
  await page.setViewportSize({width,height:900});
  await page.goto(`${base}/ai-setup/`);
  await fill(page);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({path:testInfo.outputPath(`ai-setup-${width}.png`),fullPage:true});
});
