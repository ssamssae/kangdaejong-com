import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { auditInventory, auditProductHtml, auditHtml, auditScreen, isLightSurface, summarize } from '../../scripts/site-release/contract.mjs';
import { rgb } from '../brand-colors.mjs';

const catalog = { products: [{id:'memo',icon:'https://kangdaejong.com/brand/products/memo.webp'}, {id:'local',exception:'No approved image; retain glyph'}] };
const site = {id:'work',url:'https://work.kangdaejong.com/',checks:['tokens','social'],productPages:['/products/']};
const html = '<link rel="stylesheet" href="https://kangdaejong.com/brand/current/tokens.css"><meta property="og:image" content="https://kangdaejong.com/brand/current/social.png">';
test('independent deployment discovery catches a removed work site', () => {
  const discovered={targets:[{url:site.url,source:'github-pages:daejong-page'}]};
  assert.deepEqual(auditInventory({sites:[site]},discovered),[]);
  assert.match(auditInventory({sites:[]},discovered).join('\n'),/unregistered.*work.kangdaejong.com/);
});
test('unknown discovered host and unreasoned exception fail closed', () => {
  assert.equal(auditInventory({sites:[site]}, {targets:[{url:'https://new.kangdaejong.com/',source:'cloudflare'}]}).length,1);
  assert.match(auditInventory({sites:[{...site,mode:'exception'}]}, {targets:[]}).join(''),/reason/);
});
test('old icon, missing icon and an unregistered product fail', () => {
  const card=(id,src)=>`<article class="catalog-card" data-product-id="${id}">${src?`<img src="${src}">`:''}</article>`;
  assert.deepEqual(auditProductHtml(card('memo',catalog.products[0].icon)+card('local'),catalog),[]);
  assert.match(auditProductHtml(card('memo','/product-icons/old.webp'),catalog).join(''),/icon/);
  assert.match(auditProductHtml('<div class="grid">'+card('memo','/old.png')+'</div>',catalog).join(''),/icon/);
  assert.match(auditProductHtml(card('memo'),catalog).join(''),/icon/);
  assert.match(auditProductHtml(card('unknown'),catalog).join(''),/unknown/);
  assert.match(auditProductHtml('<article class="catalog-card"><img src="/old.png"></article>',catalog).join(''),/product id/);
});
test('approved web-service letter marks pass without images and invalid exceptions fail', () => {
  const exception = {status:'approved-placeholder',reason:'Web service card uses approved letter-mark fallback.',fallback:'letter-mark',approvedAt:'2026-10-24'};
  const product = {id:'cheotireum',icon:null,icon2x:null,source:null,files:null,exception};
  const card = '<article class="project-card web-service-card" data-product-id="cheotireum"><span class="project-mark" aria-hidden="true">첫</span></article>';
  assert.deepEqual(auditProductHtml(card,{products:[product]}),[]);
  assert.match(auditProductHtml(card.replace('</article>','<img src="/unapproved.webp"></article>'),{products:[product]}).join(''),/invalid icon exception/);
  for (const invalid of [true, 1, {}, {...exception,status:'pending'}, {...exception,reason:' '}, {...exception,fallback:'image'}, {...exception,approvedAt:''}]) {
    assert.match(auditProductHtml(card,{products:[{...product,exception:invalid}]}).join(''),/invalid icon exception/);
  }
  assert.match(auditProductHtml(card,{products:[{...product,icon:'/unapproved.webp'}]}).join(''),/invalid icon exception/);
});
test('old shared card query and missing shared stylesheet fail', () => {
  assert.deepEqual(auditHtml(html,site,{socialHash:'abcdef'},catalog),[]);
  assert.match(auditHtml(html.replace('social.png','social.png?v=old'),site,{socialHash:'abcdef'},catalog).join(''),/social/);
  assert.match(auditHtml(html.replace('tokens.css','local.css'),site,{socialHash:'abcdef'},catalog).join(''),/tokens/);
});
test('unverified or failed pages never produce a complete report; Telegram is separate', () => {
  const report=summarize([{url:site.url,status:'passed'},{url:'https://missing.test',status:'unverified',errors:['HTTP 503']}]);
  assert.equal(report.complete,false); assert.equal(report.verified,1); assert.equal(report.targets,2);
  assert.equal(report.unverified.length,1); assert.equal(report.telegramPreview,'not_verified');
  assert.equal(summarize([]).complete,false);
  assert.equal(summarize([{url:site.url,status:'exception'}]).complete,false);
});
test('real independent snapshot protects the work site registry entry', () => {
  const inventory=JSON.parse(readFileSync('public/brand/sites.json'));
  const discovered=JSON.parse(readFileSync('docs/site-discovery.json'));
  assert.deepEqual(auditInventory(inventory,discovered),[]);
  inventory.sites=inventory.sites.filter(s=>s.id!=='work');
  assert.match(auditInventory(inventory,discovered).join('\n'),/unregistered.*work.kangdaejong.com/);
});

// T-261024-058: 공개 사이트는 전부 라이트 — 판정은 그려진 결과(계산된 color-scheme·바탕 밝기)로. 선언 문자열(data-theme)은 보지 않는다:
// 선언이 없는 화면(제품 안내 Worker)도, 옛 "auto" 선언이 남은 다른 저장소 라이브도 원본에 다크 블록이 없어 밝으면 통과.
// (T-261024-050 의 「기기 설정을 따르는 화면」 분기는 없다.)
test('screen audit requires a light rendering in both schemes regardless of the declared theme string', () => {
  // 색은 공용 원본에서 계산한다(T-261013-004 — 테스트에 색 값을 다시 적지 않는다).
  const light={overflow:false,declared:'light',theme:'light',bg:rgb('light','--bg'),cards:[rgb('light','--bg-elev')]};
  assert.deepEqual(auditScreen(light,{theme:'light'},'dark'),[]);
  assert.deepEqual(auditScreen(light,{},'light'),[]);
  assert.deepEqual(auditScreen({...light,declared:''},{},'dark'),[]);
  assert.deepEqual(auditScreen({...light,declared:'auto'},{},'dark'),[]);
  assert.match(auditScreen({...light,bg:'rgb(20, 20, 20)'},{},'dark').join('\n'),/dark surface in dark emulation/);
  assert.match(auditScreen({...light,declared:'auto',theme:'dark',bg:'rgb(20, 20, 20)'},{},'dark').join('\n'),/theme mismatch dark[\s\S]*dark surface/);
  assert.match(auditScreen({...light,theme:'dark'},{},'dark').join('\n'),/theme mismatch dark/);
  assert.match(auditScreen({...light,overflow:true},{theme:'light'},'light').join('\n'),/horizontal overflow/);
  assert.equal(isLightSurface('rgba(0, 0, 0, 0)'),true);
  assert.equal(isLightSurface('rgb(20, 20, 20)'),false);
});
