import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

// Derive current canonical URLs from the built pages; redirects and noindex pages stay out.
const root=path.resolve('dist');
const urls=[];
async function visit(dir){
  for(const entry of await readdir(dir,{withFileTypes:true})){
    const file=path.join(dir,entry.name);
    if(entry.isDirectory())await visit(file);
    else if(entry.name==='index.html'){
      const html=await readFile(file,'utf8');
      if(/<meta\b[^>]*name="robots"[^>]*content="[^"]*noindex/i.test(html))continue;
      const canonical=html.match(/<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"/i)?.[1];
      const route='/'+path.relative(root,dir).split(path.sep).filter(Boolean).join('/');
      const expected='https://kangdaejong.com'+(route==='/'?'/':route+'/');
      if(canonical===expected)urls.push(canonical);
    }
  }
}
await visit(root);
if(!urls.includes('https://kangdaejong.com/'))throw Error('Homepage canonical missing; refusing empty sitemap');
await writeFile(path.join(root,'sitemap.xml'),'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+[...new Set(urls)].sort().map(url=>`  <url><loc>${url}</loc></url>`).join('\n')+'\n</urlset>\n');
console.log(`Sitemap: ${urls.length} current canonical pages`);
