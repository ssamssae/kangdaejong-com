import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {auditInventory,hasValidProductException} from './contract.mjs';
const json=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const hash=b=>createHash('sha256').update(b).digest('hex');
const inventory=json('public/brand/sites.json'), discovery=json(process.env.SITE_DISCOVERY||'docs/site-discovery.json');
const errors=auditInventory(inventory,discovery);
const catalog=json('public/brand/products/catalog.json');
const ids=new Set();
for(const p of catalog.products){
  if(ids.has(p.id))errors.push(`duplicate product ${p.id}`);ids.add(p.id);
  if(p.exception){if(!hasValidProductException(p))errors.push(`invalid exception ${p.id}`);continue;}
  if(!p.source?.startsWith('https://')||!p.files?.icon)errors.push(`missing provenance ${p.id}`);
  for(const [key,file] of Object.entries(p.files||{})){
    const expected=`https://kangdaejong.com/brand/products/${p.id}${key==='icon2x'?'@2x':''}.webp`;
    if(p[key]!==expected)errors.push(`unstable product URL ${p.id}`);
    const bytes=fs.readFileSync('public'+file.source);
    if(hash(bytes)!==file.sha256)errors.push(`source hash mismatch ${p.id}/${key}`);
    // Public aliases are generated from the canonical mapping, never independently edited.
    fs.writeFileSync('public'+new URL(expected).pathname,bytes);
  }
}
if(errors.length)throw Error(errors.join('\n'));
const files={};
const assets=['brand/current/tokens.css','mb-components.js','brand/products/catalog.json','brand/sites.json'];
for(const key of ['logo.svg','favicon.ico','icon.png','apple-touch-icon.png','social.png'])assets.push('brand/current/'+key);
for(const p of catalog.products)for(const key of ['icon','icon2x'])if(p[key])assets.push(new URL(p[key]).pathname.slice(1));
for(const file of assets)files[file]=hash(fs.readFileSync('public/'+file));
const revision=hash(JSON.stringify(files));
const manifest={schema:1,revision,commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),inventoryObservedAt:discovery.observedAt,files};
fs.writeFileSync('public/brand/release.json',JSON.stringify(manifest,null,2)+'\n');
console.log(`Site contract: ${inventory.sites.length} registered surfaces, ${ids.size} products, ${Object.keys(files).length} assets (${revision.slice(0,12)})`);
