import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp,rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore } from '../store.mjs';
import { createCommerce,nextMonth } from '../commerce.mjs';
import { createToss } from '../toss.mjs';
const now=()=>new Date().toISOString();
function fakeGateway(){const payments=new Map();let chargeCount=0,cancelCount=0;return {payments,mode:'mock',clientKey:'test_ck_mock',get chargeCount(){return chargeCount;},get cancelCount(){return cancelCount;},
  lookup:async o=>{if(!payments.has(o.id))throw Object.assign(new Error('not found'),{providerCode:'NOT_FOUND_PAYMENT'});return payments.get(o.id);},
  confirm:async o=>{const p={orderId:o.id,paymentKey:o.payment_key,totalAmount:o.amount,balanceAmount:o.amount,currency:'KRW',status:'DONE',approvedAt:now()};payments.set(o.id,p);return p;},
  cancel:async o=>{cancelCount++;const p={...payments.get(o.id),status:'CANCELED',balanceAmount:0};payments.set(o.id,p);return p;},
  issue:async x=>({customerKey:x.customerKey,billingKey:'private-test-billing-key'}),
  charge:async o=>{chargeCount++;const p={orderId:o.id,paymentKey:'pk_'+o.id,totalAmount:o.amount,balanceAmount:o.amount,currency:'KRW',status:'DONE',approvedAt:now()};payments.set(o.id,p);return p;},
};}
async function setup(t){const dir=await mkdtemp(join(tmpdir(),'sg-commerce-')),store=createStore(join(dir,'db')),gateway=fakeGateway(),commerce=createCommerce(store,{gateway,encryptionKey:'ab'.repeat(32)});const user=store.register('first','hash');t.after(async()=>{store.close();await rm(dir,{recursive:true,force:true});});return{store,gateway,commerce,user};}
test('pack confirm validates amount; one grant across retries and webhook duplicates',async t=>{
  const {store,gateway,commerce,user}=await setup(t),order=commerce.order(user,'pack','order-request-000001');
  const wrong={orderId:order.id,paymentKey:'pay1',totalAmount:1,balanceAmount:1,currency:'KRW',status:'DONE',approvedAt:now()};gateway.payments.set(order.id,wrong);
  await assert.rejects(commerce.confirm(user,order.id,'pay1'),{status:409});assert.equal(store.wallet.balance(user),3);
  gateway.payments.delete(order.id);await commerce.confirm(user,order.id,'pay1');await commerce.confirm(user,order.id,'pay1');await commerce.event('event1',order.id);await commerce.event('event1',order.id);assert.equal(store.wallet.balance(user),33);
  assert.equal(commerce.order(user,'pack','order-request-000001').id,order.id);
  await assert.rejects(commerce.confirm('other-user',order.id,'pay1'),{status:404});
});
test('refund freezes during uncertain network, reconciles once, never resurrects a canceled grant',async t=>{
  const {store,gateway,commerce,user}=await setup(t),order=commerce.order(user,'pack','refund-request-00001');await commerce.confirm(user,order.id,'pay1');
  const cancel=gateway.cancel;gateway.cancel=async o=>{await cancel(o);throw new Error('response lost');};
  await assert.rejects(commerce.refund(user,order.id));assert.equal(store.wallet.balance(user),3);
  await commerce.reconcile(user,order.id);await commerce.refund(user,order.id);assert.equal(store.wallet.balance(user),3);assert.equal(gateway.cancelCount,1);
  gateway.payments.set(order.id,{...gateway.payments.get(order.id),status:'DONE',balanceAmount:4900});await commerce.event('late-event',order.id);assert.equal(store.wallet.balance(user),3);
});
test('used credits block self refund; external cancellation blocks further paid access for review',async t=>{
  const {store,gateway,commerce,user}=await setup(t),order=commerce.order(user,'pack','used-order-00000001');await commerce.confirm(user,order.id,'pay1');
  store.reserve(user,'job-one-000000001','x',{category:'product',preset:'natural',strength:60},5);
  await assert.rejects(commerce.refund(user,order.id),{status:409});assert.equal(gateway.cancelCount,0);
  gateway.payments.set(order.id,{...gateway.payments.get(order.id),status:'CANCELED',balanceAmount:0});await commerce.event('cancel-used',order.id);assert.equal(commerce.hasReview(user),true);assert.equal(store.wallet.balance(user),3);
});
test('expiry-aware credit allocation and failed multi-credit job refund',async t=>{
  const {store,user}=await setup(t);store.transaction(()=>store.wallet.grant(user,'short',5,Date.now()+100000));
  const job=store.reserve(user,'multi-credit-key1','x',{category:'portrait',preset:'natural',strength:60},5);assert.equal(store.wallet.balance(user),3);store.fail(job.id);store.fail(job.id);assert.equal(store.wallet.balance(user),8);
  store.db.prepare("UPDATE credit_lots SET expires=0 WHERE source='short'").run();assert.equal(store.wallet.balance(user),3);
});
test('subscription billing key encrypted; renewal grants once and cancellation prevents next charge',async t=>{
  const {store,gateway,commerce,user}=await setup(t);const started=commerce.startSubscription(user);await commerce.authorize(user,'auth',user);await commerce.authorize(user,'auth',user);assert.equal(gateway.chargeCount,1);assert.equal(store.wallet.balance(user),153);
  const sub=store.db.prepare('SELECT * FROM subscriptions WHERE id=?').get(started.id);assert.ok(!sub.billing_key.includes('private-test-billing-key'));
  store.db.prepare('UPDATE subscriptions SET period_end=? WHERE id=?').run(Date.now()-1,started.id);await commerce.renewDue();await commerce.renewDue();assert.equal(gateway.chargeCount,2);assert.equal(store.wallet.balance(user),303);
  commerce.cancelSubscription(user);store.db.prepare('UPDATE subscriptions SET period_end=0 WHERE id=?').run(started.id);await commerce.renewDue();assert.equal(gateway.chargeCount,2);assert.equal(commerce.subscription(user).state,'canceled');
  assert.equal(new Date(nextMonth(Date.UTC(2028,0,31))).toISOString().slice(0,10),'2028-02-29');
});
test('uncertain renewal does not re-charge; reconciliation recovers paid response',async t=>{
  const {store,gateway,commerce,user}=await setup(t);commerce.startSubscription(user);const charge=gateway.charge;gateway.charge=async o=>{await charge(o);throw new Error('lost response');};
  await assert.rejects(commerce.authorize(user,'auth',user));assert.equal(store.wallet.balance(user),3);assert.equal(gateway.chargeCount,1);
  await commerce.authorize(user,'auth',user);assert.equal(gateway.chargeCount,1);assert.equal(store.wallet.balance(user),153);
});
test('Toss adapter rejects live keys and uses deterministic request idempotency with bounded URLs',async()=>{
  assert.throws(()=>createToss({secretKey:'live_sk_x',clientKey:'live_ck_x'}));const seen=[];
  const gateway=createToss({secretKey:'test_sk_fake',clientKey:'test_ck_fake',fetcher:async(url,options)=>{seen.push({url,options});return new Response(JSON.stringify({ok:true}));}});
  const order={id:'sg_order',user_id:'user',amount:4900,payment_key:'key'};await gateway.confirm(order);await gateway.confirm(order);assert.equal(seen[0].options.headers['Idempotency-Key'],seen[1].options.headers['Idempotency-Key']);assert.equal(JSON.parse(seen[0].options.body).amount,4900);assert.equal(seen[0].url,'https://api.tosspayments.com/v1/payments/confirm');
});

