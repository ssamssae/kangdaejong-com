// Current public repository hosting flags supplement the authenticated deploy
// inventory snapshot in unprivileged PR CI. DNS/Workers discovery is mandatory
// again on the authenticated deploy path; no credential is copied into CI.
import fs from 'node:fs';
import {auditInventory} from './contract.mjs';
const inventory=JSON.parse(fs.readFileSync('public/brand/sites.json','utf8'));
const targets=[];
for(let page=1;page<=20;page++){
  const headers={'Accept':'application/vnd.github+json'};
  if(process.env.GH_TOKEN)headers.Authorization=`Bearer ${process.env.GH_TOKEN}`;
  const r=await fetch(`https://api.github.com/users/ssamssae/repos?per_page=100&page=${page}`,{headers,signal:AbortSignal.timeout(25000)});
  if(!r.ok)throw Error(`Public hosting discovery HTTP ${r.status}`);
  const repos=await r.json();
  for(const repo of repos.filter(r=>r.has_pages)){
    const source='github-pages:'+repo.name;
    const known=inventory.sites.find(s=>s.deployments.includes(source));
    targets.push({source,url:known?.url||`https://founder.kangdaejong.com/${repo.name}/`});
  }
  if(repos.length<100)break;
  if(page===20)throw Error('Public repository inventory exceeded page limit');
}
const errors=auditInventory(inventory,{targets});
if(errors.length)throw Error(errors.join('\n'));
console.log(`Live public hosting discovery: ${targets.length} registered GitHub Pages deployments`);
