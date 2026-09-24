const $ = selector => document.querySelector(selector);
let catalog, me=null, category='portrait', queue=[], busy=false, mode='register';
async function api(path,options={}) {
  const response=await fetch(path,options);
  const data=await response.json();
  if(!response.ok) throw Object.assign(new Error(data.error??'요청에 실패했습니다.'),{status:response.status});
  return data;
}
const json = body => ({method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
function element(tag,cls,text) { const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node; }
function setStatus(message) { $('#status').textContent=message; }
function renderCategory() {
  for(const button of $('#categories').children) button.setAttribute('aria-pressed',String(button.dataset.category===category));
  const chosen=catalog.categories[category];$('#category-title').textContent=chosen.name;$('#category-description').textContent=chosen.description;
  $('#preset').replaceChildren(...Object.entries(chosen.presets).map(([value,label])=>{const option=element('option','',label);option.value=value;return option;}));
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
  $('#estimate').textContent=count?`${count}장 · 총 ${count}크레딧 사용${me?` / 잔여 ${me.credits}크레딧`:''}`:'사진을 선택하면 사용할 크레딧을 알려드려요.';
  $('#process').disabled=busy || !count || (me && me.credits<count);
  $('#process').textContent=busy?'사진을 다듬고 있어요…':!me?'로그인하고 보정하기':count && me.credits<count?'크레딧이 부족해요':`${count || ''}${count?'장 ':''}보정하기`;
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
  $('#account-button').textContent=me?'내 계정':'로그인 / 시작하기';renderQueue();renderResults();
}
function renderResults() {
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
    const again=element('button','text-button','다시 보정 · 1크레딧');again.disabled=busy;again.onclick=async()=>{try{const response=await fetch(`/api/jobs/${job.id}/original`);if(!response.ok)throw new Error('사진을 불러오지 못했습니다.');addFiles([new File([await response.blob()],`사진결-${job.id.slice(0,8)}.png`,{type:'image/png'})]);$('#studio').scrollIntoView();}catch(e){setStatus(e.message);}};
    const remove=element('button','text-button danger','삭제');remove.disabled=busy;remove.onclick=async()=>{if(!confirm('비교용 사진과 결과를 삭제할까요? 삭제하면 되돌릴 수 없습니다.'))return;try{await api(`/api/jobs/${job.id}`,{method:'DELETE'});await refresh();setStatus('사진을 삭제했습니다.');}catch(e){setStatus(e.message);}};
    actions.append(download,again,remove);card.append(top,compare,label,slider,actions);return card;
  }));
}
function openAccount() {
  $('#auth-fields').hidden=!!me;$('#account-actions').hidden=!me;$('#auth-title').textContent=me?'내 계정':mode==='register'?'사진결 시작하기':'다시 만나 반가워요';
  $('#auth-description').textContent=me?`${me.username} · 잔여 ${me.credits}크레딧`:'계정당 최초 3크레딧 · 카드 등록 없이 체험하세요.';
  $('#auth-submit').textContent=mode==='register'?'무료 3장으로 시작하기':'로그인';$('#toggle-auth').textContent=mode==='register'?'이미 계정이 있어요 · 로그인':'처음이에요 · 계정 만들기';$('#password').autocomplete=mode==='register'?'new-password':'current-password';$('#auth-status').textContent='';
  if(!$('#account-dialog').open)$('#account-dialog').showModal();
}
async function init() {
  catalog=await api('/api/catalog');
  for(const [id,value] of Object.entries(catalog.categories)){
    const button=element('button','category');button.dataset.category=id;button.append(element('strong','',value.name),element('span','',value.description));button.onclick=()=>{category=id;renderCategory();};$('#categories').append(button);
  }
  for(const plan of catalog.plans){
    const card=element('article','plan'),price=element('div','price',plan.price.toLocaleString('ko-KR'));price.append(element('small','',' 원'));
    card.append(element('h3','',plan.name),price,element('p','',`${plan.credits}크레딧 · ${plan.period}`),element('p','',plan.id==='pro'?'일괄 보정 · 스타일 저장 예정':'세 카테고리 공통 사용'));
    const action=element('button',plan.id==='free'?'primary':'small',plan.id==='free'?'무료로 시작하기':'유료 이용 준비 중');action.disabled=plan.id!=='free';action.onclick=()=>{if(me)$('#studio').scrollIntoView();else openAccount();};card.append(action);$('#plans').append(card);
  }
  renderCategory();await refresh();
  $('#files').onchange=event=>addFiles(event.target.files);
  $('#dropzone').ondragover=event=>{event.preventDefault();$('#dropzone').classList.add('dragging');};
  $('#dropzone').ondragleave=()=>$('#dropzone').classList.remove('dragging');
  $('#dropzone').ondrop=event=>{event.preventDefault();$('#dropzone').classList.remove('dragging');addFiles(event.dataTransfer.files);};
  $('#strength').oninput=event=>{$('#strength-value').value=`${event.target.value}%`;};
  $('#account-button').onclick=openAccount;$('#close-dialog').onclick=()=>$('#account-dialog').close();$('#toggle-auth').onclick=()=>{mode=mode==='register'?'login':'register';openAccount();};
  $('#auth-form').onsubmit=async event=>{event.preventDefault();$('#auth-submit').disabled=true;try{await api(`/api/${mode}`,json({username:$('#username').value,password:$('#password').value}));$('#password').value='';$('#account-dialog').close();await refresh();setStatus('로그인했습니다. 사진을 선택하고 보정해보세요.');}catch(e){$('#auth-status').textContent=e.message;}finally{$('#auth-submit').disabled=false;}};
  $('#logout').onclick=async()=>{try{await api('/api/logout',{method:'POST'});clearQueue();$('#account-dialog').close();await refresh();}catch(e){$('#auth-status').textContent=e.message;}};
  $('#delete-account').onclick=async()=>{if(!confirm('계정·잔여 무료 크레딧·모든 사진을 영구 삭제할까요?'))return;try{await api('/api/account',{method:'DELETE'});clearQueue();$('#account-dialog').close();await refresh();setStatus('계정과 사진을 삭제했습니다.');}catch(e){$('#auth-status').textContent=e.message;}};
  $('#download-all').onclick=()=>{location.href='/api/download.zip?ids='+(me?.jobs??[]).filter(job=>job.status==='done').map(job=>job.id).join(',');};
  $('#process').onclick=async()=>{
    if(!me){openAccount();return;}
    busy=true;renderQueue();renderResults();let completed=0;
    const options={category,preset:$('#preset').value,strength:Number($('#strength').value)};
    for(const item of queue.filter(item=>!item.done)){
      const optionKey=JSON.stringify(options);
      if(item.optionKey && item.optionKey!==optionKey)item.key=crypto.randomUUID();item.optionKey=optionKey;
      item.message='보정 중';renderQueue();
      try{
        const query=new URLSearchParams(options);
        const result=await api(`/api/jobs?${query}`,{method:'POST',headers:{'Content-Type':item.file.type,'Idempotency-Key':item.key},body:item.file});
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
init().catch(error=>setStatus(`앱을 불러오지 못했습니다. ${error.message}`));
