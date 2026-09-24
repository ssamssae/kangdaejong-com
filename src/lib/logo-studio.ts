import { samples, wrap, compose, png, save, bundle, cleanSymbol, type Design } from './logo-kit';
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const input = (id: string) => $<HTMLInputElement>(id);
const status = (s: string) => { $('status').textContent = s; };
let symbol = wrap(samples[0].svg), selected = 0, revision = 0, latestSvg = '', busy = false;
let paid: { id: string; token: string } | null = null;
let apiConfig: any = null;
let orderState = 'pending';
let paidSymbols: { name: string; svg: string }[] = [];
try { paid = JSON.parse(localStorage.getItem('logo-order') || 'null'); } catch {}
const controls = ['brand-name','tagline','ink','paper','font','layout','spacing','symbol-scale','business','mood'];
function design(): Design { return { name: input('brand-name').value.trim().slice(0,24), tagline: input('tagline').value.trim().slice(0,50), color: input('ink').value, background: input('paper').value, font: input('font').value, layout: input('layout').value, spacing: Number(input('spacing').value), scale: Number(input('symbol-scale').value)/100, symbol }; }
function persist() { try { localStorage.setItem('logo-draft',JSON.stringify(Object.fromEntries(controls.map(id => [id,input(id).value])))); } catch {} }
function drawSymbols() {
 const list = paidSymbols.length ? paidSymbols : samples.map(s=>({name:s.name,svg:wrap(s.svg)}));
 $('symbols').replaceChildren();
 list.forEach((s,i)=>{const b=document.createElement('button');b.type='button';b.setAttribute('aria-label',s.name);b.setAttribute('aria-pressed',String(selected===i));b.innerHTML=cleanSymbol(s.svg,input('ink').value);b.onclick=()=>{symbol=s.svg;selected=i;drawSymbols();update();};$('symbols').append(b);});
 $('sample-label').textContent=paidSymbols.length ? `나의 맞춤 시안 ${paidSymbols.length}개` : '직접 만든 무료 견본 4종';
}
async function update() {
 const current=++revision; $('logo-preview').setAttribute('aria-busy','true');
 ['download-svg','download-png','download-zip'].forEach(id=>($<HTMLButtonElement>(id).disabled=true));persist();
 try {const svg=await compose(design());if(current!==revision)return;latestSvg=svg;$('logo-preview').innerHTML=svg;$('logo-preview').setAttribute('aria-busy','false');['download-svg','download-png','download-zip'].forEach(id=>($<HTMLButtonElement>(id).disabled=false));status(paidSymbols.length?'맞춤 시안을 편집 중입니다. 변경한 모습으로 파일이 만들어집니다.':'견본 편집 중 · 글자와 심볼을 가운데에 맞췄습니다.');}
 catch(e){if(current===revision){status((e as Error).message+' 입력값을 바꾸거나 새로고침해 다시 시도해주세요.');$('logo-preview').setAttribute('aria-busy','false');}}
}
try{const draft=JSON.parse(localStorage.getItem('logo-draft')||'null');if(draft)controls.forEach(id=>{if(typeof draft[id]==='string')input(id).value=draft[id];});}catch{}
$('brand-form').addEventListener('submit',e=>e.preventDefault());
controls.forEach(id=>input(id).addEventListener('input',()=>{if(id==='ink')drawSymbols();update();}));
document.querySelectorAll<HTMLButtonElement>('[data-colors]').forEach(b=>b.onclick=()=>{[input('ink').value,input('paper').value]=b.dataset.colors!.split(',');drawSymbols();update();});
$('reset').onclick=()=>{input('brand-name').value='모닝노트';input('tagline').value='작은 기록, 새로운 하루';input('ink').value='#315443';input('paper').value='#f7f3e9';input('font').value='sans';input('layout').value='stacked';input('spacing').value='15';input('symbol-scale').value='100';input('business').value='';selected=0;symbol=paidSymbols[0]?.svg||wrap(samples[0].svg);drawSymbols();update();};
const filename=()=>((design().name||'logo').replace(/[^\p{L}\p{N}_-]/gu,'_').slice(0,30));
async function download(kind:string){if(busy)return;busy=true;status('파일을 준비하고 있습니다…');try{const d=design();if(kind==='svg')save(new Blob([latestSvg],{type:'image/svg+xml'}),filename()+'.svg');if(kind==='png')save(await png(await compose(d,'logo',true),2048,2048),filename()+'-transparent.png');if(kind==='zip')save(await bundle(d),filename()+'-logo-kit.zip');status('파일을 준비했습니다. 브라우저 다운로드 목록을 확인해주세요.');}catch(e){status('파일을 만들지 못했습니다. '+(e as Error).message);}finally{busy=false;}}
$('download-svg').onclick=()=>download('svg');$('download-png').onclick=()=>download('png');$('download-zip').onclick=()=>download('zip');
async function api(path:string,body?:any){const r=await fetch('/logo/api/'+path,{method:body?'POST':'GET',headers:{'content-type':'application/json',...(paid?{'authorization':'Bearer '+paid.token}:{})},...(body?{body:JSON.stringify(body)}:{})});let data;try{data=await r.json();}catch{throw Error('맞춤 생성 서비스를 준비 중입니다. 무료 견본은 계속 사용할 수 있습니다.');}if(!r.ok)throw Error(data.error||'요청을 처리하지 못했습니다.');return data;}
async function refreshOrder(){if(!paid)return;const o=await api('orders/'+paid.id);orderState=o.status;paidSymbols=o.results.map((r:any,i:number)=>({name:`맞춤 시안 ${i+1}`,svg:r.svg}));$('order-panel').hidden=false;$('order-status').textContent=`주문 ${paid.id.slice(-8)} · 남은 시안 ${o.remaining}개${o.processing?' · 생성 중':''}`;$<HTMLButtonElement>('more').disabled=o.status!=='paid'||o.remaining===0||o.processing||busy;if(paidSymbols.length){selected=Math.min(selected,paidSymbols.length-1);symbol=paidSymbols[selected].svg;$('preview-label').textContent='내 브랜드 맞춤 로고';drawSymbols();await update();}return o;}
async function generateBatch(){if(!paid||busy)return;busy=true;$<HTMLButtonElement>('more').disabled=true;try{const o=await api('orders/'+paid.id);const count=Math.min(4,o.remaining);for(let i=0;i<count;i++){status(`새 시안 ${i+1}/${count}개를 만들고 있습니다. 창을 닫아도 주문은 보관됩니다.`);await api('orders/'+paid.id+'/generate',{requestId:crypto.randomUUID(),brief:{name:design().name,business:input('business').value,mood:input('mood').value,color:design().color}});await refreshOrder();}status('새 시안을 만들었습니다. 마음에 드는 심볼을 선택해주세요.');}catch(e){status((e as Error).message);}finally{busy=false;await refreshOrder().catch(()=>{});}}
$('more').onclick=generateBatch;$('recheck').onclick=()=>refreshOrder().catch(e=>status(e.message));
$('generate').onclick=async()=>{if(!apiConfig?.ready)return;if(!input('brand-name').value.trim()){input('brand-name').focus();status('브랜드 이름을 입력해주세요.');return;}if(paid&&orderState==='paid'){await generateBatch();return;}try{const order=paid?{id:paid.id,token:paid.token}:await api('orders',{brief:{name:design().name,business:input('business').value,mood:input('mood').value,color:design().color}});paid={id:order.id,token:order.token};localStorage.setItem('logo-order',JSON.stringify(paid));const script=document.createElement('script');script.src='https://js.tosspayments.com/v1/payment';await new Promise((resolve,reject)=>{script.onload=resolve;script.onerror=reject;document.head.append(script);});await (window as any).TossPayments(apiConfig.clientKey).requestPayment('카드',{amount:9900,orderId:order.id,orderName:'로고꾸러미 맞춤 로고 8시안',successUrl:location.origin+'/logo/?payment=success',failUrl:location.origin+'/logo/?payment=fail'});}catch(e){status((e as Error).message||'결제를 열지 못했습니다.');}};
async function init(){drawSymbols();update();try{apiConfig=await api('config');$('api-message').textContent=apiConfig.ready?'9,900원 · 맞춤 벡터 시안 8개. 결제 후 생성합니다.':'맞춤 생성은 준비 중입니다. 지금은 무료 견본을 편집하고 내려받을 수 있어요.';if(apiConfig.ready){const b=$<HTMLButtonElement>('generate');b.disabled=false;b.textContent=paid?'내 주문 이어서 만들기':'맞춤 시안 만들기 · 9,900원';}}catch{$('api-message').textContent='맞춤 생성은 준비 중입니다. 무료 견본 편집·다운로드를 먼저 사용해보세요.';}
 const q=new URLSearchParams(location.search);if(q.get('payment')==='success'&&paid){try{await api('orders/'+paid.id+'/confirm',{paymentKey:q.get('paymentKey'),orderId:q.get('orderId'),amount:Number(q.get('amount'))});history.replaceState({},'',location.pathname+'#studio');status('결제를 확인했습니다. 맞춤 시안을 만들어주세요.');await refreshOrder();}catch(e){status('결제 확인이 필요합니다. 새 결제를 하지 말고 주문을 다시 불러와주세요. '+(e as Error).message);}}else if(q.get('payment')==='fail'){status('결제가 완료되지 않았습니다. 다시 시도할 수 있습니다.');}else if(paid){await refreshOrder().catch(e=>status(e.message));}}
init();
