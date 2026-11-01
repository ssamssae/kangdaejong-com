import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const root = new URL('../dist/', import.meta.url);
const pages = ['index.html', 'cheotireum/index.html'];
const expected = [
  'https://cheotireum.kangdaejong.com/?src=kdj-hero',
  'https://cheotireum.kangdaejong.com/?src=kdj-card',
  'https://cheotireum.kangdaejong.com/sample-report?src=kdj-sample',
  'https://cheotireum.kangdaejong.com/hanja-check?src=kdj-hanja',
  'https://cheotireum.kangdaejong.com/?src=kdj-service#/form',
  'https://cheotireum.kangdaejong.com/sample-report?src=kdj-service-sample',
];
// 서비스 안내 하단의 약관·처리방침·환불정책 문서는 손님 유입 링크가 아니라 표식 대상에서 뺀다.
const policyPaths = new Set(['/terms.html', '/privacy.html', '/refund.html']);

function cheotireumLinks() {
  const links = [];
  for (const page of pages) {
    const file = new URL(page, root);
    assert.ok(existsSync(file), `dist/${page} 없음 — 먼저 npm run build`);
    const html = readFileSync(file, 'utf8');
    for (const [, href] of html.matchAll(/<a\b[^>]*?\shref=["']([^"']+)["']/gi)) {
      const url = href.replaceAll('&amp;', '&');
      if (!/^https?:\/\/cheotireum\.kangdaejong\.com(\/|$)/.test(url)) continue;
      if (page === 'cheotireum/index.html' && policyPaths.has(new URL(url).pathname) && !new URL(url).search) continue;
      links.push({ page, url });
    }
  }
  return links;
}

test('첫이름 링크 6곳에 유입 표식이 정확히 있다', () => {
  const urls = cheotireumLinks().map(link => link.url);
  for (const want of expected) assert.ok(urls.includes(want), `없음: ${want}\n찾은 링크: ${urls.join(', ')}`);
});

test('표식 없는 첫이름 링크가 없다', () => {
  const untagged = cheotireumLinks().filter(({ url }) => !new URL(url).searchParams.has('src'));
  assert.deepEqual(untagged, []);
});

test('표식 값은 허용 형식이고 # 보다 앞에 있다', () => {
  for (const { page, url } of cheotireumLinks()) {
    const hash = url.indexOf('#');
    const src = url.indexOf('src=');
    assert.ok(hash === -1 || src < hash, `${page}: src 가 # 뒤에 있음 — ${url}`);
    assert.match(new URL(url).searchParams.get('src') ?? '', /^[a-z0-9_-]{1,32}$/, `${page}: ${url}`);
  }
});
