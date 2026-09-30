import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import worker from '../logo-worker/index.mjs';

test('photo retirement blocks page and API access before storage, assets or providers',async()=>{
 const env=new Proxy({}, {get(){throw Error('retired photo must not access bindings');}});
 for(const path of ['/photo','/photo/','/photo/privacy','/photo/api','/photo/api/catalog','/photo/api/jobs','/photo/api/checkout','/photo/api/subscription/start'])for(const method of ['GET','POST','HEAD']){
  const response=await worker.fetch(new Request('https://kangdaejong.com'+path+'?payment=success',{method}),env);
  assert.equal(response.status,410);
  assert.equal(response.headers.get('cache-control'),'no-store');
  assert.match(response.headers.get('x-robots-tag'),/noindex/);
  if(method==='HEAD')assert.equal(await response.text(),'');
  else if(path.includes('/api'))assert.equal((await response.json()).closed,true);
  else assert.match(await response.text(),/사진꾸러미 서비스를 종료했습니다/);
 }
});

test('retired local launch opens no database even with external features enabled',async()=>{
 const data=await mkdtemp(join(tmpdir(),'photo-retired-'));
 try {
  const result=spawnSync(process.execPath,['photo-app/server.mjs'],{encoding:'utf8',env:{...process.env,PHOTO_DATA_DIR:data,PHOTO_PAYMENTS_MODE:'test',PHOTO_MAIL_ENABLED:'true',PHOTO_AI_ENABLED:'true',PHOTO_AUTO_RENEWALS:'true'},timeout:10000});
  assert.equal(result.status,1);assert.match(result.stderr,/사진꾸러미 서비스를 종료했습니다/);
  assert.deepEqual(await readdir(data),[]);
 } finally {await rm(data,{recursive:true,force:true});}
});
