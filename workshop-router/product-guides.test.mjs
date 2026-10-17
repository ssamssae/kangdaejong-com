import test from 'node:test';
import assert from 'node:assert/strict';
import {handleProductRequest} from './product-guides.mjs';
import {handle} from './index.mjs';

const origin='https://kangdaejong.com/product';
const request=(path,init)=>new Request(origin+path,init);
const never=()=>{throw Error('Unexpected origin fetch');};

test('guide index and each canonical slash stay within the company path',async()=>{
  const html=await (await handleProductRequest(request('/'),never)).text();
  assert.ok(html.includes(`<link rel="canonical" href="${origin}/">`));
  assert.ok(html.includes('https://kangdaejong.com/brand/current/social.png'));
  assert.ok(html.includes('https://kangdaejong.com/brand/current/tokens.css'));
  for(const engine of ['claude','codex','cursor','grok']){
    assert.ok(html.includes(`href="${origin}/${engine}-telegram-bridge/"`));
    for(const suffix of ['', '/index.html']){
      const r=await handleProductRequest(request(`/${engine}-telegram-bridge${suffix}?lang=ko`),never);
      assert.equal(r.status,301);assert.equal(r.headers.get('Location'),`${origin}/${engine}-telegram-bridge/?lang=ko`);
    }
  }
  const http=await handle(new Request('http://kangdaejong.com/product/?x=1'),never);
  assert.equal(http.headers.get('Location'),origin+'/?x=1');
  assert.equal((await handle(request('',{}),never)).headers.get('Location'),origin+'/');
});

test('real guide HTML links and metadata use one canonical page without losing language or anchors',async()=>{
  const body=`<html><head><link rel="canonical" href="https://founder.kangdaejong.com/codex-telegram-bridge/"><meta property="og:url" content="https://product.kangdaejong.com/codex-telegram-bridge/"></head><body>
    <script src="app.js"></script><a href="README.ko.md">Download</a>
    <a href="https://product.kangdaejong.com/grok-telegram-bridge/?lang=ko#start">Grok</a>
    <a href="https://ssamssae.github.io/claude-telegram-bridge/?lang=en">Claude</a>
    <a href="/cursor-telegram-bridge/?lang=ko">Cursor</a><a href="https://github.com/ssamssae/codex-telegram-bridge">Source</a></body></html>`;
  const r=await handleProductRequest(request('/codex-telegram-bridge/?lang=ko'),async(url,init)=>{
    assert.equal(url,'https://founder.kangdaejong.com/codex-telegram-bridge/?lang=ko');assert.equal(init.redirect,'manual');
    return new Response(body,{headers:{'Content-Type':'text/html','ETag':'source','Content-Length':'1','Set-Cookie':'origin=private'}});
  });
  const html=await r.text();
  assert.equal((html.match(/rel="canonical"/g)||[]).length,1);
  assert.ok(html.includes(`<link rel="canonical" href="${origin}/codex-telegram-bridge/">`));
  assert.ok(html.includes(`<meta property="og:url" content="${origin}/codex-telegram-bridge/">`));
  assert.ok(html.includes(origin+'/grok-telegram-bridge/?lang=ko#start'));
  assert.ok(html.includes(origin+'/claude-telegram-bridge/?lang=en'));
  assert.ok(html.includes('href="/product/cursor-telegram-bridge/?lang=ko"'));
  assert.ok(html.includes('src="app.js"'));assert.ok(html.includes('href="README.ko.md"'));assert.ok(html.includes('https://github.com/ssamssae/codex-telegram-bridge'));
  for(const key of ['ETag','Content-Length','Set-Cookie'])assert.equal(r.headers.get(key),null);
});

test('binary assets and empty responses retain status and never forward company credentials',async()=>{
  const bytes=new Uint8Array([0,127,255,10]);
  const r=await handleProductRequest(request('/claude-telegram-bridge/image.png?v=2',{headers:{Cookie:'private',Authorization:'Bearer private'}}),async(url,init)=>{
    const h=new Headers(init.headers);assert.equal(h.get('Cookie'),null);assert.equal(h.get('Authorization'),null);
    assert.equal(url,'https://founder.kangdaejong.com/claude-telegram-bridge/image.png?v=2');
    return new Response(bytes,{headers:{'Content-Type':'image/png','ETag':'image'}});
  });
  assert.deepEqual(new Uint8Array(await r.arrayBuffer()),bytes);assert.equal(r.headers.get('Content-Type'),'image/png');assert.equal(r.headers.get('ETag'),'image');
  const head=await handleProductRequest(request('/codex-telegram-bridge/',{method:'HEAD'}),async(_,init)=>{assert.equal(init.method,'HEAD');return new Response(null,{headers:{'Content-Type':'text/html'}});});
  assert.equal(await head.text(),'');
  const cached=await handleProductRequest(request('/codex-telegram-bridge/app.js'),async()=>new Response(null,{status:304}));assert.equal(cached.status,304);assert.equal(await cached.text(),'');
});

test('only the four guide prefixes are exposed and missing content is never indexed',async()=>{
  for(const path of ['/private','/codex-telegram-bridge-other/','/codex-telegram-bridge/../../private'])assert.equal((await handleProductRequest(request(path),never)).status,404);
  const missing=await handleProductRequest(request('/codex-telegram-bridge/missing.js'),async()=>new Response('Missing',{status:404}));
  assert.equal(missing.status,404);assert.equal(missing.headers.get('X-Robots-Tag'),'noindex');
  const post=await handleProductRequest(request('/',{method:'POST',body:'private'}),never);assert.equal(post.status,405);assert.equal(post.headers.get('Allow'),'GET, HEAD');
});

test('origin redirects are restricted to guide URLs and origin errors stay uncached',async()=>{
  const safe=await handleProductRequest(request('/codex-telegram-bridge/old.html'),async()=>new Response(null,{status:301,headers:{Location:'/codex-telegram-bridge/?lang=ko#start'}}));
  assert.equal(safe.headers.get('Location'),origin+'/codex-telegram-bridge/?lang=ko#start');
  for(const location of ['https://elsewhere.example/','https://founder.kangdaejong.com/','https://founder.kangdaejong.com/yakmukja/']){
    const r=await handleProductRequest(request('/codex-telegram-bridge/old.html'),async()=>new Response(null,{status:302,headers:{Location:location}}));
    assert.equal(r.status,502);assert.equal(r.headers.get('Location'),null);
  }
  const r=await handleProductRequest(request('/codex-telegram-bridge/'),async()=>{throw Error('private origin detail');});
  assert.equal(r.status,502);assert.equal(r.headers.get('Cache-Control'),'no-store');assert.doesNotMatch(await r.text(),/private origin/);
});
