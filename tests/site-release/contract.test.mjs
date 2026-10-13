import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { auditInventory, auditProductHtml, auditHtml, summarize } from '../../scripts/site-release/contract.mjs';

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
