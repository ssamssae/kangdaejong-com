import { fault } from './wallet.mjs';
export function createToss({secretKey,clientKey,fetcher=fetch}) {
  if(!secretKey?.startsWith('test_sk_')||!clientKey?.startsWith('test_ck_'))throw new Error('Only explicitly configured Toss test keys are supported in this release.');
  async function call(path,{method='GET',body,key}={}) {
    let response;
    try { response=await fetcher(`https://api.tosspayments.com${path}`,{method,headers:{Authorization:`Basic ${Buffer.from(secretKey+':').toString('base64')}`,'Content-Type':'application/json',...(key?{'Idempotency-Key':key}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(20_000),redirect:'error'}); }
    catch {throw fault(503,'결제 처리 결과를 확인 중입니다. 같은 주문에서 다시 확인해주세요.');}
    let data;try{data=await response.json();}catch{throw fault(503,'결제 응답을 확인할 수 없습니다.');}
    if(!response.ok)throw Object.assign(fault(response.status>=500?503:400,'결제사가 요청을 완료하지 못했습니다. 주문 상태를 다시 확인해주세요.'),{providerCode:data.code});
    return data;
  }
  return {clientKey,mode:'test',
    confirm:order=>call('/v1/payments/confirm',{method:'POST',body:{paymentKey:order.payment_key,orderId:order.id,amount:order.amount},key:`confirm-${order.id}`}),
    lookup:order=>call(`/v1/payments/orders/${encodeURIComponent(order.id)}`),
    cancel:order=>call(`/v1/payments/${encodeURIComponent(order.payment_key)}/cancel`,{method:'POST',body:{cancelReason:'미사용 크레딧 전액 환불',cancelAmount:order.amount,refundableAmount:order.amount},key:`refund-${order.id}`}),
    issue:({authKey,customerKey,id})=>call('/v1/billing/authorizations/issue',{method:'POST',body:{authKey,customerKey},key:`issue-${id}`}),
    charge:(order,billingKey)=>call(`/v1/billing/${encodeURIComponent(billingKey)}`,{method:'POST',body:{customerKey:order.user_id,amount:order.amount,orderId:order.id,orderName:'사진결 프로 월 구독'},key:`charge-${order.id}`}),
  };
}
