// Separate service: no changes to the existing first-name payment database.
export const PRICE = 9900;
export const LIMIT = 8;
export const ASSET_TTL = 29 * 86400000;
export const POLICY_VERSION = "2026-09-24";
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' } });
const fault = (message, status = 400) => Object.assign(new Error(message), { status });
const ready = env => env.SALES_ENABLED === 'true' && !!env.RECRAFT_API_TOKEN && !!env.TOSS_CLIENT_KEY && !!env.TOSS_SECRET_KEY;
const hash = async str => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str)))].map(x=>x.toString(16).padStart(2,'0')).join('');
async function body(request) { const text = await request.text(); if(text.length>5000)throw fault('입력 내용이 너무 깁니다.',413); try{return JSON.parse(text);}catch{throw fault('잘못된 입력입니다.');} }
function brief(value) {
 if(!value || typeof value.name!=='string' || !value.name.trim() || value.name.length>24)throw fault('브랜드 이름을 24자 이내로 입력해주세요.');
 const mood=['minimal','warm','bold','elegant'].includes(value.mood)?value.mood:'minimal';
 return {name:value.name.trim(),business:String(value.business||'').slice(0,400),mood,color:/^#[0-9a-f]{6}$/i.test(value.color)?value.color:'#315443'};
}
export default {
 async fetch(request,env) {
  try {
   const url=new URL(request.url);
   if(!url.pathname.startsWith('/logo/api/')) {
    if(url.pathname==='/')return Response.redirect(url.origin+'/logo/',302);
    return env.ASSETS.fetch(request);
   }
   if(request.method==='POST' && request.headers.get('origin') && request.headers.get('origin')!==url.origin)throw fault('허용되지 않은 요청입니다.',403);
   const route=url.pathname.slice('/logo/api/'.length);
   if(route==='config' && request.method==='GET')return json({ready:ready(env),price:PRICE,credits:LIMIT,clientKey:ready(env)?env.TOSS_CLIENT_KEY:null,testMode:env.TOSS_CLIENT_KEY?.startsWith('test_')||false});
   if(!env.ORDERS)throw fault('맞춤 생성 연결을 준비 중입니다.',503);
   if(route==='orders' && request.method==='POST') {
    if(!ready(env))throw fault('아직 구매할 수 없습니다. 무료 견본을 먼저 이용해주세요.',503);
    const rate=env.ORDERS.get(env.ORDERS.idFromName('rate:'+await hash(request.headers.get('CF-Connecting-IP')||'local')));
    const limit=await rate.fetch(new Request('https://internal/rate',{method:'POST'}));if(!limit.ok)return limit;
    const data=await body(request), b=brief(data.brief);
    if(data.policyVersion!==POLICY_VERSION)throw fault('이용·개인정보·환불 안내에 동의해주세요.');
    const id='logo_'+crypto.randomUUID().replaceAll('-',''),token=crypto.randomUUID()+crypto.randomUUID();
    const order=env.ORDERS.get(env.ORDERS.idFromName(id));
    await order.fetch(new Request('https://internal/init',{method:'POST',body:JSON.stringify({id,tokenHash:await hash(token),brief:b,policyVersion:POLICY_VERSION})}));
    return json({id,token,amount:PRICE});
   }
   const match=route.match(/^orders\/(logo_[a-f0-9]{32})(?:\/(confirm|generate|refund|reconcile))?$/);
   if(!match || request.method!==(match[2]?'POST':'GET'))throw fault('찾을 수 없는 요청입니다.',404);
   const token=request.headers.get('authorization')?.replace(/^Bearer /,'');if(!token)throw fault('주문 접근 정보가 필요합니다.',401);
   const headers=new Headers({'x-token-hash':await hash(token),'content-type':'application/json'});
   const action=match[2]||'status';
   return await env.ORDERS.get(env.ORDERS.idFromName(match[1])).fetch(new Request('https://internal/'+action,{method:request.method,headers,...(request.method==='POST'?{body:JSON.stringify(await body(request))}:{})}));
  }catch(e){return json({error:e.status?e.message:'잠시 후 다시 시도해주세요.'},e.status||500);}
 }
};
export class LogoOrder {
 constructor(ctx,env){this.ctx=ctx;this.storage=ctx.storage;this.env=env;}
 async fetch(request){try{return await this.handle(request);}catch(e){return json({error:e.status?e.message:'주문 처리 중 문제가 생겼습니다. 주문번호를 보관하고 문의해주세요.'},e.status||500);}}
 async alarm(){if(await this.storage.get('rate')){await this.storage.deleteAll();return;}const o=await this.storage.get('order');if(o?.status==='pending'&&Date.now()-o.createdAt>=7*86400000){await this.storage.deleteAll();return;}await this.expire();}
 async expire(){
  const order=await this.storage.get('order');if(!order)return;
  if(order.recordExpiresAt&&Date.now()>=order.recordExpiresAt){await this.storage.deleteAll();return;}
  if(!order.expiresAt||Date.now()<order.expiresAt)return;
  // Remove generated assets even if the customer never returns.
  for(const r of order.results)for(let i=0;i<r.chunks;i++)await this.storage.delete(`${r.id}:${i}`);
  order.results=[];order.jobs={};delete order.brief;order.assetsExpired=true;await this.storage.put('order',order);if(order.recordExpiresAt)await this.storage.setAlarm(order.recordExpiresAt);
 }
 async handle(request){
  const action=new URL(request.url).pathname;
  if(action==='/rate'){
   const allowed=await this.storage.transaction(async tx=>{const now=Date.now(),old=await tx.get('rate');const r=old&&now-old.at<3600000?old:{at:now,count:0};r.count++;await tx.put('rate',r);return r.count<=10;});await this.storage.setAlarm(Date.now()+3600000);return allowed?json({ok:true}):json({error:'잠시 후 다시 시도해주세요.'},429);
  }
  if(action==='/init'){if(await this.storage.get('order'))throw fault('이미 존재하는 주문입니다.',409);const data=await request.json();await this.storage.put('order',{...data,status:'pending',createdAt:Date.now(),remaining:LIMIT,attempts:0,results:[],jobs:{}});await this.storage.setAlarm(Date.now()+7*86400000);return json({ok:true});}
  await this.expire();
  let order=await this.storage.get('order');if(!order||request.headers.get('x-token-hash')!==order.tokenHash)throw fault('주문을 찾을 수 없습니다.',404);
  if(action==='/status'){
   const results=[];for(const r of order.results){let svg='';for(let i=0;i<r.chunks;i++)svg+=await this.storage.get(`${r.id}:${i}`)||'';results.push({id:r.id,svg});}
   return json({id:order.id,status:order.status,remaining:order.remaining,processing:Object.values(order.jobs).some(j=>j.state==='processing'),expiresAt:order.expiresAt||null,expired:!!order.assetsExpired,canRefund:order.status==='paid'&&order.attempts===0,results});
  }
  const data=await body(request);
  if(action==='/reconcile'){
   if(order.status==='paid'||order.status==='refunded')return json({status:order.status});
   const r=await fetch('https://api.tosspayments.com/v1/payments/orders/'+encodeURIComponent(order.id),{headers:{authorization:'Basic '+btoa(this.env.TOSS_SECRET_KEY+':')},signal:AbortSignal.timeout(20000)});
   if(r.status===404)return json({status:order.status});
   if(!r.ok)throw fault('결제 상태 확인에 실패했습니다. 새 결제 없이 다시 확인해주세요.',502);
   const p=await r.json();
   if(p.orderId!==order.id||p.totalAmount!==PRICE||p.currency!=='KRW')throw fault('주문과 결제 정보가 다릅니다.',409);
   if(['DONE','IN_PROGRESS'].includes(p.status))return this.handle(new Request('https://internal/confirm',{method:'POST',headers:request.headers,body:JSON.stringify({orderId:order.id,amount:PRICE,paymentKey:p.paymentKey})}));
   return json({status:order.status});
  }
  if(action==='/confirm'){
   if(data.orderId!==order.id||data.amount!==PRICE||typeof data.paymentKey!=='string'||data.paymentKey.length>250)throw fault('결제 정보를 확인할 수 없습니다.');
   if(order.status==='paid')return json({paid:true});
   if(order.status!=='pending'&&order.status!=='confirming')throw fault('결제할 수 없는 주문입니다.',409);
   if(!ready(this.env))throw fault('결제 확인 연결을 준비 중입니다.',503);
   // Store the key first; a retry uses the same provider idempotency key.
   if(order.paymentKey&&order.paymentKey!==data.paymentKey)throw fault('기존 결제를 확인해주세요.',409);
   await this.storage.transaction(async tx=>{const current=await tx.get('order');if(!['pending','confirming'].includes(current.status))throw fault('주문 상태가 바뀌었습니다. 다시 불러와주세요.',409);if(current.paymentKey&&current.paymentKey!==data.paymentKey)throw fault('기존 결제를 확인해주세요.',409);current.status='confirming';current.paymentKey=data.paymentKey;await tx.put('order',current);});
   const response=await fetch('https://api.tosspayments.com/v1/payments/confirm',{method:'POST',headers:{authorization:'Basic '+btoa(this.env.TOSS_SECRET_KEY+':'),'content-type':'application/json','Idempotency-Key':order.id},body:JSON.stringify({paymentKey:data.paymentKey,orderId:order.id,amount:PRICE}),signal:AbortSignal.timeout(20000)});
   let payment=await response.json();
   if(!response.ok)payment=await this.lookup(data.paymentKey);
   this.checkPayment(payment,order);
   const expiresAt=await this.storage.transaction(async tx=>{const current=await tx.get('order');if(current.status==='paid')return current.expiresAt;if(current.status!=='confirming')throw fault('주문 상태가 바뀌었습니다. 다시 확인해주세요.',409);current.status='paid';current.paidAt=Date.now();current.expiresAt=current.paidAt+ASSET_TTL;current.recordExpiresAt=new Date(new Date(current.paidAt).setUTCFullYear(new Date(current.paidAt).getUTCFullYear()+5)).getTime();await tx.put('order',current);return current.expiresAt;});await this.storage.setAlarm(expiresAt);return json({paid:true});
  }
  if(action==='/refund'){
   if(order.status==='refunded')return json({refunded:true});
   await this.storage.transaction(async tx=>{const o=await tx.get('order');if(!['paid','refunding'].includes(o.status)||o.attempts!==0)throw fault('생성을 시작한 주문은 고객센터로 환불을 요청해주세요.',409);o.status='refunding';await tx.put('order',o);});
   const payment=await this.lookup(order.paymentKey);
   if(payment.status!=='CANCELED'){
    this.checkPayment(payment,order);
    const r=await fetch('https://api.tosspayments.com/v1/payments/'+encodeURIComponent(order.paymentKey)+'/cancel',{method:'POST',headers:{authorization:'Basic '+btoa(this.env.TOSS_SECRET_KEY+':'),'content-type':'application/json','Idempotency-Key':order.id+'-refund'},body:JSON.stringify({cancelReason:'고객 요청: 생성 시작 전 전액 환불'}),signal:AbortSignal.timeout(20000)});
    if(!r.ok)throw fault('환불 상태를 확인 중입니다. 다시 확인하거나 고객센터로 문의해주세요.',502);
   }
   const canceled=await this.lookup(order.paymentKey);
   if(canceled.orderId!==order.id||canceled.status!=='CANCELED'||canceled.balanceAmount!==0)throw fault('환불 확인이 필요합니다.',502);
   const current=await this.storage.get('order');current.status='refunded';current.remaining=0;current.refundedAt=Date.now();await this.storage.put('order',current);return json({refunded:true});
  }
  if(action==='/generate'){
   if(!ready(this.env))throw fault('맞춤 생성 연결을 준비 중입니다.',503);
   if(!/^[a-f0-9-]{36}$/.test(data.requestId||''))throw fault('요청 식별자가 필요합니다.');
   if(order.assetsExpired)throw fault('생성·다운로드 기간이 지났습니다. 미사용 수량은 고객센터로 문의해주세요.',410);
   if(order.status!=='paid')throw fault('결제 확인 후 생성할 수 있습니다.',402);
   const existing=order.jobs[data.requestId];if(existing)return json({state:existing.state,id:data.requestId},existing.state==='processing'?202:200);
   // Cancelled/refunded payments never grant new generations.
   this.checkPayment(await this.lookup(order.paymentKey),order);
   const b=brief(data.brief||order.brief);
   const reserved=await this.storage.transaction(async tx=>{
    const current=await tx.get('order');
    if(current.status!=='paid'||current.assetsExpired||(current.expiresAt&&current.expiresAt-Date.now()<120000))throw fault('현재 주문에서는 생성할 수 없습니다.',409);
    if(current.jobs[data.requestId])return false;
    if(current.remaining<=0)throw fault('제공 시안을 모두 사용했습니다.',409);
    if(current.attempts>=12)throw fault('오류가 반복되어 생성을 멈췄습니다. 주문번호와 함께 문의해주세요.',409);
    if(Object.values(current.jobs).some(j=>j.state==='processing'))throw fault('이전 시안이 생성 중입니다. 잠시 뒤 주문을 다시 불러와주세요.',409);
    current.remaining--;current.attempts++;current.jobs[data.requestId]={state:'processing',at:Date.now()};await tx.put('order',current);return true;
   });
   if(!reserved)return json({state:'processing'},202);
   let svg;
   try{
    const rgb=b.color.match(/\w\w/g).map(c=>parseInt(c,16));
    const response=await fetch('https://external.api.recraft.ai/v1/images/generations',{method:'POST',headers:{authorization:'Bearer '+this.env.RECRAFT_API_TOKEN,'content-type':'application/json'},body:JSON.stringify({model:'recraftv4_1_vector',prompt:`Design one original ${b.mood} vector logo symbol for a brand called ${b.name}. Business: ${b.business}. Follow any explicitly requested letters, numbers, or symbols in the business description exactly: they are the logo itself and must remain immediately legible, including the correct alphabet and letter case. Preserve their recognizable structure instead of replacing them with an abstract shape or similar-looking character. Otherwise create a pictorial symbol without lettering. Do not add unrequested words or the brand name. Center one isolated mark at a prominent size with moderate clear margin, flat simple geometry, high contrast, no mockup, no photograph.`,n:1,size:'1024x1024',response_format:'b64_json',controls:{colors:[{rgb}]}}),signal:AbortSignal.timeout(90000)});
    if(!response.ok)throw fault('생성에 실패했습니다. 시안 수량은 복원했습니다. 잠시 뒤 다시 시도해주세요.',502);
    const payload=await response.json(),encoded=payload.data?.[0]?.b64_json;
    if(typeof encoded!=='string'||encoded.length>1400000)throw fault('생성 파일을 읽지 못했습니다. 시안 수량은 복원했습니다.',502);
    svg=new TextDecoder().decode(Uint8Array.from(atob(encoded),c=>c.charCodeAt(0)));
    if(!svg.includes('<svg')||svg.length>900000)throw fault('벡터 출력 형식이 올바르지 않습니다.',502);
    const chunks=Math.ceil(svg.length/30000);for(let i=0;i<chunks;i++)await this.storage.put(`${data.requestId}:${i}`,svg.slice(i*30000,(i+1)*30000));
    await this.storage.transaction(async tx=>{const current=await tx.get('order');current.jobs[data.requestId].state='done';current.results.push({id:data.requestId,chunks});await tx.put('order',current);});
    return json({state:'done',id:data.requestId});
   }catch(e){
    await this.storage.transaction(async tx=>{const current=await tx.get('order');current.jobs[data.requestId].state='failed';current.remaining++;await tx.put('order',current);});
    throw e.status?e:fault('생성이 지연되거나 연결이 끊겼습니다. 시안 수량은 복원했습니다. 잠시 뒤 다시 시도해주세요.',502);
   }
  }
  throw fault('지원하지 않는 요청입니다.',404);
 }
 async lookup(key){const response=await fetch('https://api.tosspayments.com/v1/payments/'+encodeURIComponent(key),{headers:{authorization:'Basic '+btoa(this.env.TOSS_SECRET_KEY+':')},signal:AbortSignal.timeout(20000)});if(!response.ok)throw fault('결제 상태를 확인하지 못했습니다. 새 결제 없이 다시 시도해주세요.',502);return response.json();}
 checkPayment(p,o){if(p.status!=='DONE'||p.orderId!==o.id||p.totalAmount!==PRICE||p.balanceAmount!==PRICE||p.currency!=='KRW')throw fault('유효한 결제 상태가 아닙니다. 주문번호로 문의해주세요.',402);}
}
