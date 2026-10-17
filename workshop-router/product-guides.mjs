export const PRODUCT_BASE = '/product';
import {paidServices} from '../src/data/paid-services.mjs';
const COMPANY = 'https://kangdaejong.com';
const PUBLIC_ORIGIN = COMPANY + PRODUCT_BASE;
export const GUIDE_NAMES = ['claude','codex','cursor','grok'].map(engine => engine + '-telegram-bridge');
export const PRODUCT_PAGES = [PUBLIC_ORIGIN + '/', ...GUIDE_NAMES.map(name => PUBLIC_ORIGIN + '/' + name + '/')];
const UPSTREAM_ORIGIN = 'https://founder.kangdaejong.com';
const GUIDE_PATH = /^\/(claude|codex|cursor|grok)-telegram-bridge(?:\/|$)/;
// T-261012-040: 링크 미리보기 = 회사홈 공용 다크 카드의 고정 주소(kangdaejong-com T-261012-041 계약, scripts/build_bridge_docs.py SHARE_CARD 와 같은 값).
// T-261013-004: 색은 회사홈 공용 tokens.css 하나 — 아래 첫 화면은 그 파일을 읽고 이름(var(--fg) 등)만 쓴다.
const SHARE_CARD = 'https://kangdaejong.com/brand/current/social.png';

const INDEX = `<!doctype html>
<html lang="ko"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<title>제품 사용 안내 · 마이너스베타스튜디오</title>
<meta name="description" content="텔레그램 브릿지 설치 설명서와 첫이름·한장상호·천원 토정비결의 이용 안내입니다.">
<meta property="og:title" content="제품 사용 안내 · 마이너스베타스튜디오">
<meta property="og:description" content="텔레그램 브릿지 설치 설명서와 첫이름·한장상호·천원 토정비결의 이용 안내입니다.">
<meta property="og:url" content="${PUBLIC_ORIGIN}/">
<link rel="canonical" href="${PUBLIC_ORIGIN}/">
<meta property="og:image" content="${SHARE_CARD}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${SHARE_CARD}">
<link rel="stylesheet" href="https://kangdaejong.com/brand/current/tokens.css">
<style>
body{font:18px/1.6 system-ui,sans-serif;max-width:760px;margin:12vh auto;padding:0 24px;color:var(--fg);background:var(--bg)}
h1{line-height:1.2}p{color:var(--fg-dim)}a{color:var(--accent)}li{margin:20px 0}
</style></head><body><main>
<p>PRODUCT GUIDES</p><h1>제품 사용 안내</h1><h2>Telegram Bridge</h2>
<p>텔레그램으로 AI 코딩 도구에 작업을 보내세요.<br>Send work to your AI coding tools from Telegram.</p>
<ul><li><a href="${PUBLIC_ORIGIN}/claude-telegram-bridge/">Claude Telegram Bridge</a></li>
<li><a href="${PUBLIC_ORIGIN}/codex-telegram-bridge/">Codex Telegram Bridge</a></li>
<li><a href="${PUBLIC_ORIGIN}/cursor-telegram-bridge/">Cursor Telegram Bridge</a></li>
<li><a href="${PUBLIC_ORIGIN}/grok-telegram-bridge/">Grok Telegram Bridge</a></li></ul>
<p>각 설명서에서 한국어와 English를 선택할 수 있습니다.<br>Each guide supports Korean and English.</p>
<h2>서비스 안내</h2><ul>${paidServices.map(service=>`<li><a href="${COMPANY}/${service.slug}/">${service.name}</a></li>`).join('')}</ul>
<p><a href="https://kangdaejong.com/">kangdaejong.com</a></p>
</main></body></html>`;

function localResponse(request, body, status, extraHeaders = {}) {
  return new Response(request.method === 'HEAD' ? null : body, {
    status,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': status === 200 ? 'public, max-age=300' : 'no-store',
      'x-content-type-options': 'nosniff',
      ...(status>=400?{'x-robots-tag':'noindex'}:{}),
      ...extraHeaders,
    },
  });
}

export function publicGuideLink(url) {
  const knownOrigin = [UPSTREAM_ORIGIN, 'https://ssamssae.github.io', 'https://product.kangdaejong.com'].includes(url.origin);
  return knownOrigin && GUIDE_PATH.test(url.pathname)
    ? PUBLIC_ORIGIN + url.pathname + url.search + url.hash
    : null;
}

