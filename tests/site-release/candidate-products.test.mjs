import test from 'node:test';
import assert from 'node:assert/strict';
import {catalogForProductPage} from '../../scripts/site-release/candidate-products.mjs';
import {auditProductHtml} from '../../scripts/site-release/contract.mjs';

const icon='https://kangdaejong.com/brand/products/cheotireum.webp';
const product={id:'cheotireum',name:'첫이름',icon,icon2x:icon.replace('.webp','@2x.webp')};
const catalog={products:[product]};
const previous={id:'cheotireum',name:'첫이름',icon:null,icon2x:null,source:null,files:null,exception:{status:'approved-placeholder',reason:'Approved letter mark',fallback:'letter-mark',approvedAt:'2026-10-24'}};
const card=body=>`<article data-product-id="cheotireum">${body}</article>`;
const glyph=card('<span class="project-mark">첫</span>');
const options=(overrides={})=>({candidate:true,site:{id:'work'},loadLiveCatalog:async()=>({products:[previous]}),...overrides});

test('candidate work accepts a missing image only when the live catalog still approves its letter mark',async()=>{
  const html=`<div class="grid">${glyph}</div>`;
  const actual=await catalogForProductPage(html,catalog,options());
  assert.deepEqual(auditProductHtml(html,actual),[]);
  assert.equal(catalog.products[0],product);
  assert.equal(product.exception,undefined);
});

test('home candidates and all production pages require the new icon without reading live exceptions',async()=>{
  for(const [candidate,id] of [[true,'home'],[false,'home'],[false,'work'],[true,'protein']]){
    const actual=await catalogForProductPage(glyph,catalog,options({candidate,site:{id},loadLiveCatalog:async()=>{throw Error('must not fetch');}}));
    assert.equal(actual,catalog);
    assert.match(auditProductHtml(glyph,actual).join('\n'),/missing or stale icon/);
    assert.deepEqual(auditProductHtml(card(`<img src="${icon}">`),actual),[]);
  }
});

test('a work card that contains any image remains subject to the candidate icon contract',async()=>{
  for(const [body,valid] of [[`<img src="${icon}">`,true],['<img src="/old.webp">',false],['<img>',false]]){
    const html=card(body);
    const actual=await catalogForProductPage(html,catalog,options({loadLiveCatalog:async()=>{throw Error('must not fetch');}}));
    assert.equal(actual,catalog);
    assert.equal(auditProductHtml(html,actual).length===0,valid);
  }
});

test('absent, invalid and already migrated live entries cannot excuse a missing icon',async()=>{
  for(const products of [[],[product],[{...previous,exception:true}],[{...previous,exception:{...previous.exception,status:'pending'}}],[{...previous,icon:'/old.webp'}]]){
    const actual=await catalogForProductPage(glyph,catalog,options({loadLiveCatalog:async()=>({products})}));
    assert.match(auditProductHtml(glyph,actual).join('\n'),/missing or stale icon/);
  }
});

test('legacy work cards resolve their live exception by catalog name without allowing an image',async()=>{
  const html='<article data-catalog-item><h3>첫이름</h3><span>첫</span></article>';
  assert.equal((await catalogForProductPage(html,catalog,options())).products[0],previous);
  assert.equal(await catalogForProductPage(html.replace('</article>','<img src="/old.webp"></article>'),catalog,options()),catalog);
});

test('unknown products and failed or malformed live catalog reads fail closed',async()=>{
  const unknown=glyph.replace('data-product-id="cheotireum"','data-product-id="unknown"');
  assert.match(auditProductHtml(unknown,await catalogForProductPage(unknown,catalog,options())).join('\n'),/unknown product/);
  await assert.rejects(catalogForProductPage(glyph,catalog,options({loadLiveCatalog:async()=>{throw Error('HTTP 503');}})),/HTTP 503/);
  await assert.rejects(catalogForProductPage(glyph,catalog,options({loadLiveCatalog:async()=>({})})),/invalid deployed product catalog/);
});
