import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {handle,canonicalLocation,sitemapLocations,founderLocation} from './index.mjs';
const xml=urls=>'<urlset>'+urls.map(u=>`<url><loc>${u}</loc></url>`).join('')+'</urlset>';
const never=()=>{throw Error('Unexpected origin fetch');};

test('configured routes catch query strings and preserve neighbouring company pages',async()=>{
  const config=fs.readFileSync(new URL('./wrangler.jsonc',import.meta.url),'utf8');
  const compatibilityDate=config.match(/"compatibility_date":\s*"([^"]+)"/)[1];
  assert.ok(compatibilityDate<=new Date().toISOString().slice(0,10),'Cloudflare rejects compatibility dates after the current UTC date');
  const patterns=[...config.matchAll(/"pattern":\s*"([^"]+)"/g)].map(m=>new RegExp('^'+m[1].replaceAll('.','\\.').replaceAll('*','.*')+'$'));
  for(const value of ['kangdaejong.com/work?utm_source=test','kangdaejong.com/work/?x=1','kangdaejong.com/sitemap.xml?x=1','kangdaejong.com/founder?x=1','kangdaejong.com/founder/?x=1','founder.kangdaejong.com/?x=1','kangdaejong.com/product?lang=ko','protein.kangdaejong.com/?x=1'])assert.ok(patterns.some(p=>p.test(value)),value);
  for(const pathname of ['/workshop','/founders','/products','/sitemap.xml.backup']){
    const request=new Request('https://kangdaejong.com'+pathname);
    const response=await handle(request,async actual=>{assert.equal(actual,request);return new Response('company origin');});
    assert.equal(await response.text(),'company origin');
  }
});

test('legacy links, existing /work links and query strings have one permanent destination',async()=>{
  for(const [old,wanted] of [['/','/work/'],['/newsletter/ep154/?c=a','/work/newsletter/ep154/?c=a'],['/work/products/','/work/products/']]){
    const r=await handle(new Request('https://work.kangdaejong.com'+old),never);
    assert.equal(r.status,301);assert.equal(r.headers.get('Location'),'https://kangdaejong.com'+wanted);
  }
  const r=await handle(new Request('https://kangdaejong.com/work?x=1'),never);
  assert.equal(r.headers.get('Location'),'https://kangdaejong.com/work/?x=1');
  assert.equal(canonicalLocation('https://work.kangdaejong.com/sitemap-index.xml'),'https://kangdaejong.com/sitemap.xml');
  const http=await handle(new Request('http://work.kangdaejong.com/newsletter/ep154/?x=1'),never);
  assert.equal(http.headers.get('Location'),'https://kangdaejong.com/work/newsletter/ep154/?x=1');
  assert.equal((await handle(new Request('http://kangdaejong.com/work/'),never)).headers.get('Location'),'https://kangdaejong.com/work/');
});
test('static content keeps status, byte ranges and validators; company secrets never reach the origin',async()=>{
  const r=await handle(new Request('https://kangdaejong.com/work/video.mp4?x=1',{headers:{Cookie:'private',Authorization:'Bearer private',Range:'bytes=0-3','If-Range':'etag'}}),async(url,options)=>{
    assert.equal(url,'https://work.kangdaejong.com/work/video.mp4?x=1');
    assert.equal(options.redirect,'manual');assert.equal(options.headers.get('Cookie'),null);assert.equal(options.headers.get('Authorization'),null);
    assert.equal(options.headers.get('Range'),'bytes=0-3');assert.equal(options.headers.get('If-Range'),'etag');
    return new Response('1234',{status:206,headers:{'Content-Range':'bytes 0-3/8',ETag:'etag','Set-Cookie':'upstream'}});
  });
  assert.equal(r.status,206);assert.equal(await r.text(),'1234');assert.equal(r.headers.get('Content-Range'),'bytes 0-3/8');assert.equal(r.headers.get('Set-Cookie'),null);
});
test('origin slash redirect never leaks the old hostname or duplicates /work',async()=>{
  const r=await handle(new Request('https://kangdaejong.com/work/worklog'),async()=>new Response(null,{status:301,headers:{Location:'https://work.kangdaejong.com/work/worklog/'}}));
  assert.equal(r.headers.get('Location'),'https://kangdaejong.com/work/worklog/');
});
test('missing pages remain 404/noindex and unsupported writes never reach the origin',async()=>{
  const r=await handle(new Request('https://kangdaejong.com/work/missing'),async url=>url.endsWith('/404.html')?new Response('<h1>Missing</h1>'):new Response('Missing',{status:404}));
  assert.equal(r.status,404);assert.equal(r.headers.get('X-Robots-Tag'),'noindex');assert.match(await r.text(),/Missing/);
  assert.equal((await handle(new Request('https://kangdaejong.com/work/',{method:'POST'}),never)).status,405);
});
test('one complete sitemap combines three origins and excludes old-host URLs',async()=>{
  const r=await handle(new Request('https://kangdaejong.com/sitemap.xml'),async url=>new Response(xml(url.includes('pages.dev')?['https://kangdaejong.com/']:url.includes('founder.kangdaejong')?['https://kangdaejong.com/founder/']:['https://kangdaejong.com/work/','https://kangdaejong.com/work/worklog/'])));
  assert.equal(r.status,200);const body=await r.text();assert.equal(sitemapLocations(body,'https://kangdaejong.com/').length,9);assert.doesNotMatch(body,/(work|founder|product|protein)\.kangdaejong/);
  for(const name of ['claude','codex','cursor','grok'])assert.ok(body.includes(`https://kangdaejong.com/product/${name}-telegram-bridge/`));
  assert.equal((await handle(new Request('https://kangdaejong.com/work/sitemap.xml'),never)).headers.get('Location'),'https://kangdaejong.com/sitemap.xml');
});

