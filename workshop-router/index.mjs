import {handleProductRequest, publicGuideLink, PRODUCT_PAGES} from './product-guides.mjs';

export const COMPANY = 'https://kangdaejong.com';
export const ORIGIN = 'https://work.kangdaejong.com';
export const BASE = '/work';
export const FOUNDER_ORIGIN = 'https://founder.kangdaejong.com';
export const FOUNDER_BASE = '/founder';
export const PROTEIN_ORIGIN = 'https://protein.kangdaejong.com';
const SITEMAP = COMPANY + '/sitemap.xml';
const MAP_PATH = /^\/(?:work\/)?sitemap(?:-index|-\d+)?\.xml$/;
// Only the representative page moves. GitHub project sites and app-ads.txt on
// the old hostname retain their existing public URLs and origin responses.
const FOUNDER_ASSETS = new Set(['renewal.css','i18n-en.js','lang-toggle.js','favicon.ico','favicon.svg','apple-touch-icon.png','badge_appstore_kr.svg','badge_googleplay_kr.svg','minusbeta-badge.svg']);

export function founderLocation(value) {
  const url = new URL(value);
  if (url.hostname !== new URL(FOUNDER_ORIGIN).hostname) return null;
  if (url.pathname === '/sitemap.xml') return SITEMAP;
  if (url.pathname === '/robots.txt') return COMPANY + '/robots.txt';
  const guide = publicGuideLink(url);
  if (guide) return guide;
  if (!['/','/index.html'].includes(url.pathname)) return null;
  return COMPANY + FOUNDER_BASE + '/' + url.search + url.hash;
}

export function canonicalLocation(value) {
  const url = new URL(value);
  if (url.hostname !== new URL(ORIGIN).hostname) return url.href;
  if (MAP_PATH.test(url.pathname)) return SITEMAP;
  if (url.pathname === '/robots.txt') return COMPANY + '/robots.txt';
  url.host = new URL(COMPANY).host;
  url.protocol = 'https:';
  if (url.pathname !== BASE && !url.pathname.startsWith(BASE + '/')) url.pathname = BASE + url.pathname;
  if (url.pathname === BASE) url.pathname += '/';
  return url.href;
}

function redirect(url, method='GET') {
  return new Response(null,{status:['GET','HEAD'].includes(method)?301:308,headers:{Location:url,'Cache-Control':'public, max-age=300'}});
}