export function rewriteProductHtml(html, url) {
  const canonical = url.origin + url.pathname.replace(/index\.html$/, '');
  return html.replace(
    /https:\/\/(?:ssamssae\.github\.io|founder\.kangdaejong\.com|product\.kangdaejong\.com)\/(claude|codex|cursor|grok)-telegram-bridge(?=[/?#"'\s<)]|$)/g,
    (_, engine) => `${PUBLIC_ORIGIN}/${engine}-telegram-bridge`,
  ).replace(
    /((?:href|src)=["'])\/(claude|codex|cursor|grok)-telegram-bridge(?=[/?#"'])/g,
    (_, attribute, engine) => `${attribute}${PRODUCT_BASE}/${engine}-telegram-bridge`,
  ).replace(/<link\b(?=[^>]*\brel=["']canonical["'])[^>]*>/gi, '')
    .replace(/<meta\b(?=[^>]*\bproperty=["']og:url["'])[^>]*>/gi, '')
    .replace(/<\/head>/i, `<link rel="canonical" href="${canonical}"><meta property="og:url" content="${canonical}"></head>`);
}

export async function handleProductRequest(request, fetchUpstream = fetch) {
  const url = new URL(request.url);
  if (url.origin !== COMPANY || !(url.pathname === PRODUCT_BASE || url.pathname.startsWith(PRODUCT_BASE + '/'))) return localResponse(request, 'Not found', 404);
  const path = url.pathname.slice(PRODUCT_BASE.length) || '/';
  if (!['GET', 'HEAD'].includes(request.method)) {
    return localResponse(request, 'Method not allowed', 405, { allow: 'GET, HEAD' });
  }
  if (url.pathname === PRODUCT_BASE || path === '/index.html') return Response.redirect(PUBLIC_ORIGIN + '/' + url.search, 301);
  if (path === '/sitemap.xml' || path === '/robots.txt') return Response.redirect(COMPANY + path, 301);
  if (path === '/') {
    return localResponse(request, INDEX, 200, { 'content-type': 'text/html; charset=utf-8' });
  }
  if (!GUIDE_PATH.test(path)) {
    return localResponse(request, 'Not found', 404);
  }
  if (/^\/(claude|codex|cursor|grok)-telegram-bridge$/.test(path)) {
    return Response.redirect(PUBLIC_ORIGIN + path + '/' + url.search, 301);
  }
  if (/^\/(claude|codex|cursor|grok)-telegram-bridge\/index\.html$/.test(path)) return Response.redirect(PUBLIC_ORIGIN + path.replace(/index\.html$/, '') + url.search, 301);

  const upstreamUrl = UPSTREAM_ORIGIN + path + url.search;
  let upstream;
  try {
    // Construct a public read request; never forward visitor cookies or credentials.
    upstream = await fetchUpstream(upstreamUrl, {
      method: request.method,
      redirect: 'manual',
      headers: { accept: '*/*' },
      cf: { cacheEverything: true, cacheTtlByStatus: { '200-299': 300, '300-599': 0 } },
    });
  } catch {
    return localResponse(request, 'The guide is temporarily unavailable. Please try again.', 502);
  }

  if (upstream.status >= 300 && upstream.status < 400 && upstream.headers.has('location')) {
    let target;
    try {
      target = publicGuideLink(new URL(upstream.headers.get('location'), upstreamUrl));
    } catch { /* Malformed or off-site redirects must not escape the guide host. */ }
    return target
      ? new Response(null, { status: upstream.status, headers: { location: target, 'cache-control': 'no-store' } })
      : localResponse(request, 'The guide is temporarily unavailable. Please try again.', 502);
  }

  const headers = new Headers(upstream.headers);
  headers.delete('set-cookie');
  headers.set('cache-control', upstream.ok ? 'public, max-age=300' : 'no-store');
  headers.set('x-content-type-options', 'nosniff');
  headers.set('referrer-policy', 'strict-origin-when-cross-origin');
  const noBody = request.method === 'HEAD' || [204, 205, 304].includes(upstream.status);
  let body = noBody ? null : upstream.body;
  if (headers.get('content-type')?.includes('text/html')) {
    for (const header of ['content-length', 'content-encoding', 'etag', 'last-modified']) {
      headers.delete(header);
    }
    if (!noBody) {
      body = rewriteProductHtml(await upstream.text(), url);
    }
  }
  if (upstream.status === 404) headers.set('x-robots-tag', 'noindex');
  return new Response(body, { status: upstream.status, headers });
}

export default {
  fetch(request) {
    return handleProductRequest(request);
  },
};
