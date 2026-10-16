import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {chromium} from '@playwright/test';
import {auditInventory,auditHtml,registered,summarize,ORIGIN,checksForPage} from './contract.mjs';
import {sitemapLocations} from '../../workshop-router/index.mjs';
import {workSitemapUrls} from './work-sitemap.mjs';

const args=process.argv.slice(2);
const value=(flag,fallback)=>args.includes(flag)?args[args.indexOf(flag)+1]:fallback;
const candidate=args.includes('--candidate'),screens=!args.includes('--no-screens');
const out=value('--output','site-release-report');fs.mkdirSync(out,{recursive:true});
const json=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const inventory=json('public/brand/sites.json'),catalog=json('public/brand/products/catalog.json');
const release=json('public/brand/release.json');
const results=[], pageSet=new Map(), assets=Object.entries(release.files);
const hash=b=>createHash('sha256').update(b).digest('hex');
const cache=new Map();
async function get(url){
  if(!cache.has(url))cache.set(url,(async()=>{
    if(candidate&&url===ORIGIN+'/sitemap.xml'){
      const company=sitemapLocations(fs.readFileSync('dist/sitemap.xml','utf8'),ORIGIN+'/');
      // After cutover, the old origin redirects its sitemap to the unified map.
      // Validate all URLs, then select work pages so later PRs remain verifiable.
      const work=workSitemapUrls((await get(ORIGIN+'/work/sitemap.xml')).text);
      const text='<urlset>'+[...new Set([...company,...work])].map(loc=>`<url><loc>${loc}</loc></url>`).join('')+'</urlset>';
      return {bytes:Buffer.from(text),text,url,status:200};
    }
    let r;
    for(let attempt=0;attempt<3;attempt++){
      const target=candidate&&url.startsWith(ORIGIN+'/work/')?url.replace(ORIGIN,'https://work.kangdaejong.com'):url;
      r=await fetch(target,{signal:AbortSignal.timeout(25000),headers:{'Cache-Control':'no-cache'}});
      if(![429,502,503,504].includes(r.status)||attempt===2)break;
      await r.arrayBuffer();await new Promise(resolve=>setTimeout(resolve,1500*(attempt+1)));
    }
    const bytes=Buffer.from(await r.arrayBuffer());
    if(!r.ok&&r.status!==410)throw Error(`HTTP ${r.status}`);
    return {bytes,text:bytes.toString(),url:r.url,status:r.status};
  })());
  return cache.get(url);
}
async function pool(items,fn,limit=8){let index=0;await Promise.all(Array.from({length:Math.min(items.length,limit)},async()=>{while(index<items.length)await fn(items[index++]);}));}
function add(url,site){if(!pageSet.has(url))pageSet.set(url,site);}
async function sitemap(url,site,visited=new Set()){
  if(visited.has(url))return;visited.add(url);
  const {text}=await get(url), locations=[...text.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1].replaceAll('&amp;','&'));
  if(!locations.length)throw Error('empty/invalid sitemap');
  for(const location of locations){
    if(new URL(location).host!==new URL(site.url).host)throw Error(`foreign sitemap URL ${location}`);
    if(/<sitemapindex\b/.test(text))await sitemap(location,site,visited);else add(location,registered(location,inventory.sites)||site);
  }
}
const discovery=json(process.env.SITE_DISCOVERY||'docs/site-discovery.json');
for(const error of auditInventory(inventory,discovery))results.push({url:'inventory',status:'failed',errors:[error]});
if(!candidate){
  const url=ORIGIN+'/brand/release.json';
  try{
    const actual=JSON.parse((await get(url)).text);
    const errors=[];
    if(actual.revision!==release.revision)errors.push('deployed brand revision differs');
    if(actual.commit!==release.commit)errors.push('deployed source commit differs');
    results.push({url,status:errors.length?'failed':'passed',expectedCommit:release.commit,actualCommit:actual.commit,errors});
  }catch(e){results.push({url,status:'unverified',errors:[e.message]});}
}
if(process.env.EXPECTED_WORK_COMMIT){
  const url=ORIGIN+'/work/brand-consumer.json';
  try{
    const actual=JSON.parse((await get(url)).text);
    const errors=actual.commit===process.env.EXPECTED_WORK_COMMIT?[]:['deployed work commit differs'];
    results.push({url,status:errors.length?'failed':'passed',expectedCommit:process.env.EXPECTED_WORK_COMMIT,actualCommit:actual.commit,errors});
  }catch(e){results.push({url,status:'unverified',errors:[e.message]});}
}
for(const site of inventory.sites){
  if(site.mode==='exception'){results.push({url:site.url,status:'exception',reason:site.reason});continue;}
  for(const route of site.pages||[new URL(site.url).pathname])add(new URL(route,site.url).href,site);
  for(const alias of site.aliases||[])add(alias,site);
  for(const url of site.sitemaps||[])try{await sitemap(url,site);}catch(e){results.push({url,status:'unverified',errors:[e.message]});}
}
// New public company destinations in the canonical header must be registered too.
try{
  const header=(await get(ORIGIN+'/mb-components.js')).text;
  for(const match of header.matchAll(/https:\/\/[\w.-]*kangdaejong\.com(?:\/[^\s'"<>`]*)?/g))if(!registered(match[0],inventory.sites))results.push({url:match[0],status:'failed',errors:['unregistered public navigation target']});
}catch(e){results.push({url:ORIGIN+'/mb-components.js',status:'unverified',errors:[e.message]});}
if(!candidate)await pool(assets,async([file,expected])=>{
  const url=ORIGIN+'/'+file;
  try{const response=await get(url);const actual=hash(response.bytes);results.push({url,status:actual===expected?'passed':'failed',expected,actual,errors:actual===expected?[]:['deployed asset hash differs']});}
  catch(e){results.push({url,status:'unverified',errors:[e.message]});}
});
// Every sitemap page is inspected. Special redirect/retirement/privacy pages are explicit seeds.
await pool([...pageSet],async([url,site])=>{
  try{
    let text;
    if(candidate&&['home','protein'].includes(site.id)){
      const route=new URL(url).pathname;const file=path.join(site.id==='protein'?'dist-protein':'dist',route,route.endsWith('/')?'index.html':'');
      if(fs.existsSync(file)&&fs.statSync(file).isFile())text=fs.readFileSync(file,'utf8');
    }
    if(text===undefined)text=(await get(url)).text;
    const route=new URL(url).pathname, checks=checksForPage(site,route);
    // Explicit redirects have no rendered page. Their destination remains a separate target.
    if(/http-equiv=["']refresh/i.test(text)){
      results.push({url,status:'passed',checks:['redirect HTML'],redirect:true});return;
    }
    // Before stable aliases were introduced, deployed work cards used approved
    // content-hashed files. Verify their actual bytes against the SAME catalog.
    // This supports a coordinated rollout without accepting an outdated image.
    let productChecks=checks, legacyErrors=[];
    if(checks.includes('products')&&!text.includes('data-product-id')){
      productChecks=checks.filter(c=>c!=='products');
      const cards=(text.match(/<article\b[\s\S]*?<\/article>/gi)||[]).filter(c=>c.includes('data-catalog-item'));
      if(!cards.length)legacyErrors.push('no identifiable product cards');
      for(const card of cards){
        const name=card.match(/<h3\b[^>]*>(.*?)<\/h3>/s)?.[1];
        const product=catalog.products.find(p=>p.name===name||(p.aliases||[]).includes(name));
        if(!product){legacyErrors.push(`unknown product ${name}`);continue;}
        const src=card.match(/<img\b[^>]*src="([^"]+)"/)?.[1];
        if(product.exception&&!src)continue;
        if(!src){legacyErrors.push(`missing icon ${name}`);continue;}
        const actual=hash((await get(new URL(src,url).href)).bytes);
        if(actual!==product.files.icon.sha256)legacyErrors.push(`stale icon bytes ${name}`);
      }
    }
    const errors=[...auditHtml(text,{...site,checks:productChecks}, {socialHash:release.files['brand/current/social.png']},catalog),...legacyErrors];
    results.push({url,status:errors.length?'failed':'passed',checks,errors});
  }catch(e){results.push({url,status:'unverified',errors:[e.message]});}
});

if(screens){
  const browser=await chromium.launch({headless:true});
  try{
    for(const site of inventory.sites.filter(s=>s.mode==='shared'))for(const route of site.screens||[])for(const width of [390,1440])for(const colorScheme of ['light','dark']){
      const url=new URL(route,site.url).href;
      console.log(`Screen ${site.id}${route} ${width}px ${colorScheme}`);
      const context=await browser.newContext({viewport:{width,height:900},colorScheme,deviceScaleFactor:1});
      const errors=[];const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
      try{
        if(candidate)await context.route(ORIGIN+'/**',async route=>{
          const u=new URL(route.request().url());let file=path.join('dist',u.pathname);
          if(u.pathname.endsWith('/'))file=path.join(file,'index.html');
          if(fs.existsSync(file)&&fs.statSync(file).isFile())await route.fulfill({path:file});
          else if(u.pathname.startsWith('/work/'))await route.fulfill({response:await route.fetch({url:'https://work.kangdaejong.com'+u.pathname+u.search})});
          else await route.continue();
        });
        if(candidate&&site.id==='protein')await context.route('https://protein.kangdaejong.com/**',async route=>{
          const u=new URL(route.request().url());let file=path.join('dist-protein',u.pathname);
          if(u.pathname.endsWith('/'))file=path.join(file,'index.html');
          if(fs.existsSync(file)&&fs.statSync(file).isFile())await route.fulfill({path:file});else await route.continue();
        });
        const response=await page.goto(url,{waitUntil:'networkidle',timeout:45000});
        if(![200,410].includes(response.status()))throw Error(`HTTP ${response.status()}`);
        const root=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth+1,theme:getComputedStyle(document.documentElement).colorScheme,bg:getComputedStyle(document.body).backgroundColor,cards:[...document.querySelectorAll('.catalog-card,.project-card,.app-row,.text-panel')].map(e=>getComputedStyle(e).backgroundColor)}));
        if(root.overflow)errors.push('horizontal overflow');
        if(!root.theme.includes(colorScheme))errors.push(`theme mismatch ${root.theme}`);
        if(colorScheme==='dark')for(const color of [root.bg,...root.cards]){
          const values=color.match(/[\d.]+/g)?.map(Number)||[];
          if(values.length>=3&&values[3]!==0&&(values[0]+values[1]+values[2])/3>180)errors.push(`light surface in dark mode: ${color}`);
        }
        const images=page.locator('[data-product-id] img, [data-catalog-item] img');
        for(let i=0;i<await images.count();i++){
          const img=images.nth(i);
          // Hidden disclosure children still need their image bytes checked.
          await img.evaluate(e=>{e.loading='eager';});await img.evaluate(e=>e.decode());
          if(!await img.evaluate(e=>e.naturalWidth>0))errors.push('broken product icon');
        }
        if(site.id==='work'&&route==='/work/products/'){
          await page.locator('[data-catalog-search]').fill('Jarvis');
          if(await page.locator('[data-catalog-item]:visible').count()!==1)errors.push('product search failed');
          await page.locator('[data-catalog-search]').fill('');
          await page.locator('#catalog').scrollIntoViewIfNeeded();
        }
        const screenshot=`${site.id}-${route.replaceAll('/','_')}-${colorScheme}-${width}.png`;
        await page.screenshot({path:path.join(out,screenshot),fullPage:true});
        results.push({url,status:errors.length?'failed':'passed',viewport:width,colorScheme,screenshot,bodyBackground:root.bg,errors});
      }catch(e){results.push({url,status:'unverified',viewport:width,colorScheme,errors:[...errors,e.message]});}
      finally{await context.close();}
    }
  }finally{await browser.close();}
}
const summary=summarize(results);
const counts={registeredSurfaces:inventory.sites.length,webPages:pageSet.size,screens:results.filter(r=>r.viewport).length,sharedAssets:candidate?0:assets.length};
const report={schema:1,observedAt:new Date().toISOString(),phase:candidate?'candidate':'production',workTransport:candidate?'GitHub Pages /work artifact':'public canonical URL',revision:release.revision,sourceCommit:release.commit,inventoryObservedAt:discovery.observedAt,counts,...summary,results};
fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
const lines=[`# Site release: ${report.complete?'PASS':'INCOMPLETE'}`,``, `Phase: ${report.phase}; revision: ${report.revision}`,`Targets ${report.targets} / verified ${report.verified} / explicit exceptions ${report.exceptions} / unverified ${report.unverified.length}`,``, `Telegram preview: not verified (web deployment does not prove messenger cache refresh).`,``,...report.unverified.map(r=>`- ${r.url}: ${(r.errors||[]).join('; ')}`)];
fs.writeFileSync(path.join(out,'report.md'),lines.join('\n')+'\n');
console.log(lines.join('\n'));
if(!summary.complete)process.exitCode=1;
