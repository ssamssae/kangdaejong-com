import { test, expect } from '@playwright/test';

// T-261102-002: 살아있음 초대 링크 착지 페이지(/stillhere/join/#STILLHERE2:…).
// 기본 기기(Pixel 7)는 Android 라서 intent 링크, iPhone 은 stillhere:// 링크를 확인한다.
// 초대는 주소의 # 뒤에만 있어야 한다 — 어떤 요청(주소·본문·헤더)이나 콘솔에도 나오면 안 된다.
const MARKER = 'T261102JoinMarker';
const invite = `STILLHERE2:${(MARKER + '_-eyJ2IjoyLCJrIjoiYWJjIn0').repeat(12)}`;
const code = encodeURIComponent(invite);
const appStore = 'https://apps.apple.com/kr/app/id6812609143';
const googlePlay = 'https://play.google.com/store/apps/details?id=com.daejongkang.stillhere';
const intent = `intent://join?code=${code}#Intent;scheme=stillhere;package=com.daejongkang.stillhere;S.browser_fallback_url=${encodeURIComponent(googlePlay)};end`;
const iPhone = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const INVALID = '초대 링크가 올바르지 않아요. 받은 링크를 다시 눌러 주세요.';
const RETURN = '설치한 뒤 이 페이지로 돌아와 「살아있음 앱에서 연결하기」를 눌러 주세요.';

const openButton = page => page.getByRole('link', { name: '살아있음 앱에서 연결하기' });
async function expectInstallLinks(page) {
  await expect(page.getByRole('heading', { name: '앱이 없나요?' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'App Store' })).toHaveAttribute('href', appStore);
  await expect(page.getByRole('link', { name: 'Google Play' })).toHaveAttribute('href', googlePlay);
}

test('valid invite on Android: intent button, install links, copy fallback, invite never leaves the page', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const wire = [];
  page.on('request', request => {
    const url = new URL(request.url());
    url.hash = '';
    wire.push([url.href, request.postData() || '', JSON.stringify(request.headers())].join('\n'));
  });
  const logs = [];
  page.on('console', message => logs.push(message.text()));
  const response = await page.goto(`/stillhere/join/#${invite}`);
  expect(response.status()).toBe(200);
  await expect(page.locator('h1')).toHaveText('살아있음 연결 초대');
  await expect(page.locator('main')).toContainText('살아있음은 하루 한 번 버튼을 눌러 서로 잘 지내는지 알리는 앱이에요.');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://kangdaejong.com/stillhere/join/');
  await expect(openButton(page)).toHaveAttribute('href', intent);
  await expect(page.getByText(INVALID)).toBeHidden();
  await expectInstallLinks(page);
  await expect(page.getByText(RETURN)).toBeVisible();
  await expect(page.getByRole('heading', { name: '버튼이 안 되면' })).toBeVisible();
  await expect(page.locator('main')).toContainText('살아있음 앱 「서로 연결」 탭에서 「클립보드에서 붙여넣기」를 누른 뒤 「코드로 연결」을 눌러 주세요.');
  await page.getByRole('button', { name: '초대 링크 복사' }).click();
  await expect(page.getByRole('status')).toHaveText('복사했어요');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(`stillhere://join?code=${code}`);
  // 처음 열 때 앱으로 자동 이동하지 않는다.
  expect(page.url()).toContain(`/stillhere/join/#STILLHERE2:${MARKER}`);
  expect(wire.length).toBeGreaterThan(0);
  expect(wire.filter(item => item.includes(MARKER) || item.includes('STILLHERE2'))).toEqual([]);
  expect(logs.filter(text => text.includes(MARKER))).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test.describe('on iPhone', () => {
  test.use({ userAgent: iPhone });
  test('valid invite opens the stillhere scheme, also when the hash is percent-encoded', async ({ page }) => {
    const longest = `STILLHERE2:${'A'.repeat(4096 - 'STILLHERE2:'.length)}`;
    for (const [hash, expected] of [[invite, invite], [encodeURIComponent(invite), invite], [longest, longest]]) {
      await page.goto('about:blank'); // 매번 새로 연다(# 만 바뀌면 같은 화면 안 이동이 된다).
      await page.goto(`/stillhere/join/#${hash}`);
      await expect(openButton(page)).toHaveAttribute('href', `stillhere://join?code=${encodeURIComponent(expected)}`);
    }
  });
});

test('missing or invalid invite shows the error with install links only', async ({ page }) => {
  const cases = ['', '#', '#hello', `#STILLHERE2:${'A'.repeat(4096)}`, '#STILLHERE2:abc%20def', '#STILLHERE2:abc%0Adef', '#STILLHERE2:%E0%A4%A'];
  for (const hash of cases) {
    await page.goto('about:blank'); // 매번 새로 연다(# 만 바뀌면 같은 화면 안 이동이 된다).
    await page.goto(`/stillhere/join/${hash}`);
    await expect(page.getByText(INVALID), hash).toBeVisible();
    await expect(openButton(page), hash).toHaveCount(0);
    await expect(page.getByRole('button', { name: '초대 링크 복사' }), hash).toBeHidden();
    await expect(page.getByText(RETURN), hash).toBeHidden();
    await expectInstallLinks(page);
  }
  // 같은 화면에서 # 뒤만 바뀌어도 다시 판단한다.
  await page.evaluate(value => { location.hash = value; }, invite);
  await expect(openButton(page)).toHaveAttribute('href', intent);
  await expect(page.getByText(INVALID)).toBeHidden();
});

test('assetlinks.json ships in the build for StillHere Android app links', async ({ request }) => {
  const response = await request.get('/.well-known/assetlinks.json');
  expect(response.status()).toBe(200);
  const statements = JSON.parse(await response.text());
  expect(statements).toHaveLength(1);
  const [statement] = statements;
  expect(statement.relation).toEqual(['delegate_permission/common.handle_all_urls']);
  expect(statement.target.namespace).toBe('android_app');
  expect(statement.target.package_name).toBe('com.daejongkang.stillhere');
  // Play 앱 서명 키(스토어 설치본)와 업로드 키(직접 설치한 릴리스본) 지문.
  expect(statement.target.sha256_cert_fingerprints).toEqual([
    'C8:92:BD:19:1F:78:87:08:11:04:D1:30:13:2E:10:46:55:E9:2E:0F:6C:93:31:C4:2B:9F:41:31:25:9E:62:F7',
    'EB:DD:31:6E:86:12:B3:4F:95:85:0B:7E:7F:48:40:C7:12:F2:73:0D:07:6C:1C:CB:EE:DF:73:08:C0:51:18:32',
  ]);
});

test('apple-app-site-association ships in the build for /stillhere/join', async ({ request }) => {
  const response = await request.get('/.well-known/apple-app-site-association');
  expect(response.status()).toBe(200);
  const { applinks } = JSON.parse(await response.text());
  expect(applinks.apps).toEqual([]);
  expect(applinks.details).toHaveLength(1);
  const [detail] = applinks.details;
  expect(detail.appID).toBe('46UH85U2B8.com.daejongkang.stillhere');
  expect(detail.appIDs).toEqual(['46UH85U2B8.com.daejongkang.stillhere']);
  expect(detail.paths).toEqual(['/stillhere/join', '/stillhere/join/*']);
  expect(detail.components.map(component => component['/'])).toEqual(['/stillhere/join', '/stillhere/join/*']);
});
