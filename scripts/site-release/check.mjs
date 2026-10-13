import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {auditInventory,auditHtml,registered} from './contract.mjs';
const json=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const inventory=json('public/brand/sites.json'),discovery=json(process.env.SITE_DISCOVERY||'docs/site-discovery.json');
const catalog=json('public/brand/products/catalog.json'),release=json('public/brand/release.json');
const errors=auditInventory(inventory,discovery);
const args=process.argv.slice(2), dist=args.includes('--dist')?args[args.indexOf('--dist')+1]:null;
const source=fs.readFileSync('public/mb-components.js','utf8');
for(const match of source.matchAll(/https:\/\/[\w.-]*kangdaejong\.com(?:\/[^\s'"<>`]*)?/g)){
  if(!registered(match[0],inventory.sites))errors.push(`unregistered shared navigation: ${match[0]}`);
}
for(const [file,expected] of Object.entries(release.files)){
  const actual=createHash('sha256').update(fs.readFileSync('public/'+file)).digest('hex');
  if(actual!==expected)errors.push(`stale release manifest: ${file}`);
}
let pages=0;
const routes=[];
function visit(dir){
  for(const e of fs.readdirSync(dir,{withFileTypes:true})){
    const file=path.join(dir,e.name);
    if(e.isDirectory())visit(file);
    else if(file.endsWith('.html')){
      const route='/'+path.relative(dist,file).replace(/index\.html$/,'');routes.push(route);pages++;
      const site=inventory.sites.find(s=>s.id==='home');
      const checks=[...site.checks];
      // Existing dark-cards check owns per-page header/redirect exceptions.
      checks.splice(checks.indexOf('header'),1);
      if(site.productPages.includes(route))checks.push('products');
      const html=fs.readFileSync(file,'utf8');
      for(const error of auditHtml(html,{...site,checks}, {socialHash:release.files['brand/current/social.png']},catalog)){
        if(!/http-equiv="refresh"/i.test(html))errors.push(`${route}: ${error}`);
      }
    }
  }
}
if(dist){
  visit(dist);
  const required=inventory.sites.find(s=>s.id==='home').pages;
  for(const route of required)if(!routes.includes(route))errors.push(`registered route missing from build: ${route}`);
  fs.writeFileSync(path.join(dist,'brand/routes.json'),JSON.stringify({schema:1,routes:routes.sort()},null,2)+'\n');
}
if(errors.length)throw Error(errors.join('\n'));
console.log(`Site release checks passed: ${discovery.targets.length} discovery records, ${pages} built pages, ${catalog.products.length} products`);