test('representative root and index aliases redirect once while Flutter apps retain their storage origin',async()=>{
  for(const origin of ['http://founder.kangdaejong.com','https://founder.kangdaejong.com'])for(const pathname of ['/','/index.html']){
    const r=await handle(new Request(origin+pathname+'?from=profile'),never);
    assert.equal(r.status,301);assert.equal(r.headers.get('Location'),'https://kangdaejong.com/founder/?from=profile');
  }
  for(const pathname of ['/dutch_pay_calculator/','/simple-memo-app/','/simple-memo-app/flutter_service_worker.js','/yakmukja/','/yakmukja/main.dart.js','/app-ads.txt','/renewal.css']){
    const request=new Request('https://founder.kangdaejong.com'+pathname);
    const r=await handle(request,async actual=>{assert.equal(actual,request);return new Response('unchanged product');});
    assert.equal(r.status,200);assert.equal(await r.text(),'unchanged product');
  }
  assert.equal(founderLocation('https://founder.kangdaejong.com/sitemap.xml'),'https://kangdaejong.com/sitemap.xml');
  assert.equal(founderLocation('https://founder.kangdaejong.com/robots.txt'),'https://kangdaejong.com/robots.txt');
});

test('legacy bridge guides and protein roots use company paths while protein assets stay available',async()=>{
  for(const engine of ['claude','codex','cursor','grok']){
    const r=await handle(new Request(`https://founder.kangdaejong.com/${engine}-telegram-bridge/?lang=ko`),never);
    assert.equal(r.status,301);assert.equal(r.headers.get('Location'),`https://kangdaejong.com/product/${engine}-telegram-bridge/?lang=ko`);
  }
  for(const scheme of ['http','https'])for(const path of ['/','/index.html']){
    const r=await handle(new Request(`${scheme}://protein.kangdaejong.com${path}?from=old`),never);
    assert.equal(r.status,301);assert.equal(r.headers.get('Location'),'https://kangdaejong.com/protein/?from=old');
  }
  const asset=new Request('https://protein.kangdaejong.com/protein/tryptophan.png');
  const r=await handle(asset,async req=>{assert.equal(req,asset);return new Response('original asset');});
  assert.equal(await r.text(),'original asset');
});

test('mounted representative page and assets strip the prefix without leaking company credentials',async()=>{
  for(const pathname of ['/','/renewal.css','/i18n-en.js','/lang-toggle.js']){
    const r=await handle(new Request('https://kangdaejong.com/founder'+pathname+'?v=1',{headers:{Cookie:'private',Authorization:'Bearer private','If-None-Match':'etag'}}),async(url,options)=>{
      assert.equal(url,'https://founder.kangdaejong.com'+pathname+'?v=1');
      assert.equal(options.headers.get('Cookie'),null);assert.equal(options.headers.get('Authorization'),null);
      assert.equal(options.headers.get('If-None-Match'),'etag');assert.equal(options.redirect,'manual');
      return new Response('founder',{headers:{'Set-Cookie':'upstream'}});
    });
    assert.equal(await r.text(),'founder');assert.equal(r.headers.get('Set-Cookie'),null);
  }
  const head=await handle(new Request('https://kangdaejong.com/founder/renewal.css',{method:'HEAD'}),async(_,options)=>{assert.equal(options.method,'HEAD');return new Response(null,{headers:{ETag:'etag'}});});
  assert.equal(await head.text(),'');assert.equal(head.headers.get('ETag'),'etag');
  assert.equal((await handle(new Request('https://kangdaejong.com/founder/renewal.css'),async()=>new Response(null,{status:304}))).status,304);
});

