import { test } from 'node:test';
import http from 'node:http';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { unzipSync } from 'fflate';
import { createApp } from '../server.mjs';
import { correctPhoto } from '../image.mjs';
import { createStore } from '../store.mjs';
const sample=await sharp({create:{width:80,height:60,channels:4,background:{r:110,g:90,b:70,alpha:0.5}}}).png().toBuffer();
async function fixture(t,options={}) {
  const dataDir=await mkdtemp(join(tmpdir(),'photo-test-'));
  const app=await createApp({dataDir,origin:'http://127.0.0.1:4389',...options});
  await new Promise(resolve=>app.server.listen(4389,'127.0.0.1',resolve));
  t.after(async()=>{await app.close();await rm(dataDir,{recursive:true,force:true});});
  const call=async(path,{cookie,body,method='GET',headers={}}={})=>{
    const response=await fetch(`http://127.0.0.1:4389${path}`,{method,body,headers:{Origin:'http://127.0.0.1:4389',...(cookie?{Cookie:cookie}:{}),...headers}});return response;
  };
  const register=async(username)=>{const response=await call('/api/register',{method:'POST',body:JSON.stringify({username,password:'test-only-password-123'})});assert.equal(response.status,200);return response.headers.get('set-cookie').split(';')[0];};
  const process=async(cookie,key='request-key-00000001',bytes=sample,query='category=portrait&preset=natural&strength=60')=>call(`/api/jobs?${query}`,{cookie,method:'POST',body:bytes,headers:{'Idempotency-Key':key,'Content-Type':'image/png'}});
  return {...app,call,register,process};
}
test('all categories change pixels, preserve dimensions and alpha; no metadata',async()=>{
  const outputs=[];
  for(const [category,preset] of [['portrait','soft'],['product','clean'],['space','food']]){
    const result=await correctPhoto(sample,{category,preset,strength:80});assert.equal(result.width,80);assert.equal(result.height,60);assert.notDeepEqual(result.output,result.original);
    const original=await sharp(result.original).raw().toBuffer(),output=await sharp(result.output).raw().toBuffer();for(let i=3;i<output.length;i+=4)assert.equal(output[i],original[i]);
    assert.equal((await sharp(result.output).metadata()).exif,undefined);outputs.push(result.output);
  }
  assert.notDeepEqual(outputs[0],outputs[1]);assert.notDeepEqual(outputs[1],outputs[2]);
});
test('orientation normalized, size bounded, SVG and unsupported options rejected',async()=>{
  const jpeg=await sharp({create:{width:2600,height:1500,channels:3,background:'#876543'}}).withMetadata({orientation:6}).jpeg().toBuffer();
  const result=await correctPhoto(jpeg,{category:'space',preset:'interior',strength:60});assert.equal(result.height,2400);assert.ok(result.width<2400);
  await assert.rejects(correctPhoto(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/>'),{category:'portrait',preset:'natural',strength:60}),{status:400});
  await assert.rejects(correctPhoto(sample,{category:'product',preset:'food',strength:60}),{status:400});
  await assert.rejects(correctPhoto(sample,{category:'__proto__',preset:'natural',strength:60}),{status:400});
});
test('signup/login persistence, idempotent charge, binary PNG/ZIP and zero-cost repeat download',async t=>{
  const f=await fixture(t),cookie=await f.register('first-user');
  assert.equal((await (await f.call('/api/me',{cookie})).json()).credits,3);
  const result=await (await f.process(cookie)).json();assert.equal(result.credits,2);assert.equal(result.job.status,'done');
  const replay=await (await f.process(cookie)).json();assert.equal(replay.job.id,result.job.id);assert.equal(replay.credits,2);
  assert.equal((await f.process(cookie,'request-key-00000001',sample,'category=product&preset=natural&strength=60')).status,409);
  for(let i=0;i<2;i++){const response=await f.call(`/api/jobs/${result.job.id}/output?download=1`,{cookie});assert.equal(response.status,200);assert.match(response.headers.get('content-disposition'),/attachment/);assert.equal((await sharp(Buffer.from(await response.arrayBuffer())).metadata()).format,'png');}
  const zip=await f.call(`/api/download.zip?ids=${result.job.id}`,{cookie});assert.equal(Object.keys(unzipSync(new Uint8Array(await zip.arrayBuffer()))).length,1);
  assert.equal((await (await f.call('/api/me',{cookie})).json()).credits,2);
  await f.call('/api/logout',{cookie,method:'POST'});assert.equal((await f.call('/api/me',{cookie})).status,401);
  const login=await f.call('/api/login',{method:'POST',body:JSON.stringify({username:'first-user',password:'test-only-password-123'})});assert.equal(login.status,200);assert.equal((await login.json()).credits,2);
  const cookie2=login.headers.get('set-cookie').split(';')[0];assert.equal((await (await f.call('/api/me',{cookie:cookie2})).json()).jobs.length,1);
});
test('failed processing refunds exactly once and invalid bodies never spend permanently',async t=>{
  const f=await fixture(t),cookie=await f.register('failure-user');
  assert.equal((await f.process(cookie,'request-key-bad00001',Buffer.from('bad image'))).status,400);
  assert.equal((await (await f.call('/api/me',{cookie})).json()).credits,3);
  const repeat=await (await f.process(cookie,'request-key-bad00001',Buffer.from('bad image'))).json();assert.equal(repeat.job.status,'failed');assert.equal(repeat.credits,3);
  assert.equal(f.store.db.prepare("SELECT count(*) AS n FROM ledger WHERE reason='refund'").get().n,1);
  assert.equal((await f.process(cookie,'request-key-00000002',sample,'category=bad&preset=natural&strength=60')).status,400);
});
test('insufficient credits, checkout gate, CSRF/host protection and account isolation',async t=>{
  const f=await fixture(t),a=await f.register('user-alpha'),b=await f.register('user-beta');
  const first=await (await f.process(a)).json();
  assert.equal((await f.call(`/api/jobs/${first.job.id}/output`,{cookie:b})).status,404);
  assert.equal((await f.call(`/api/jobs/${first.job.id}`,{cookie:b,method:'DELETE'})).status,404);
  assert.equal((await f.call(`/api/download.zip?ids=${first.job.id}`,{cookie:b})).status,404);
  assert.equal((await f.call('/api/checkout',{cookie:a,method:'POST',body:'{}'})).status,503);
  assert.equal((await f.call('/api/logout',{cookie:a,method:'POST',headers:{Origin:'https://evil.example'}})).status,403);
  const hostStatus=await new Promise((resolve,reject)=>{const req=http.get('http://127.0.0.1:4389/api/me',{headers:{Host:'evil.example',Cookie:a}},res=>{res.resume();resolve(res.statusCode);});req.on('error',reject);});assert.equal(hostStatus,403);
  assert.equal((await f.process(a,'request-key-00000002')).status,201);assert.equal((await f.process(a,'request-key-00000003')).status,201);assert.equal((await f.process(a,'request-key-00000004')).status,402);
  assert.equal((await f.call(`/api/jobs/${first.job.id}`,{cookie:a,method:'DELETE'})).status,200);
  assert.equal((await f.call(`/api/jobs/${first.job.id}/output`,{cookie:a})).status,404);
  assert.equal((await (await f.process(a)).json()).job.status,'deleted');
  assert.equal((await f.call('/api/account',{cookie:a,method:'DELETE'})).status,200);assert.equal((await f.call('/api/me',{cookie:a})).status,401);
  assert.equal(f.store.db.prepare('SELECT count(*) AS n FROM jobs').get().n,0);
});
test('concurrent corrections cannot overspend or duplicate one reservation',async t=>{
  let release;const gate=new Promise(resolve=>release=resolve);
  const f=await fixture(t,{processor:async(...args)=>{await gate;return correctPhoto(...args);}}),cookie=await f.register('parallel-user');
  const first=f.process(cookie);
  for(let n=0;n<50 && f.store.db.prepare('SELECT count(*) AS n FROM jobs').get().n===0;n++)await new Promise(r=>setTimeout(r,10));
  try { const second=await f.process(cookie);assert.equal(second.status,409);assert.equal((await (await f.call('/api/me',{cookie})).json()).credits,2); } finally { release(); }
  assert.equal((await first).status,201);assert.equal(f.store.db.prepare("SELECT count(*) AS n FROM ledger WHERE reason='correction'").get().n,1);
});
test('restart refunds interrupted work; expired photos cleaned; sessions survive database reopen',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'photo-store-')),path=join(dir,'test.sqlite');let store=createStore(path);
  try {
    const id=store.register('restart','not-a-real-password');const job=store.reserve(id,'key','fingerprint',{category:'portrait',preset:'natural',strength:60});
    assert.equal(store.db.prepare('SELECT credits FROM users WHERE id=?').get(id).credits,2);store.close();store=createStore(path);
    assert.equal(store.db.prepare('SELECT credits FROM users WHERE id=?').get(id).credits,3);store.fail(job.id);assert.equal(store.db.prepare('SELECT credits FROM users WHERE id=?').get(id).credits,3);
    store.db.prepare('UPDATE jobs SET expires=0').run();store.cleanup();assert.equal(store.db.prepare('SELECT count(*) AS n FROM jobs').get().n,0);
  } finally {store.close();await rm(dir,{recursive:true,force:true});}
});
