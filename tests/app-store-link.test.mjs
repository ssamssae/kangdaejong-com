import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { appStoreUrl } from '../src/lib/app-store-link.mjs';

const script = fileURLToPath(new URL('../scripts/verify-appstore-campaign.mjs', import.meta.url));
const tagged = 'https://apps.apple.com/kr/app/id6762068073?pt=128771490&amp;ct=homepage&amp;mt=8';
const dirs = [];
after(() => dirs.forEach(dir => rmSync(dir, { recursive: true, force: true })));

function verify(pages) {
  const dist = mkdtempSync(join(tmpdir(), 'appstore-campaign-'));
  dirs.push(dist);
  for (const [name, body] of Object.entries(pages)) {
    const file = join(dist, name);
    mkdirSync(join(file, '..'), { recursive: true });
    writeFileSync(file, `<!doctype html><html><body>${body}</body></html>`);
  }
  return spawnSync(process.execPath, [script, '--dist', dist], { encoding: 'utf8' });
}

test('appStoreUrl 은 지금 주소 뒤에 캠페인 표식을 붙인다', () => {
  assert.equal(appStoreUrl('6762068073'), 'https://apps.apple.com/kr/app/id6762068073?pt=128771490&ct=homepage&mt=8');
});

test('appStoreUrl 은 숫자가 아닌 앱 번호를 거부한다', () => {
  assert.throws(() => appStoreUrl('abc'));
});

test('표식이 있는 우리 앱 링크만 있으면 통과한다', () => {
  const result = verify({ 'apps/memo/index.html': `<a href="${tagged}">App Store</a>` });
  assert.equal(result.status, 0, result.stderr);
});

test('표식 없는 우리 앱 링크가 있으면 파일과 앱 번호를 찍고 실패한다', () => {
  const result = verify({
    'index.html': `<a href="${tagged}">App Store</a>`,
    'support/index.html': '<a href="https://apps.apple.com/kr/app/id6811111727">App Store</a>',
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /support\/index\.html: id6811111727/);
});

test('우리 앱 링크가 하나도 없으면 실패한다', () => {
  const result = verify({ 'index.html': '<a href="https://play.google.com/store/apps/details?id=com.daejongkang.stillhere">Google Play</a>' });
  assert.equal(result.status, 1);
});

test('남의 앱 링크는 표식이 없어도 검사하지 않는다', () => {
  const result = verify({ 'index.html': `<a href="https://apps.apple.com/kr/app/id123">Other</a><a href="${tagged}">App Store</a>` });
  assert.equal(result.status, 0, result.stderr);
});
