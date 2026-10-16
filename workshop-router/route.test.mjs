import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {handle,canonicalLocation,sitemapLocations} from './index.mjs';
const xml=urls=>'<urlset>'+urls.map(u=>`<url><loc>${u}</loc></url>`).join('')+'</urlset>';
const never=()=>{throw Error('Unexpected origin fetch');};

test('configured routes catch query strings and preserve neighbouring company pages',async()=>{
  const config=fs.readFileSync(new URL('./wrangler.jsonc',import.meta.url),'utf8');
  const patterns=[...config.matchAll(/"pattern":\s*"([^"]+)"/g)].map(m=>new RegExp('^'+m[1].replaceAll('.','\\.').replaceAll('*','.*')+'$'));
  for(const value of ['kangdaejong.com/work?utm_source=test','kangdaejong.com/work/?x=1','kangdaejong.com/sitemap.xml?x=1'])assert.ok(patterns.some(p=>p.test(value)),value);
  for(const pathname of ['/workshop','/sitemap.xml.backup']){
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
test('one complete sitemap combines both origins and excludes old-host URLs',async()=>{
  const r=await handle(new Request('https://kangdaejong.com/sitemap.xml'),async url=>new Response(xml(url.includes('pages.dev')?['https://kangdaejong.com/']:['https://kangdaejong.com/work/','https://kangdaejong.com/work/worklog/'])));
  assert.equal(r.status,200);const body=await r.text();assert.equal(sitemapLocations(body,'https://kangdaejong.com/').length,3);assert.doesNotMatch(body,/work\.kangdaejong/);
  assert.equal((await handle(new Request('https://kangdaejong.com/work/sitemap.xml'),never)).headers.get('Location'),'https://kangdaejong.com/sitemap.xml');
});
test('a failed, malformed or foreign sitemap is a 502, never a partial successful index',async()=>{
  for(const response of [new Response('unavailable',{status:503}),new Response('<html>error</html>'),new Response(xml(['https://evil.example/']))]){
    const r=await handle(new Request('https://kangdaejong.com/sitemap.xml'),async url=>url.includes('pages.dev')?new Response(xml(['https://kangdaejong.com/'])):response.clone());
    assert.equal(r.status,502);assert.equal(r.headers.get('Cache-Control'),'no-store');
  }
});
test('HEAD and conditional responses keep HTTP semantics',async()=>{
  const r=await handle(new Request('https://kangdaejong.com/work/x',{method:'HEAD'}),async(_,options)=>{assert.equal(options.method,'HEAD');return new Response(null,{headers:{'Content-Length':'900'}});});
  assert.equal(await r.text(),'');assert.equal(r.headers.get('Content-Length'),'900');
  assert.equal((await handle(new Request('https://kangdaejong.com/work/x'),async()=>new Response(null,{status:304}))).status,304);
});
