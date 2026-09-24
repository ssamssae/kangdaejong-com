import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp,rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { createStore } from '../store.mjs';
import { createAuth,passwordMatches } from '../auth.mjs';
import { createGenerative,createFal } from '../generative.mjs';
const photo=await sharp({create:{width:80,height:60,channels:3,background:'#987665'}}).png().toBuffer();
async function setup(t){const dir=await mkdtemp(join(tmpdir(),'sg-auth-')),store=createStore(join(dir,'db'));t.after(async()=>{store.close();await rm(dir,{recursive:true,force:true});});return store;}
test('email proof grants trial once, tokens hashed/one-use and password reset revokes sessions',async t=>{
  const store=await setup(t),sent=[],auth=createAuth(store,{mailer:async m=>sent.push(m)});
  const {id}=await auth.register('person','strong-test-password','person@example.test');assert.equal(store.wallet.balance(id),0);assert.equal(auth.verified(id),false);
  const token=sent[0].token;assert.ok(!JSON.stringify(store.db.prepare('SELECT * FROM auth_tokens').all()).includes(token));auth.verify(token);assert.equal(store.wallet.balance(id),3);assert.equal(auth.verified(id),true);assert.throws(()=>auth.verify(token),{status:400});
  await auth.resend(id);auth.verify(sent[1].token);assert.equal(store.wallet.balance(id),3);
  store.db.prepare('INSERT INTO sessions VALUES(?,?,?)').run('hash',id,Date.now()+999999);
  await auth.requestReset('person@example.test');await auth.reset(sent.at(-1).token,'new-strong-password');assert.equal(store.db.prepare('SELECT count(*) AS n FROM sessions').get().n,0);assert.equal(await passwordMatches('new-strong-password',store.db.prepare('SELECT password FROM users WHERE id=?').get(id).password),true);
  await assert.rejects(auth.reset(sent.at(-1).token,'new-strong-password'),{status:400});
  const n=sent.length;assert.deepEqual(await auth.requestReset('unknown@example.test'),{ok:true});assert.equal(sent.length,n);
  store.db.prepare('DELETE FROM users WHERE id=?').run(id);const second=await auth.register('person2','strong-test-password','person@example.test');auth.verify(sent.at(-1).token);assert.equal(store.wallet.balance(second.id),0);
});
test('mail delivery failure is recoverable and expired tokens never grant/reset',async t=>{
  const store=await setup(t),sent=[];let failing=true;const auth=createAuth(store,{mailer:async m=>{if(failing)throw new Error('down');sent.push(m);}});
  const {id,mailPending}=await auth.register('person','strong-test-password','person@example.test');assert.equal(mailPending,true);assert.equal(store.wallet.balance(id),0);failing=false;await auth.resend(id);store.db.prepare('UPDATE auth_tokens SET expires=0').run();assert.throws(()=>auth.verify(sent[0].token),{status:400});assert.equal(store.wallet.balance(id),0);
});
test('external job state survives uncertain submit without duplicate send or automatic refund',async t=>{
  const store=await setup(t),user=store.register('person','hash');let submits=0;
  const generated=createGenerative(store,{submit:async()=>{submits++;throw Object.assign(new Error('unknown'),{uncertain:true});}});
  const options={category:'portrait',preset:'natural',strength:60,edit:'retouch'},job=store.reserve(user,'request-key-one','x',options,3);
  const result=await generated.start(job,photo,options);assert.equal(result.needsReview,true);assert.equal(store.wallet.balance(user),0);
  const record=store.db.prepare('SELECT * FROM jobs WHERE id=?').get(job.id);store.fail(job.id);await generated.refresh(record);assert.equal(store.wallet.balance(user),0);assert.equal(submits,1);
});
test('external result validates, completes and refunds multi-credit definitive failure',async t=>{
  const store=await setup(t),user=store.register('person','hash');let rejected=false;
  const generated=createGenerative(store,{submit:async()=>({id:'req'}),poll:async()=>{if(rejected)throw Object.assign(new Error('rejected'),{status:422});return {output:photo};}});
  const options={category:'portrait',preset:'natural',strength:60,edit:'retouch'},job=store.reserve(user,'request-key-one','x',options,3);await generated.start(job,photo,options);const done=await generated.refresh(store.db.prepare('SELECT * FROM jobs WHERE id=?').get(job.id));assert.equal(done.status,'done');assert.equal(store.wallet.balance(user),0);
  store.transaction(()=>store.wallet.grant(user,'test-grant',5,Date.now()+60000));rejected=true;const second=store.reserve(user,'request-key-two','y',options,3);await generated.start(second,photo,options);await assert.rejects(generated.refresh(store.db.prepare('SELECT * FROM jobs WHERE id=?').get(second.id)),{status:422});assert.equal(store.wallet.balance(user),5);
});
test('Fal adapter rejects off-provider result URL and never sends secrets to media fetch',async()=>{
  const requests=[];const provider=createFal({apiKey:'test-only',fetcher:async(url,options)=>{requests.push({url,options});if(url.includes('/status'))return Response.json({status:'COMPLETED'});return Response.json({images:[{url:'http://127.0.0.1/private'}]});}});
  await assert.rejects(provider.poll({statusURL:'https://queue.fal.run/test/status',responseURL:'https://queue.fal.run/test/result'}));assert.equal(requests.length,2);
});

test('expired unknown external jobs delete stored photos and return reservation once',async t=>{
  const store=await setup(t),user=store.register('person','hash'),generated=createGenerative(store,{submit:async()=>{throw Object.assign(new Error('unknown'),{uncertain:true});}}),options={category:'portrait',preset:'natural',strength:60,edit:'retouch'},job=store.reserve(user,'expire-key-000001','x',options,3);
  await generated.start(job,photo,options);store.db.prepare('UPDATE jobs SET expires=0 WHERE id=?').run(job.id);store.cleanup();store.cleanup();assert.equal(store.wallet.balance(user),3);assert.equal(store.db.prepare('SELECT count(*) AS n FROM external_jobs').get().n,0);assert.equal(store.db.prepare('SELECT count(*) AS n FROM jobs').get().n,0);
});
test('malformed submit response remains uncertain, preventing an automatic duplicate paid request',async()=>{
  const provider=createFal({apiKey:'test-only',fetcher:async()=>new Response('not json')});await assert.rejects(provider.submit(photo,'test'),{uncertain:true});
});

test('inherited object names cannot select an AI edit or call its provider',async t=>{
  const store=await setup(t);let submits=0;const generated=createGenerative(store,{submit:async()=>{submits++;}});
  await assert.rejects(generated.start({id:'unused'},photo,{category:'portrait',preset:'natural',strength:60,edit:'__proto__'}),{status:503});assert.equal(submits,0);
});
