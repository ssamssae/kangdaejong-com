import { randomUUID,randomBytes,createCipheriv,createDecipheriv } from 'node:crypto';
import { fault } from './wallet.mjs';
const DAY=86400000;
export const PRODUCTS={pack:{amount:4900,credits:30},pro:{amount:19900,credits:150}};
export function nextMonth(time) {const d=new Date(time),day=d.getUTCDate();d.setUTCDate(1);d.setUTCMonth(d.getUTCMonth()+1);const last=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0)).getUTCDate();d.setUTCDate(Math.min(day,last));return d.getTime();}
export function createCommerce(store,{gateway=null,encryptionKey=null}={}) {
  const {db,transaction,wallet}=store;
  db.exec(`CREATE TABLE IF NOT EXISTS orders(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),request_key TEXT NOT NULL,plan TEXT NOT NULL,amount INTEGER NOT NULL,credits INTEGER NOT NULL,state TEXT NOT NULL,payment_key TEXT UNIQUE,created INTEGER NOT NULL,period_end INTEGER,subscription_id TEXT,UNIQUE(user_id,request_key));
    CREATE TABLE IF NOT EXISTS subscriptions(id TEXT PRIMARY KEY,user_id TEXT UNIQUE NOT NULL REFERENCES users(id),state TEXT NOT NULL,billing_key TEXT,period_end INTEGER,cancel_at_end INTEGER NOT NULL DEFAULT 0,created INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS payment_events(id TEXT PRIMARY KEY,order_id TEXT NOT NULL,observed_at INTEGER NOT NULL,status TEXT NOT NULL);`);
  const locks=new Set();
  const requireGateway=()=>{if(!gateway)throw fault(503,'결제는 아직 활성화되지 않았습니다.');};
  const key=encryptionKey?Buffer.from(encryptionKey,'hex'):null;
  function seal(value){if(key?.length!==32)throw fault(503,'구독 보관 설정이 준비되지 않았습니다.');const iv=randomBytes(12),c=createCipheriv('aes-256-gcm',key,iv);return Buffer.concat([iv,c.update(value),c.final(),c.getAuthTag()]).toString('base64');}
  function unseal(value){const b=Buffer.from(value,'base64'),d=createDecipheriv('aes-256-gcm',key,b.subarray(0,12));d.setAuthTag(b.subarray(-16));return Buffer.concat([d.update(b.subarray(12,-16)),d.final()]).toString();}
  const owned=(id,user)=>{const order=db.prepare('SELECT * FROM orders WHERE id=? AND user_id=?').get(id,user);if(!order)throw fault(404,'주문을 찾을 수 없습니다.');return order;};
  const busy=async(id,fn)=>{if(locks.has(id))throw fault(409,'같은 결제를 확인 중입니다.');locks.add(id);try{return await fn();}finally{locks.delete(id);}};
  const publicOrder=order=>({id:order.id,plan:order.plan,amount:order.amount,credits:order.credits,state:order.state,created:order.created,periodEnd:order.period_end});
  function validateReceipt(order,payment) {
    if(payment.orderId!==order.id||payment.totalAmount!==order.amount||payment.currency!=='KRW'||typeof payment.paymentKey!=='string'||!payment.paymentKey||payment.paymentKey.length>200||(order.payment_key&&order.payment_key!==payment.paymentKey))throw fault(409,'결제 정보가 주문과 일치하지 않습니다.');
  }
  function apply(order,payment) {return transaction(()=>{
    order=db.prepare('SELECT * FROM orders WHERE id=?').get(order.id);validateReceipt(order,payment);
    if(['canceled','review'].includes(order.state))return publicOrder(order); // A late DONE event never resurrects a cancellation.
    if(['CANCELED','PARTIAL_CANCELED'].includes(payment.status)) {
      if(payment.status==='CANCELED'&&payment.balanceAmount!==0)throw fault(409,'취소 잔액이 일치하지 않습니다.');
      const lot=db.prepare('SELECT * FROM credit_lots WHERE source=?').get(`order:${order.id}`);
      const review=payment.status==='PARTIAL_CANCELED'||(lot && lot.remaining<lot.granted);
      wallet.revoke(`order:${order.id}`);
      db.prepare('UPDATE orders SET state=?,payment_key=? WHERE id=?').run(review?'review':'canceled',payment.paymentKey,order.id);
      if(order.subscription_id)db.prepare("UPDATE subscriptions SET cancel_at_end=1,state='canceled',billing_key=NULL WHERE id=?").run(order.subscription_id);
      return publicOrder(db.prepare('SELECT * FROM orders WHERE id=?').get(order.id));
    }
    if(payment.status!=='DONE'||payment.balanceAmount!==order.amount)throw fault(409,'승인 완료된 전액 결제만 지급할 수 있습니다.');
    if(order.state==='refunding')throw fault(409,'환불 결과를 확인 중입니다. 크레딧을 잠시 사용할 수 없습니다.');
    if(order.state!=='paid') {
      const approved=Date.parse(payment.approvedAt);if(!Number.isFinite(approved)||approved>Date.now()+300_000)throw fault(409,'결제 승인 시각을 확인할 수 없습니다.');
      const end=order.plan==='pro'?nextMonth(approved):approved+365*DAY;
      if(end<=Date.now())throw fault(409,'오래된 결제입니다. 운영자 확인이 필요합니다.');
      wallet.grant(order.user_id,`order:${order.id}`,order.credits,end);
      db.prepare("UPDATE orders SET state='paid',payment_key=?,period_end=? WHERE id=?").run(payment.paymentKey,end,order.id);
      if(order.subscription_id)db.prepare("UPDATE subscriptions SET state='active',period_end=? WHERE id=?").run(end,order.subscription_id);
    }
    return publicOrder(db.prepare('SELECT * FROM orders WHERE id=?').get(order.id));
  });}
  function createOrder(user,plan,requestKey,subscription=null) {return transaction(()=>{
    if(!Object.hasOwn(PRODUCTS,plan)||typeof requestKey!=='string'||!/^[a-zA-Z0-9_-]{16,80}$/.test(requestKey))throw fault(400,'상품과 요청 번호를 확인해주세요.');
    if(plan==='pro'&&!subscription)throw fault(400,'프로는 구독 등록으로 시작해주세요.');
    const old=db.prepare('SELECT * FROM orders WHERE user_id=? AND request_key=?').get(user,requestKey);
    if(old){if(old.plan!==plan)throw fault(409,'같은 요청 번호의 상품이 다릅니다.');return old;}
    const p=PRODUCTS[plan],id=`sg_${randomUUID()}`;
    db.prepare('INSERT INTO orders VALUES(?,?,?,?,?,?,?,NULL,?,NULL,?)').run(id,user,requestKey,plan,p.amount,p.credits,'pending',Date.now(),subscription);
    return owned(id,user);
  });}
  const service={
    enabled:!!gateway,clientKey:gateway?.clientKey,mode:gateway?.mode??'disabled',
    list:user=>db.prepare('SELECT * FROM orders WHERE user_id=? ORDER BY created DESC LIMIT 100').all(user).map(publicOrder),
    subscription:user=>{const s=db.prepare('SELECT id,state,period_end,cancel_at_end FROM subscriptions WHERE user_id=?').get(user);return s??null;},
    eraseAccount(user){return transaction(()=>{
      const unresolved=db.prepare("SELECT id FROM orders WHERE user_id=? AND state NOT IN ('canceled')").get(user);
      if(unresolved)throw fault(409,'먼저 결제를 환불하거나 결제 기록 보관 처리를 확인해주세요.');
      const pseudonym=`deleted_${randomUUID()}`;
      for(const table of ['sessions','auth_tokens','identities','styles','jobs','credit_lots','ledger','subscriptions'])db.prepare(`DELETE FROM ${table} WHERE user_id=?`).run(user);
      db.prepare('UPDATE users SET username=?,password=?,credits=0 WHERE id=?').run(pseudonym,randomBytes(32).toString('hex'),user);
      return {ok:true,financialRecordRetained:true};
    });},
    hasFinancialHistory:user=>!!db.prepare('SELECT id FROM orders WHERE user_id=?').get(user),
    hasReview:user=>!!db.prepare("SELECT id FROM orders WHERE user_id=? AND state IN ('review','refunding')").get(user),
    order(user,plan,requestKey){requireGateway();return publicOrder(createOrder(user,plan,requestKey));},
    async confirm(user,id,paymentKey){requireGateway();return busy(id,async()=>{
      let order=owned(id,user);if(order.plan!=='pack')throw fault(400,'일반결제 주문이 아닙니다.');
      if(typeof paymentKey!=='string'||paymentKey.length<4||paymentKey.length>200||(order.payment_key&&order.payment_key!==paymentKey))throw fault(400,'결제 확인 정보가 일치하지 않습니다.');
      if(['paid','canceled','review','refunding'].includes(order.state))return service.reconcileUnlocked(order);
      db.prepare("UPDATE orders SET payment_key=?,state='confirming' WHERE id=?").run(paymentKey,id);order=owned(id,user);
      // Query first on retries: don't infer failure from a lost confirm response.
      let payment;try{payment=await gateway.lookup(order);}catch(e){if(!['NOT_FOUND_PAYMENT','NOT_FOUND'].includes(e.providerCode))throw e;}
      if(!payment||['READY','IN_PROGRESS'].includes(payment.status))payment=await gateway.confirm(order);
      return apply(order,payment);
    });},
    async reconcileUnlocked(order){return apply(order,await gateway.lookup(order));},
    async ensureSpendable(user){
      requireGateway();
      for(const order of db.prepare("SELECT orders.* FROM orders JOIN credit_lots ON credit_lots.source='order:'||orders.id WHERE orders.user_id=? AND credit_lots.state='active' AND credit_lots.remaining>0 AND credit_lots.expires>?").all(user,Date.now()))await busy(order.id,()=>service.reconcileUnlocked(order));
      if(service.hasReview(user))throw fault(409,'결제·환불 상태를 확인해야 합니다.');
    },
    async reconcile(user,id){requireGateway();return busy(id,()=>service.reconcileUnlocked(owned(id,user)));},
    async refund(user,id){requireGateway();return busy(id,async()=>{
      let order=owned(id,user);
      const receipt=await gateway.lookup(order);validateReceipt(order,receipt);
      if(['CANCELED','PARTIAL_CANCELED'].includes(receipt.status))return apply(order,receipt);
      if(order.state==='canceled')return publicOrder(order);
      if(order.state==='review')throw fault(409,'운영자 확인이 필요한 결제입니다.');
      if(receipt.status!=='DONE'||receipt.balanceAmount!==order.amount)throw fault(409,'환불 가능한 결제가 아닙니다.');
      if(order.state!=='refunding')transaction(()=>{wallet.freeze(`order:${id}`);db.prepare("UPDATE orders SET state='refunding' WHERE id=?").run(id);if(order.subscription_id)db.prepare('UPDATE subscriptions SET cancel_at_end=1 WHERE id=?').run(order.subscription_id);});
      order=owned(id,user);const canceled=await gateway.cancel(order);return apply(order,canceled);
    });},
    startSubscription(user){requireGateway();if(key?.length!==32)throw fault(503,'구독 보관 설정이 준비되지 않았습니다.');
      const old=db.prepare('SELECT * FROM subscriptions WHERE user_id=?').get(user);
      if(old && old.state!=='pending')throw fault(409,'기존 구독을 먼저 확인해주세요.');
      const id=old?.id??randomUUID();if(!old)db.prepare("INSERT INTO subscriptions VALUES(?,?,'pending',NULL,NULL,0,?)").run(id,user,Date.now());
      return {id,customerKey:user,clientKey:gateway.clientKey};
    },
    async authorize(user,authKey,customerKey){requireGateway();if(customerKey!==user||typeof authKey!=='string'||authKey.length>300)throw fault(400,'구독 인증 정보를 확인해주세요.');
      return busy(`subscription:${user}`,async()=>{
        let s=db.prepare('SELECT * FROM subscriptions WHERE user_id=?').get(user);if(!s)throw fault(404,'구독 신청이 없습니다.');
        if(!s.billing_key){const value=await gateway.issue({authKey,customerKey,id:s.id});if(value.customerKey!==user||typeof value.billingKey!=='string')throw fault(409,'빌링키의 고객이 일치하지 않습니다.');db.prepare("UPDATE subscriptions SET billing_key=?,state='ready' WHERE id=?").run(seal(value.billingKey),s.id);}
        s=db.prepare('SELECT * FROM subscriptions WHERE id=?').get(s.id);
        if(s.cancel_at_end)throw fault(409,'해지된 구독입니다.');
        if(s.state==='active')return service.subscription(user);
        await service.chargeCycle(s,`initial_${s.id}`);return service.subscription(user);
      });
    },
    async chargeCycle(s,requestKey){
      const order=createOrder(s.user_id,'pro',requestKey,s.id);
      if(order.state==='paid')return publicOrder(order);
      if(order.state==='charging'){
        // An uncertain charge is only reconciled; never blindly charge again.
        return service.reconcileUnlocked(order);
      }
      db.prepare("UPDATE orders SET state='charging' WHERE id=?").run(order.id);
      try{return apply(order,await gateway.charge(order,unseal(s.billing_key)));}
      catch(e){db.prepare("UPDATE subscriptions SET state='past_due' WHERE id=?").run(s.id);throw e;}
    },
    async renewDue(){requireGateway();const outcomes=[];
      for(const s of db.prepare("SELECT * FROM subscriptions WHERE period_end<=? AND state IN ('active','past_due')").all(Date.now())){
        if(s.cancel_at_end){db.prepare("UPDATE subscriptions SET state='canceled',billing_key=NULL WHERE id=?").run(s.id);continue;}
        try{await busy(`subscription:${s.user_id}`,()=>service.chargeCycle(s,`renew_${s.id}_${s.period_end}`));outcomes.push({id:s.id,ok:true});}catch{outcomes.push({id:s.id,ok:false});}
      }return outcomes;
    },
    cancelSubscription(user){const s=db.prepare('SELECT * FROM subscriptions WHERE user_id=?').get(user);if(!s)throw fault(404,'구독이 없습니다.');if(locks.has(`subscription:${user}`))throw fault(409,'결제 처리 후 해지해주세요.');db.prepare('UPDATE subscriptions SET cancel_at_end=1 WHERE id=?').run(s.id);return service.subscription(user);},
    async event(id,orderId){requireGateway();if(typeof id!=='string'||id.length>200||typeof orderId!=='string')throw fault(400,'이벤트 형식이 잘못됐습니다.');
      const duplicate=!!db.prepare('SELECT id FROM payment_events WHERE id=?').get(id);
      const order=db.prepare('SELECT * FROM orders WHERE id=?').get(orderId);if(!order)throw fault(404,'주문이 없습니다.');
      // The webhook body is untrusted. Fetch authenticated current status every time.
      const result=await busy(orderId,()=>service.reconcileUnlocked(order));
      db.prepare('INSERT OR IGNORE INTO payment_events VALUES(?,?,?,?)').run(id,orderId,Date.now(),result.state);return {...result,duplicate};
    },
  };return service;
}