test('founder slash, unknown pages, origin errors and maps retain correct HTTP semantics',async()=>{
  for(const pathname of ['/founder','/founder/index.html']){
    const r=await handle(new Request('https://kangdaejong.com'+pathname+'?x=1'),never);
    assert.equal(r.status,301);assert.equal(r.headers.get('Location'),'https://kangdaejong.com/founder/?x=1');
  }
  for(const pathname of ['/missing','/dutch_pay_calculator/','/_retired/tokens.css']){
    const r=await handle(new Request('https://kangdaejong.com/founder'+pathname),never);
    assert.equal(r.status,404);assert.equal(r.headers.get('X-Robots-Tag'),'noindex');
  }
  const missingAsset=await handle(new Request('https://kangdaejong.com/founder/renewal.css'),async()=>new Response('Missing',{status:404}));
  assert.equal(missingAsset.status,404);assert.equal(missingAsset.headers.get('X-Robots-Tag'),'noindex');
  assert.equal((await handle(new Request('https://kangdaejong.com/founder/',{method:'POST'}),never)).status,405);
  assert.equal((await handle(new Request('https://kangdaejong.com/founder/sitemap.xml'),never)).headers.get('Location'),'https://kangdaejong.com/sitemap.xml');
  assert.equal((await handle(new Request('https://kangdaejong.com/founder/robots.txt'),never)).headers.get('Location'),'https://kangdaejong.com/robots.txt');
  const failure=await handle(new Request('https://kangdaejong.com/founder/'),async()=>{throw Error('offline');});
  assert.equal(failure.status,502);assert.equal(failure.headers.get('Cache-Control'),'no-store');
});

test('a failed founder map never silently disappears from the shared sitemap',async()=>{
  for(const body of [null,xml(['https://kangdaejong.com/founder/missing-root/']),xml(['https://founder.kangdaejong.com/'])]){
    const r=await handle(new Request('https://kangdaejong.com/sitemap.xml'),async url=>{
      if(url.includes('founder.kangdaejong'))return new Response(body,{status:body===null?404:200});
      return new Response(xml([url.includes('pages.dev')?'https://kangdaejong.com/':'https://kangdaejong.com/work/']));
    });
    assert.equal(r.status,502);assert.equal(r.headers.get('Cache-Control'),'no-store');
  }
});
test('a failed, malformed or foreign sitemap is a 502, never a partial successful index',async()=>{
  for(const response of [new Response('unavailable',{status:503}),new Response('<html>error</html>'),new Response(xml(['https://evil.example/']))]){
    const r=await handle(new Request('https://kangdaejong.com/sitemap.xml'),async url=>url.includes('pages.dev')?new Response(xml(['https://kangdaejong.com/'])):response.clone());
    assert.equal(r.status,502);assert.equal(r.headers.get('Cache-Control'),'no-store');
  }
});
test('the timeline menu path serves timeline.html without advertising the .html address',async()=>{
  const bare=await handle(new Request('https://kangdaejong.com/work/timeline?from=menu'),never);
  assert.equal(bare.status,301);assert.equal(bare.headers.get('Location'),'https://kangdaejong.com/work/timeline/?from=menu');
  const page=await handle(new Request('https://kangdaejong.com/work/timeline/'),async url=>{
    assert.equal(url,'https://work.kangdaejong.com/work/timeline.html/');
    return new Response('timeline',{status:200,headers:{'Content-Type':'text/html'}});
  });
  assert.equal(page.status,200);assert.equal(await page.text(),'timeline');
  const legacy=await handle(new Request('https://kangdaejong.com/work/timeline.html/'),async url=>{
    assert.equal(url,'https://work.kangdaejong.com/work/timeline.html/');
    return new Response('legacy',{status:200});
  });
  assert.equal(legacy.status,200);
});
test('HEAD and conditional responses keep HTTP semantics',async()=>{
  const r=await handle(new Request('https://kangdaejong.com/work/x',{method:'HEAD'}),async(_,options)=>{assert.equal(options.method,'HEAD');return new Response(null,{headers:{'Content-Length':'900'}});});
  assert.equal(await r.text(),'');assert.equal(r.headers.get('Content-Length'),'900');
  assert.equal((await handle(new Request('https://kangdaejong.com/work/x'),async()=>new Response(null,{status:304}))).status,304);
});