test('spending rechecks authoritative payment status even when webhook is missing',async t=>{
  const {store,gateway,commerce,user}=await setup(t),order=commerce.order(user,'pack','missing-webhook-0001');await commerce.confirm(user,order.id,'pay1');
  gateway.payments.set(order.id,{...gateway.payments.get(order.id),status:'CANCELED',balanceAmount:0});await commerce.ensureSpendable(user);assert.equal(store.wallet.balance(user),3);assert.equal(commerce.list(user)[0].state,'canceled');
});
test('account erasure retains canceled financial receipt but removes personal data and access',async t=>{
  const {createAuth}=await import('../auth.mjs');const {store,commerce,user}=await setup(t);createAuth(store);store.db.prepare('INSERT INTO identities VALUES(?,?,1)').run(user,'person@example.test');store.db.prepare('INSERT INTO sessions VALUES(?,?,?)').run('session-hash',user,Date.now()+60000);
  const order=commerce.order(user,'pack','delete-order-000001');await commerce.confirm(user,order.id,'pay1');assert.throws(()=>commerce.eraseAccount(user),{status:409});await commerce.refund(user,order.id);commerce.eraseAccount(user);
  assert.equal(store.db.prepare('SELECT count(*) AS n FROM identities').get().n,0);assert.equal(store.db.prepare('SELECT count(*) AS n FROM sessions').get().n,0);assert.equal(store.wallet.balance(user),0);assert.equal(commerce.list(user)[0].state,'canceled');assert.notEqual(store.db.prepare('SELECT username FROM users WHERE id=?').get(user).username,'first');
});
