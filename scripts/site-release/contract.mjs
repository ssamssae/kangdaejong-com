// Shared pure checks: used by PR, local deployment and production readback.
export const ORIGIN='https://kangdaejong.com';
export const SOCIAL=`${ORIGIN}/brand/current/social.png`;
export function registered(url, sites) {
  const u=new URL(url);
  return [...sites].sort((a,b)=>new URL(b.url).pathname.length-new URL(a.url).pathname.length).find(s=>[s.url,...(s.aliases||[])].some(raw=>{
    const base=new URL(raw); return base.host===u.host && (base.pathname==='/' || u.pathname===base.pathname || u.pathname.startsWith(base.pathname.endsWith('/')?base.pathname:base.pathname+'/'));
  }));
}
export function auditInventory(inventory,discovery) {
  const errors=[], ids=new Set();
  for(const site of inventory.sites){
    if(ids.has(site.id))errors.push(`duplicate site: ${site.id}`);ids.add(site.id);
    if(site.mode==='exception'&&!site.reason?.trim())errors.push(`${site.id}: exception needs reason`);
    if(!['shared','exception'].includes(site.mode||'shared'))errors.push(`${site.id}: unknown mode`);
    for(const [url,reason] of Object.entries(site.identityIconExceptions||{}))if(!reason?.trim())errors.push(`${site.id}: icon exception needs reason (${url})`);
  }
  for(const target of discovery.targets){
    const site=registered(target.url,inventory.sites);
    if(!site || (site.deployments && target.source!=='cloudflare-dns'&&!site.deployments.includes(target.source)))errors.push(`unregistered target: ${target.url} (${target.source})`);
  }
  return [...new Set(errors)];
}
export function attributes(tag){
  return Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)].map(m=>[m[1].toLowerCase(),m[2]??m[3]]));
}
export function hasValidProductException(product){
  const exception=product.exception;
  if(product.icon||product.icon2x)return false;
  if(typeof exception==='string')return Boolean(exception.trim());
  return Boolean(exception&&typeof exception==='object'&&!Array.isArray(exception)
    &&exception.status==='approved-placeholder'&&exception.fallback==='letter-mark'
    &&typeof exception.reason==='string'&&exception.reason.trim()
    &&typeof exception.approvedAt==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(exception.approvedAt)
    &&!product.source&&!product.files);
}
export function auditProductHtml(html,catalog){
  const errors=[];
  const entries=new Map(catalog.products.map(p=>[p.id,p]));
  for(const match of html.matchAll(/<(article|div)\b((?=[^>]*(?:data-product-id|class=["'][^"']*\b(?:catalog-card|app-row)\b))[^>]*)>([\s\S]*?)<\/\1>/gi)){
    const attrs=attributes(match[2]);
    const card=/(?:^|\s)(?:catalog-card|app-row)(?:\s|$)/.test(attrs.class||'');
    if(!card&&!attrs['data-product-id'])continue;
    const id=attrs['data-product-id'];
    if(!id){errors.push('card missing product id');continue;}
    const entry=entries.get(id);
    if(!entry){errors.push(`unknown product: ${id}`);continue;}
    const imgs=[...match[3].matchAll(/<img\b[^>]*>/gi)].map(([t])=>attributes(t));
    if(entry.exception){if(!hasValidProductException(entry)||imgs.length)errors.push(`${id}: invalid icon exception`);continue;}
    if(!imgs.some(i=>i.src===entry.icon))errors.push(`${id}: missing or stale icon (expected ${entry.icon})`);
    for(const img of imgs)if(img.src?.includes('product-icons/') || (img.srcset&&img.srcset.split(',').some(s=>![entry.icon,entry.icon2x].includes(s.trim().split(/\s/)[0]))))errors.push(`${id}: stale icon srcset/source`);
  }
  if(!/data-product-id\s*=/.test(html))errors.push('no product ids found on product page');
  return errors;
}
export function auditHtml(html,site,{socialHash},catalog){
  const errors=[], checks=site.checks||[];
  const links=[...html.matchAll(/<link\b[^>]*>/gi)].map(([t])=>attributes(t));
  const metas=[...html.matchAll(/<meta\b[^>]*>/gi)].map(([t])=>attributes(t));
  if(checks.includes('tokens')&&!links.some(l=>l.rel==='stylesheet'&&new URL(l.href||'',site.url).href===`${ORIGIN}/brand/current/tokens.css`))errors.push('missing shared tokens.css');
  if(checks.includes('header')&&!html.includes('mb-components.js'))errors.push('missing shared header');
  for(const link of links.filter(l=>['icon','apple-touch-icon','shortcut icon'].includes(l.rel))){
    const url=new URL(link.href||'',site.url);
    if(site.identityIconExceptions?.[url.href])continue;
    if(url.origin!==ORIGIN||!/^\/brand\/current\/(?:logo\.svg|favicon\.ico|icon\.png|apple-touch-icon\.png)$/.test(url.pathname))errors.push(`noncanonical brand icon: ${url.href}`);
  }
  if(checks.includes('social')){
    const value=metas.filter(m=>m.property==='og:image').map(m=>m.content);
    if(value.length!==1||![SOCIAL,`${SOCIAL}?v=${socialHash.slice(0,16)}`].includes(value[0]))errors.push('missing or stale shared social image');
  }
  if(checks.includes('products'))errors.push(...auditProductHtml(html,catalog));
  return errors;
}
// T-261024-058: 대표 화면의 모드 검사 — 공개 사이트는 전부 라이트다(대종님 「다크를 풀고 전부 라이트」, 2026-10-24).
// 판정은 그려진 결과로 한다: 기기 설정이 다크여도(colorScheme='dark' 에뮬레이션) 계산된 color-scheme 이 light 이고 바탕이 밝아야 한다.
// 원본(공용 tokens.css)에 다크 블록이 없으므로 data-theme 를 안 적은 화면(제품 안내 Worker)도, 옛 "auto" 선언이 남은 화면도 라이트로 그려진다 —
// 선언 문자열은 여기서 보지 않는다(각 저장소의 verify-tone-copies·light-coverage 가 선언을 잡고, 다크 블록이 다시 생기면 brand-tokens.mjs 가 빌드를 멈춘다).
// 그래서 회사 홈 PR 의 후보 검사가 아직 안 바뀐 다른 저장소 라이브 때문에 막히지 않는다.
// (T-261024-050 까지는 등록부 theme:"light" 가 회사 홈만 못 박고, 다른 화면은 다크에서 흰 면이 없어야 했다. 그 분기는 걷어냈다.)
export const isLightSurface=(color)=>{
  const values=color.match(/[\d.]+/g)?.map(Number)||[];
  return values.length<3||(values.length>=4&&values[3]===0)||(values[0]+values[1]+values[2])/3>180;
};
export function auditScreen(root,site,colorScheme){
  const errors=[];
  if(root.overflow)errors.push('horizontal overflow');
  if(!root.theme.includes('light'))errors.push(`theme mismatch ${root.theme} (every page is light, T-261024-058)`);
  if(!isLightSurface(root.bg))errors.push(`dark surface in ${colorScheme} emulation: ${root.bg}`);
  return errors;
}
export function checksForPage(site,route){
  const checks=[...(site.checks||[])];
  if(site.headerExceptions?.[route])checks.splice(checks.indexOf('header'),checks.includes('header')?1:0);
  if(site.socialPages?.includes(route))checks.push('social');
  if(site.productPages?.includes(route))checks.push('products');
  return checks;
}
export function summarize(results){
  const unverified=results.filter(r=>r.status!=='passed'&&r.status!=='exception');
  return {targets:results.length,verified:results.filter(r=>r.status==='passed').length,exceptions:results.filter(r=>r.status==='exception').length,unverified,complete:results.some(r=>r.status==='passed')&&unverified.length===0,telegramPreview:'not_verified'};
}
