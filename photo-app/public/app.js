const $ = selector => document.querySelector(selector);
let catalog, me=null, category='portrait', queue=[], busy=false, mode='register',resetToken=null;
async function api(path,options={}) {
  const response=await fetch(path,options);
  const data=await response.json();
  if(!response.ok) throw Object.assign(new Error(data.error??'요청에 실패했습니다.'),{status:response.status});
  return data;
}
const json = body => ({method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
function element(tag,cls,text) { const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node; }
function setStatus(message) { $('#status').textContent=message; }
function unitCost(){return catalog?.edits?.[category]?.[$('#edit-mode').value]?.cost??1;}
function renderCategory() {
  for(const button of $('#categories').children) button.setAttribute('aria-pressed',String(button.dataset.category===category));
  const chosen=catalog.categories[category];$('#category-title').textContent=chosen.name;$('#category-description').textContent=chosen.description;
  $('#preset').replaceChildren(...Object.entries(chosen.presets).map(([value,label])=>{const option=element('option','',label);option.value=value;return option;}));
  $('#edit-mode').replaceChildren(new Option('기본 밝기·색감',''),...Object.entries(catalog.edits?.[category]??{}).map(([id,edit])=>{const option=new Option(`${edit.name} · ${edit.cost}크레딧${catalog.generatedEditingEnabled?'':' · 준비 중'}`,id);option.disabled=!catalog.generatedEditingEnabled;return option;}));$('#ai-consent-label').hidden=true;$('#ai-consent').checked=false;
  $('#preservation').textContent={portrait:'얼굴 형태와 피부 질감을 바꾸지 않는 밝기·색감 보정입니다.',product:'상품 형태·로고를 유지합니다. 판매용 색상은 원본과 직접 비교해주세요.',space:'재료·양·공간 구조를 바꾸지 않는 밝기·색감 보정입니다.'}[category];
}
function renderQueue() {
  $('#queue').replaceChildren(...queue.map((item,index)=>{
    const row=element('li'),image=element('img');image.src=item.preview;image.alt='';
    const name=element('span','',`${item.file.name} · ${(item.file.size/1024/1024).toFixed(1)}MB${item.message?' · '+item.message:''}`);
    const remove=element('button','', '빼기');remove.disabled=busy;remove.setAttribute('aria-label',`${item.file.name} 빼기`);remove.onclick=()=>{URL.revokeObjectURL(item.preview);queue.splice(index,1);renderQueue();};
    row.append(image,name,remove);return row;
  }));
  const count=queue.filter(item=>!item.done).length;
  $('#estimate').textContent=count?`${count}장 · 총 ${count*unitCost()}크레딧 사용${me?` / 잔여 ${me.credits}크레딧`:''}`:'사진을 선택하면 사용할 크레딧을 알려드려요.';
  $('#process').disabled=busy || !count || (me && me.credits<count*unitCost());
  $('#process').textContent=busy?'사진을 다듬고 있어요…':!me?'로그인하고 보정하기':count && me.credits<count*unitCost()?'크레딧이 부족해요':`${count || ''}${count?'장 ':''}보정하기`;
  $('#edit-mode').disabled=busy;$('#saved-style').disabled=busy;$('#save-style').disabled=busy;$('#cost-label').textContent=`${$('#edit-mode').value?'AI 편집':'기본 보정'} · 장당 ${unitCost()}크레딧`;
  $('#files').disabled=busy;$('#preset').disabled=busy;$('#strength').disabled=busy;
  for(const button of $('#categories').children)button.disabled=busy;
}
function clearQueue() { for(const item of queue)URL.revokeObjectURL(item.preview);queue=[]; }
function addFiles(files) {
  if(busy)return;
  const messages=[];
  for(const file of files) {
    if(queue.length>=10){messages.push('한 번에 최대 10장까지 선택할 수 있어요.');break;}
    if(!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size>catalog.maxBytes || !file.size){messages.push(`${file.name}: JPG·PNG·WebP, 10MB 이하 파일을 선택해주세요.`);continue;}
    queue.push({file,preview:URL.createObjectURL(file),key:crypto.randomUUID(),done:false});
  }
  $('#files').value='';setStatus(messages.join(' '));renderQueue();
}
async function refresh() {
  try{me=await api('/api/me');}catch(e){if(e.status!==401)throw e;me=null;}
  $('#balance').textContent=me?`${me.username} · ${me.credits}크레딧`:'가입하면 무료 3크레딧';
  $('#account-button').textContent=me?'내 계정':'로그인 / 시작하기';renderQueue();renderResults();renderCommerce();renderStyles();
  $('#verify-banner').hidden=!me?.emailRequired||me.emailVerified;
}
function renderResults() {
  $('#pending-results').replaceChildren(...(me?.jobs??[]).filter(job=>job.status==='external_pending').map(job=>{const row=element('div','notice','AI 보정 결과 확인 중 · 크레딧 예약됨 '),button=element('button','small','결과 다시 확인');button.onclick=async()=>{try{const result=await api(`/api/jobs/${job.id}/refresh`,{method:'POST'});await refresh();setStatus(result.job.needsReview?'공급자 접수 여부가 불명확해 자동 재요청하지 않습니다. 운영자 확인이 필요합니다.':result.job.status==='done'?'AI 보정을 완료했습니다.':'아직 처리 중입니다. 잠시 후 다시 확인해주세요.');}catch(e){setStatus(e.message);await refresh();}};row.append(button);return row;}));
  const jobs=(me?.jobs??[]).filter(job=>job.status==='done');$('#results-section').hidden=!jobs.length;
  $('#download-all').disabled=!jobs.length || jobs.length>20;
  $('#results').replaceChildren(...jobs.map(job=>{
    const card=element('article','result-card'),top=element('div','result-top');
    top.append(element('strong','',`${catalog.categories[job.category].name} · ${catalog.categories[job.category].presets[job.preset]}`),element('span','',`${job.width}×${job.height} · ${new Date(job.expires).toLocaleDateString('ko-KR')}까지`));
    const compare=element('div','compare'),after=element('img'),before=element('img','before');
    after.src=`/api/jobs/${job.id}/output`;after.alt='보정 결과';before.src=`/api/jobs/${job.id}/original`;before.alt='보정 전 사진';
    const tags=element('div','compare-tags');tags.append(element('span','','보정 전'),element('span','','보정 후'));compare.append(after,before,tags);
    const label=element('label','','전후 비교'),slider=element('input');slider.type='range';slider.min='0';slider.max='100';slider.value='50';slider.id=`compare-${job.id}`;label.htmlFor=slider.id;slider.oninput=()=>{before.style.clipPath=`inset(0 ${100-Number(slider.value)}% 0 0)`;after.style.clipPath=`inset(0 0 0 ${Number(slider.value)}%)`;};
    const actions=element('div','result-actions'),download=element('a','','PNG 다운로드');download.href=`/api/jobs/${job.id}/output?download=1`;download.download='';
    const again=element('button','text-button','다시 보정할 사진으로 선택');again.disabled=busy;again.onclick=async()=>{try{const response=await fetch(`/api/jobs/${job.id}/original`);if(!response.ok)throw new Error('사진을 불러오지 못했습니다.');addFiles([new File([await response.blob()],`사진꾸러미-${job.id.slice(0,8)}.png`,{type:'image/png'})]);$('#studio').scrollIntoView();}catch(e){setStatus(e.message);}};
    const remove=element('button','text-button danger','삭제');remove.disabled=busy;remove.onclick=async()=>{if(!confirm('비교용 사진과 결과를 삭제할까요? 삭제하면 되돌릴 수 없습니다.'))return;try{await api(`/api/jobs/${job.id}`,{method:'DELETE'});await refresh();setStatus('사진을 삭제했습니다.');}catch(e){setStatus(e.message);}};
    actions.append(download,again,remove);card.append(top,compare,label,slider,actions);return card;
  }));
}
function openAccount() {
  $('#auth-fields').hidden=!!me;$('#account-actions').hidden=!me;$('#auth-title').textContent=me?'내 계정':mode==='register'?'사진꾸러미 시작하기':'다시 만나 반가워요';
  $('#auth-description').textContent=me?`${me.username} · 잔여 ${me.credits}크레딧`:'계정당 최초 3크레딧 · 카드 등록 없이 체험하세요.';
  $('#email-field').hidden=!catalog.emailRequired||mode!=='register';$('#email').required=catalog.emailRequired&&mode==='register';$('#forgot-password').hidden=!catalog.emailRequired;
  $('#password-help').textContent=catalog.emailRequired?'이메일 인증으로 계정을 확인하고 비밀번호를 복구할 수 있습니다.':'다른 곳에서 쓰지 않는 비밀번호를 안전하게 보관해주세요. 이 로컬 모드에서는 이메일 복구를 제공하지 않습니다.';
  $('#auth-submit').textContent=mode==='register'?'무료 3장으로 시작하기':'로그인';$('#toggle-auth').textContent=mode==='register'?'이미 계정이 있어요 · 로그인':'처음이에요 · 계정 만들기';$('#password').autocomplete=mode==='register'?'new-password':'current-password';$('#auth-status').textContent='';
  if(!$('#account-dialog').open)$('#account-dialog').showModal();
}
async function init() {
  const callback=new URLSearchParams(location.search),fragment=new URLSearchParams(location.hash.slice(1));
  if(callback.has('paymentKey')||callback.has('authKey')||fragment.has('verify')||fragment.has('reset'))history.replaceState(null,'','/');
  catalog=await api('/api/catalog');
  if(catalog.salesEnabled)$('#pricing-note').textContent='테스트 결제 모드입니다. 실제 금액은 청구되지 않습니다. 충전 크레딧은 365일, 프로 크레딧은 다음 결제일까지 사용합니다. 미사용 구매 건만 자동 전액 환불하며, 사용한 이용권은 별도 확인합니다.';
  if(catalog.generatedEditingEnabled)$('#processing-privacy').textContent='기본 보정은 이 앱의 서버에서 처리합니다. AI 편집을 선택하면 별도 동의 후 비교용 사진을 fal에 전송합니다. 앱 내 사진은 7일 후 삭제되며 외부 보관 조건은 공급자 정책을 따릅니다. 결과의 얼굴·상품·공간과 색상을 확인해주세요.';
  for(const [id,value] of Object.entries(catalog.categories)){
    const button=element('button','category');button.dataset.category=id;button.append(element('strong','',value.name),element('span','',value.description));button.onclick=()=>{category=id;renderCategory();renderQueue();};$('#categories').append(button);
  }
  for(const plan of catalog.plans){
    const card=element('article','plan'),price=element('div','price',plan.price.toLocaleString('ko-KR'));price.append(element('small','',' 원'));
    card.append(element('h3','',plan.name),price,element('p','',`${plan.credits}크레딧 · ${plan.period}`),element('p','',plan.id==='pro'?'일괄 보정 · 스타일 저장':'세 카테고리 공통 사용'));
    const action=element('button',plan.id==='free'?'primary':'small',plan.id==='free'?'무료로 시작하기':catalog.salesEnabled?(plan.id==='pack'?'테스트 충전하기':'테스트 구독 시작'):'유료 이용 준비 중');action.disabled=plan.id!=='free'&&!catalog.salesEnabled;action.onclick=async()=>{if(!me){openAccount();return;}if(plan.id==='free'){$('#studio').scrollIntoView();return;}action.disabled=true;try{await checkout(plan);}catch(e){setStatus(e.message);}finally{action.disabled=false;}};card.append(action);$('#plans').append(card);
  }
  renderCategory();await refresh();
  if(fragment.has('verify')){try{await api('/api/verify-email',json({token:fragment.get('verify')}));await refresh();setStatus('이메일 확인 완료. 무료 크레딧을 확인해주세요.');}catch(e){setStatus(e.message);}}
  if(fragment.has('reset')){resetToken=fragment.get('reset');openRecovery();}
  if(callback.has('paymentKey')){try{await api('/api/billing/confirm',json({orderId:callback.get('orderId'),paymentKey:callback.get('paymentKey')}));await refresh();setStatus('테스트 결제를 확인하고 크레딧을 지급했습니다.');}catch(e){setStatus(e.message);}}
  if(callback.has('authKey')){try{await api('/api/subscription/authorize',json({authKey:callback.get('authKey'),customerKey:callback.get('customerKey')}));await refresh();setStatus('테스트 구독이 시작되었습니다.');}catch(e){setStatus(e.message);}}
  $('#resend-email').onclick=async()=>{try{await api('/api/verify-email/resend',{method:'POST'});setStatus('인증 메일을 요청했습니다. 받은편지함을 확인해주세요.');}catch(e){setStatus(e.message);}};
  $('#save-style').onclick=async()=>{if(!me){openAccount();return;}const name=prompt('저장할 스타일 이름을 입력해주세요.');if(!name)return;try{await api('/api/styles',json({name,category,preset:$('#preset').value,strength:Number($('#strength').value)}));await refresh();setStatus('스타일을 저장했습니다.');}catch(e){setStatus(e.message);}};
  $('#saved-style').onchange=event=>{const style=me?.styles.find(s=>s.id===event.target.value);if(!style)return;category=style.category;renderCategory();$('#preset').value=style.preset;$('#strength').value=style.strength;$('#strength-value').value=`${style.strength}%`;renderQueue();};
  $('#edit-mode').onchange=()=>{$('#ai-consent-label').hidden=!$('#edit-mode').value;$('#ai-consent').checked=false;renderQueue();};
  $('#forgot-password').onclick=()=>{$('#account-dialog').close();resetToken=null;openRecovery();};$('#close-recovery').onclick=()=>$('#recovery-dialog').close();
  $('#recovery-form').onsubmit=async event=>{event.preventDefault();try{if(resetToken){await api('/api/password/reset',json({token:resetToken,password:$('#recovery-password').value}));resetToken=null;$('#recovery-password').value='';$('#recovery-dialog').close();await refresh();setStatus('비밀번호를 변경했습니다. 다시 로그인해주세요.');}else{await api('/api/password/request',json({email:$('#recovery-email').value}));$('#recovery-status').textContent='등록된 이메일이라면 복구 메일을 보냈습니다.';}}catch(e){$('#recovery-status').textContent=e.message;}};
  $('#cancel-subscription').onclick=async()=>{if(!confirm('다음 달부터 자동 결제를 중단할까요? 남은 기간의 크레딧은 만료일까지 사용할 수 있습니다.'))return;try{await api('/api/subscription/cancel',{method:'POST'});await refresh();}catch(e){setStatus(e.message);}};
  $('#files').onchange=event=>addFiles(event.target.files);
  $('#dropzone').ondragover=event=>{event.preventDefault();$('#dropzone').classList.add('dragging');};
  $('#dropzone').ondragleave=()=>$('#dropzone').classList.remove('dragging');
  $('#dropzone').ondrop=event=>{event.preventDefault();$('#dropzone').classList.remove('dragging');addFiles(event.dataTransfer.files);};
  $('#strength').oninput=event=>{$('#strength-value').value=`${event.target.value}%`;};
  $('#account-button').onclick=openAccount;$('#close-dialog').onclick=()=>$('#account-dialog').close();$('#toggle-auth').onclick=()=>{mode=mode==='register'?'login':'register';openAccount();};
  $('#auth-form').onsubmit=async event=>{event.preventDefault();$('#auth-submit').disabled=true;try{await api(`/api/${mode}`,json({username:$('#username').value,password:$('#password').value,email:$('#email').value}));$('#password').value='';$('#account-dialog').close();await refresh();setStatus(me?.emailRequired&&!me.emailVerified?'이메일을 확인해주세요. 전송에 문제가 있으면 인증 메일을 다시 요청할 수 있습니다.':'로그인했습니다. 사진을 선택하고 보정해보세요.');}catch(e){$('#auth-status').textContent=e.message;}finally{$('#auth-submit').disabled=false;}};
  $('#logout').onclick=async()=>{try{await api('/api/logout',{method:'POST'});clearQueue();$('#account-dialog').close();await refresh();}catch(e){$('#auth-status').textContent=e.message;}};
  $('#delete-account').onclick=async()=>{if(!confirm('계정·잔여 무료 크레딧·모든 사진을 영구 삭제할까요?'))return;try{await api('/api/account',{method:'DELETE'});clearQueue();$('#account-dialog').close();await refresh();setStatus('계정과 사진을 삭제했습니다.');}catch(e){$('#auth-status').textContent=e.message;}};
  $('#download-all').onclick=()=>{location.href='/api/download.zip?ids='+(me?.jobs??[]).filter(job=>job.status==='done').map(job=>job.id).join(',');};
  $('#process').onclick=async()=>{
    if(!me){openAccount();return;}
    if($('#edit-mode').value&&!$('#ai-consent').checked){setStatus('외부 AI 처리에 동의한 뒤 진행해주세요.');return;}
    busy=true;renderQueue();renderResults();let completed=0;
    const options={category,preset:$('#preset').value,strength:Number($('#strength').value),...($('#edit-mode').value?{edit:$('#edit-mode').value}:{})};
    for(const item of queue.filter(item=>!item.done)){
      const optionKey=JSON.stringify(options);
      if(item.optionKey && item.optionKey!==optionKey)item.key=crypto.randomUUID();item.optionKey=optionKey;
      item.message='보정 중';renderQueue();
      try{
        const query=new URLSearchParams(options);
        let result=await api(`/api/jobs?${query}`,{method:'POST',headers:{'Content-Type':item.file.type,'Idempotency-Key':item.key,...(options.edit?{'X-Photo-AI-Consent':'yes'}:{})},body:item.file});
        if(result.job.status==='external_pending'){item.done=true;item.message='AI 처리 중';setStatus('AI 보정이 접수되었습니다. 아래에서 결과를 확인해주세요.');continue;}
        if(result.job.status==='failed'){item.key=crypto.randomUUID();throw new Error('앞선 보정이 실패해 크레딧이 복구되었습니다. 다시 시도해주세요.');}
        if(result.job.status!=='done')throw new Error('처리 상태를 확인 중입니다. 잠시 후 다시 시도해주세요.');
        item.done=true;item.message='완료';completed++;me.credits=result.credits;
      }catch(e){item.message=e.message;if(e.status===400 || e.status===422)item.key=crypto.randomUUID();setStatus(e.message);break;}
    }
    for(const item of queue.filter(item=>item.done))URL.revokeObjectURL(item.preview);queue=queue.filter(item=>!item.done);busy=false;
    try{await refresh();}catch(e){setStatus(e.message);renderQueue();}
    if(completed)setStatus(`${completed}장 보정 완료. 아래에서 비교하고 내려받으세요.${queue.length?' 처리하지 못한 사진은 선택 목록에 남겨두었습니다.':''}`);
  };
}
function renderStyles(){const selected=$('#saved-style').value;$('#saved-style').replaceChildren(new Option('스타일 선택',''),...(me?.styles??[]).map(style=>new Option(style.name,style.id)));$('#saved-style').value=selected;}
function stateLabel(state){return {pending:'결제 대기',confirming:'승인 확인 중',charging:'구독 결제 확인 중',paid:'결제 완료',refunding:'환불 확인 중',canceled:'취소 완료',review:'운영자 확인 필요',active:'이용 중',past_due:'결제 확인 필요',ready:'구독 준비'}[state]??'확인 중';}
function renderCommerce(){const orders=me?.orders??[],sub=me?.subscription;$('#orders-section').hidden=!orders.length&&!sub;$('#cancel-subscription').hidden=!sub||!!sub.cancel_at_end||sub.state==='canceled';$('#subscription-status').textContent=sub?`프로 · ${stateLabel(sub.state)}${sub.cancel_at_end?' · 다음 결제 중단':''}${sub.period_end?' · 이용기간 '+new Date(sub.period_end).toLocaleDateString('ko-KR')+'까지':''}`:'';
  $('#orders').replaceChildren(...orders.map(order=>{const row=element('article','order-row'),text=element('span','',`${order.plan==='pack'?'충전팩':'프로'} · ${order.amount.toLocaleString('ko-KR')}원 · ${stateLabel(order.state)}`);row.append(text);for(const [label,endpoint] of [['결제 다시 확인','reconcile'],...(order.state==='paid'||order.state==='refunding'?[['미사용 전액 환불','refund']]:[])]){const button=element('button','small',label);button.onclick=async()=>{if(endpoint==='refund'&&!confirm('이 구매 건의 크레딧을 사용하지 않았다면 전액 환불합니다. 진행할까요?'))return;button.disabled=true;try{await api(`/api/billing/${endpoint}`,json({orderId:order.id}));await refresh();setStatus('결제 상태를 갱신했습니다.');}catch(e){setStatus(e.message);button.disabled=false;}};row.append(button);}return row;}));}
function openRecovery(){$('#recovery-title').textContent=resetToken?'새 비밀번호 설정':'비밀번호 찾기';$('#recovery-email-field').hidden=!!resetToken;$('#recovery-email').required=!resetToken;$('#recovery-password-field').hidden=!resetToken;$('#recovery-password').required=!!resetToken;$('#recovery-status').textContent='';$('#recovery-dialog').showModal();}
let tossSDK;
async function checkout(plan){if(me.emailRequired&&!me.emailVerified){setStatus('이메일 인증 후 결제할 수 있습니다.');return;}if(!confirm(`${plan.name} ${plan.price.toLocaleString('ko-KR')}원${plan.id==='pro'?' 매월 자동결제':''} 테스트를 진행할까요? 실제 청구는 없습니다.`))return;
  if(!tossSDK)tossSDK=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='https://js.tosspayments.com/v2/standard';script.onload=()=>resolve();script.onerror=()=>{tossSDK=null;reject(new Error('결제창을 불러오지 못했습니다.'));};document.head.append(script);});await tossSDK;
  if(plan.id==='pack'){const order=await api('/api/checkout',json({plan:plan.id,requestKey:crypto.randomUUID()}));await window.TossPayments(order.clientKey).payment({customerKey:order.customerKey}).requestPayment({method:'CARD',amount:{value:order.amount,currency:'KRW'},orderId:order.id,orderName:'사진꾸러미 충전팩',successUrl:location.origin+'/',failUrl:location.origin+'/?paymentFailed=1'});}
  else{const subscription=await api('/api/subscription/start',{method:'POST'});await window.TossPayments(subscription.clientKey).payment({customerKey:subscription.customerKey}).requestBillingAuth({method:'CARD',successUrl:location.origin+'/',failUrl:location.origin+'/?paymentFailed=1'});}
}
init().catch(error=>setStatus(`앱을 불러오지 못했습니다. ${error.message}`));