const xmlEscape = s => s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
export function sitemapLocations(xml, prefix) {
  if (!/<urlset\b/.test(xml) || !/<\/urlset>/.test(xml)) throw Error('Expected a complete URL sitemap');
  const urls=[...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map(m=>m[1].replaceAll('&amp;','&'));
  if (!urls.length || urls.some(value=>{
    const url=new URL(value);
    return url.origin!==COMPANY || !url.href.startsWith(prefix) || url.username || url.password || url.search || url.hash;
  })) throw Error('Sitemap contains missing or unexpected canonical URLs');
  return urls;
}

async function unifiedSitemap(fetcher, method) {
  // Private-origin fetch is explicitly configured: the work hostname remains the
  // GitHub Pages origin even after its public route becomes a permanent redirect.
  const sources=[['https://kangdaejong-com.pages.dev/sitemap.xml',COMPANY+'/'],[ORIGIN+'/work/sitemap.xml',COMPANY+'/work/'],[FOUNDER_ORIGIN+'/sitemap.xml',COMPANY+FOUNDER_BASE+'/']];
  const responses=await Promise.all(sources.map(async([url,prefix])=>{
    const response=await fetcher(url,{redirect:'manual',headers:{'Cache-Control':'no-cache'}});
    if(response.status!==200)throw Error('A sitemap origin is unavailable');
    return sitemapLocations(await response.text(),prefix);
  }));
  const urls=[...new Set([...responses.flat(),...PRODUCT_PAGES])].sort();
  if(!urls.includes(COMPANY+'/') || !urls.includes(COMPANY+'/work/') || !urls.includes(COMPANY+FOUNDER_BASE+'/') || urls.length>50000)throw Error('Incomplete unified sitemap');
  const xml='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+urls.map(url=>`<url><loc>${xmlEscape(url)}</loc></url>`).join('\n')+'\n</urlset>\n';
  return new Response(method==='HEAD'?null:xml,{headers:{'Content-Type':'application/xml; charset=utf-8','Cache-Control':'public, max-age=300','X-Workshop-Route':'v1'}});
}

export async function handle(request, fetcher=fetch) {
  const url=new URL(request.url);
  if(url.origin===PROTEIN_ORIGIN||url.hostname===new URL(PROTEIN_ORIGIN).hostname){
    if(['/', '/index.html'].includes(url.pathname))return redirect(COMPANY+'/protein/'+url.search,request.method);
    if(['/sitemap.xml','/robots.txt'].includes(url.pathname))return redirect(COMPANY+url.pathname,request.method);
    return fetcher(request);
  }
  if(url.hostname===new URL(ORIGIN).hostname)return redirect(canonicalLocation(url.href),request.method);
  if(url.hostname===new URL(FOUNDER_ORIGIN).hostname){
    const location=founderLocation(url.href);
    return location?redirect(location,request.method):fetcher(request);
  }
  if(url.hostname===new URL(COMPANY).hostname&&url.protocol==='http:'){
    url.protocol='https:';return redirect(url.href,request.method);
  }
  if(url.origin!==COMPANY)return new Response('Not found',{status:404});
  if(url.pathname==='/product'||url.pathname.startsWith('/product/'))return handleProductRequest(request,fetcher);
  // Route suffix wildcards also match queries. Adjacent company paths still
  // belong to the company origin (private-origin fetch avoids this Worker).
  const isFounder=url.pathname===FOUNDER_BASE||url.pathname.startsWith(FOUNDER_BASE+'/');
  if(url.pathname!==BASE&&!url.pathname.startsWith(BASE+'/')&&!isFounder&&url.pathname!=='/sitemap.xml')return fetcher(request);
  if(url.pathname===BASE)return redirect(COMPANY+BASE+'/'+url.search,request.method);
  if(url.pathname===FOUNDER_BASE||url.pathname===FOUNDER_BASE+'/index.html')return redirect(COMPANY+FOUNDER_BASE+'/'+url.search,request.method);
  if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405,headers:{Allow:'GET, HEAD'}});
  try{
    if(url.pathname==='/sitemap.xml')return await unifiedSitemap(fetcher,request.method);
    const founderPath=isFounder?url.pathname.slice(FOUNDER_BASE.length):null;
    if(isFounder&&['/sitemap.xml','/robots.txt'].includes(founderPath))return redirect(COMPANY+founderPath);
    if(isFounder&&founderPath!=='/'&&!FOUNDER_ASSETS.has(founderPath.slice(1)))return new Response('Not found',{status:404,headers:{'X-Robots-Tag':'noindex','Cache-Control':'public, max-age=60'}});
    if(!isFounder&&!url.pathname.startsWith(BASE+'/'))return new Response('Not found',{status:404});
    if(MAP_PATH.test(url.pathname))return redirect(SITEMAP);
    // The workshop file is timeline.html. Serve it at /work/timeline/ so the menu
    // does not advertise the .html/ address. The old address keeps working.
    if(!isFounder&&url.pathname==='/work/timeline')return redirect(COMPANY+'/work/timeline/'+url.search,request.method);
    const upstream=new URL(isFounder?FOUNDER_ORIGIN:ORIGIN);
    upstream.pathname=isFounder?founderPath:(url.pathname==='/work/timeline/'?'/work/timeline.html/':url.pathname);upstream.search=url.search;
    const headers=new Headers();
    // Never forward company cookies, authentication, or arbitrary client headers
    // to the public GitHub Pages backing host.
    for(const name of ['Accept','Accept-Language','If-None-Match','If-Modified-Since','Range','If-Range']){
      const value=request.headers.get(name);if(value)headers.set(name,value);
    }
    const response=await fetcher(upstream.href,{method:request.method,headers,redirect:'manual'});
    const outputHeaders=new Headers(response.headers);
    outputHeaders.delete('Set-Cookie');outputHeaders.set('X-Workshop-Route','v1');
    const location=outputHeaders.get('Location');
    if(location){
      const absolute=new URL(location,upstream).href;
      outputHeaders.set('Location',isFounder?(founderLocation(absolute)||absolute):canonicalLocation(absolute));
    }
    if(response.status===404){
      if(isFounder){
        outputHeaders.set('X-Robots-Tag','noindex');
        return new Response(request.method==='HEAD'?null:response.body,{status:404,headers:outputHeaders});
      }
      const missing=await fetcher(ORIGIN+'/work/404.html',{method:request.method,redirect:'manual'});
      return new Response(request.method==='HEAD'?null:missing.body,{status:404,headers:{'Content-Type':'text/html; charset=utf-8','X-Robots-Tag':'noindex','Cache-Control':'public, max-age=60','X-Workshop-Route':'v1'}});
    }
    return new Response(request.method==='HEAD'?null:response.body,{status:response.status,statusText:response.statusText,headers:outputHeaders});
  }catch{
    // A partial sitemap or a transport error must never look like a healthy page.
    return new Response('Public page origin temporarily unavailable',{status:502,headers:{'Cache-Control':'no-store','X-Robots-Tag':'noindex'}});
  }
}

export default {fetch:request=>handle(request)};
