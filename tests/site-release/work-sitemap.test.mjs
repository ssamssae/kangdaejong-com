import test from 'node:test';
import assert from 'node:assert/strict';
import {workSitemapUrls} from '../../scripts/site-release/work-sitemap.mjs';
import {registered} from '../../scripts/site-release/contract.mjs';
import fs from 'node:fs';
const xml=urls=>'<urlset>'+urls.map(url=>`<url><loc>${url}</loc></url>`).join('')+'</urlset>';
test('candidate works before and after the legacy sitemap redirects to the shared map',()=>{
  const work=['https://kangdaejong.com/work/','https://kangdaejong.com/work/products/'];
  assert.deepEqual(workSitemapUrls(xml(work)),work);
  assert.deepEqual(workSitemapUrls(xml(['https://kangdaejong.com/',...work])),work);
  assert.throws(()=>workSitemapUrls(xml([...work,'https://foreign.test/'])));
  assert.throws(()=>workSitemapUrls(xml(['https://kangdaejong.com/'])));
});
test('shared sitemap pages keep their own per-site checks',()=>{
  const {sites}=JSON.parse(fs.readFileSync('public/brand/sites.json','utf8'));
  assert.equal(registered('https://kangdaejong.com/',sites).id,'home');
  assert.equal(registered('https://kangdaejong.com/work/products/',sites).id,'work');
  assert.equal(registered('https://work.kangdaejong.com/products/',sites).id,'work');
});
