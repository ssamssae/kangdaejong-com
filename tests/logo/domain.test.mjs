import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../../logo-worker/index.mjs';

test('logo domain serves the editor and policy pages without a URL redirect',async()=>{
 for(const [path,asset] of [['/','/logo/'],['/terms/','/logo/terms/'],['/privacy/','/logo/privacy/']]){
  let requested;
  const r=await worker.fetch(new Request('https://logo.kangdaejong.com'+path+'?source=home'),{ASSETS:{fetch:async r=>{requested=new URL(r.url);return new Response('page');}}});
  assert.equal(r.status,200);assert.equal(requested.pathname,asset);assert.equal(requested.search,'?source=home');
 }
});
test('legacy paths on the new domain redirect without dropping query parameters',async()=>{
 for(const [path,target] of [['/logo/','/'],['/logo/terms/','/terms/'],['/privacy','/privacy/']]){
  const r=await worker.fetch(new Request('https://logo.kangdaejong.com'+path+'?source=old'),{});
  assert.equal(r.status,308);assert.equal(r.headers.get('location'),'https://logo.kangdaejong.com'+target+'?source=old');
 }
});
test('existing origin assets, fonts and bundles keep their paths',async()=>{
 for(const url of ['https://kangdaejong.com/logo/','https://logo.kangdaejong.com/logo/fonts/NotoSansKR.ttf','https://logo.kangdaejong.com/_astro/editor.js']){
  let requested;await worker.fetch(new Request(url),{ASSETS:{fetch:async r=>{requested=r.url;return new Response('asset');}}});assert.equal(requested,url);
 }
});
test('sales remain off on both domains and origin validation remains enforced',async()=>{
 for(const host of ['logo.kangdaejong.com','kangdaejong.com']){
  const r=await worker.fetch(new Request('https://'+host+'/logo/api/config'),{SALES_ENABLED:'false'});assert.equal((await r.json()).ready,false);
 }
 const r=await worker.fetch(new Request('https://logo.kangdaejong.com/logo/api/orders',{method:'POST',headers:{origin:'https://attacker.invalid'}}),{});assert.equal(r.status,403);
});

test('closed deployment blocks all public paths before storage or providers',async()=>{
 const env={SERVICE_CLOSED:'true',SALES_ENABLED:'true',get ORDERS(){throw Error('must not access orders');},get ASSETS(){throw Error('must not access assets');}};
 for(const host of ['logo.kangdaejong.com','kangdaejong.com','logo-kureomi.example.workers.dev'])for(const path of ['/','/logo/','/terms/','/logo/api/config','/logo/api/orders','/logo/api/orders/logo_'+'a'.repeat(32)+'/generate'])for(const method of ['GET','POST','HEAD']){
  const r=await worker.fetch(new Request('https://'+host+path,{method}),env);
  assert.equal(r.status,410);assert.equal(r.headers.get('cache-control'),'no-store');
  if(path.startsWith('/logo/api/'))assert.equal((await r.json()).closed,true);
  else if(method!=='HEAD')assert.match(await r.text(),/서비스를 종료했습니다/);
 }
});
