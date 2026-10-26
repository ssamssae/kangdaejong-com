import {attributes,hasValidProductException} from './contract.mjs';

// A work page is fetched from another repository's live deployment during a
// candidate check. Its approved letter marks may outlive this catalog change.
export async function catalogForProductPage(html,catalog,{candidate,site,loadLiveCatalog}){
  if(!candidate||site.id!=='work')return catalog;
  const missing=new Set();
  for(const match of html.matchAll(/<(article|div)\b((?=[^>]*(?:data-product-id|data-catalog-item))[^>]*)>([\s\S]*?)<\/\1>/gi)){
    const attrs=attributes(match[2]);
    if(!attrs['data-product-id']&&!/\bdata-catalog-item\b/i.test(match[2]))continue;
    if(/<img\b/i.test(match[3]))continue;
    const name=match[3].match(/<h3\b[^>]*>(.*?)<\/h3>/s)?.[1];
    const product=attrs['data-product-id']
      ?catalog.products.find(p=>p.id===attrs['data-product-id'])
      :catalog.products.find(p=>p.name===name||(p.aliases||[]).includes(name));
    if(product&&!hasValidProductException(product))missing.add(product.id);
  }
  if(!missing.size)return catalog;
  const live=await loadLiveCatalog();
  if(!Array.isArray(live?.products))throw Error('invalid deployed product catalog');
  const exceptions=new Map(live.products.filter(p=>missing.has(p.id)&&hasValidProductException(p)).map(p=>[p.id,p]));
  return {...catalog,products:catalog.products.map(p=>exceptions.get(p.id)||p)};
}
