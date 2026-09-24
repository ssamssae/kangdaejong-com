import sharp from 'sharp';
import { fault } from './wallet.mjs';
import { correctPhoto } from './image.mjs';
export const edits={portrait:{retouch:{name:'자연스러운 잡티 정리',cost:3,prompt:'Retouch temporary skin blemishes subtly. Preserve identity, facial structure, age, skin texture, hair, clothing, and the background. No face reshaping.'}},product:{background:{name:'흰 배경 스튜디오',cost:5,prompt:'Replace only the background with a clean white studio background and a soft natural shadow. Preserve the exact product geometry, materials, colors, logos, labels, text, and proportions.'}},space:{lighting:{name:'자연스러운 조명 정리',cost:3,prompt:'Correct uneven lighting and white balance naturally. Preserve all food ingredients, portions, furnishings, room layout, architecture and perspective. Do not add, remove, or enlarge objects.'}}};
const MODEL='fal-ai/flux-pro/kontext';
function safeURL(value,type){const u=new URL(value);const allowed=type==='queue'?u.hostname==='queue.fal.run':u.hostname==='fal.media'||u.hostname.endsWith('.fal.media');if(u.protocol!=='https:'||u.port||u.username||u.password||!allowed)throw fault(502,'이미지 공급자 주소를 확인할 수 없습니다.');return u.href;}
export function createFal({apiKey,fetcher=fetch}){
  if(!apiKey)throw new Error('FAL key missing');
  const headers={Authorization:`Key ${apiKey}`,'Content-Type':'application/json'};
  const request=async(url,options={})=>{let r;try{r=await fetcher(safeURL(url,'queue'),{...options,headers,signal:AbortSignal.timeout(20000),redirect:'error'});}catch{throw Object.assign(fault(503,'외부 보정의 처리 상태를 확인 중입니다.'),{uncertain:true});}if(!r.ok)throw Object.assign(fault(r.status>=500?503:422,'이미지 공급자가 보정을 완료하지 못했습니다.'),{uncertain:r.status>=500});try{return await r.json();}catch{throw Object.assign(fault(503,'외부 보정 응답을 확인할 수 없습니다.'),{uncertain:true});}};
  return {
    name:'fal / FLUX.1 Kontext pro',
    async submit(original,prompt){const r=await request(`https://queue.fal.run/${MODEL}`,{method:'POST',body:JSON.stringify({image_url:`data:image/png;base64,${original.toString('base64')}`,prompt,num_images:1,output_format:'png',safety_tolerance:'2'})});if(typeof r.request_id!=='string'||!r.request_id)throw Object.assign(fault(502,'외부 보정 요청을 확인할 수 없습니다.'),{uncertain:true});try{return {id:r.request_id,statusURL:safeURL(r.status_url,'queue'),responseURL:safeURL(r.response_url,'queue')};}catch{throw Object.assign(fault(502,'접수된 외부 보정의 주소를 확인할 수 없습니다.'),{uncertain:true});}},
    async poll(receipt){const r=await request(receipt.statusURL);if(r.status!=='COMPLETED')return {pending:true};const data=await request(receipt.responseURL);if(data.has_nsfw_concepts?.some(Boolean)||!data.images?.[0]?.url)throw fault(422,'안전하게 전달할 수 있는 보정 결과가 없습니다.');
      let response;try{response=await fetcher(safeURL(data.images[0].url,'image'),{signal:AbortSignal.timeout(20000),redirect:'error'});}catch{throw Object.assign(fault(503,'결과 파일을 다시 확인해주세요.'),{uncertain:true});}
      if(!response.ok)throw Object.assign(fault(503,'결과 파일을 다시 확인해주세요.'),{uncertain:true});
      const reader=response.body.getReader(),chunks=[];let length=0;while(true){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>20*1024*1024){await reader.cancel();throw fault(422,'결과 사진의 용량이 너무 큽니다.');}chunks.push(Buffer.from(value));}return {output:Buffer.concat(chunks)};
    },
  };
}
export function createGenerative(store,provider=null){
  const {db}=store;
  db.exec(`CREATE TABLE IF NOT EXISTS external_jobs(job_id TEXT PRIMARY KEY,receipt TEXT,original BLOB,edit TEXT NOT NULL,phase TEXT NOT NULL);`);
  const locks=new Set();
  return {
    enabled:!!provider,
    async start(job,bytes,options){
      const edit=Object.hasOwn(edits[options.category]??{},options.edit)?edits[options.category][options.edit]:null;if(!edit||!provider)throw fault(503,'생성형 보정은 아직 활성화되지 않았습니다.');
      const prepared=await correctPhoto(bytes,options);
      store.transaction(()=>{db.prepare("UPDATE jobs SET status='external_pending' WHERE id=?").run(job.id);db.prepare("INSERT INTO external_jobs VALUES(?,NULL,?,?,'submitting')").run(job.id,prepared.original,options.edit);});
      try{const receipt=await provider.submit(prepared.original,edit.prompt);db.prepare("UPDATE external_jobs SET receipt=?,phase='queued' WHERE job_id=?").run(JSON.stringify(receipt),job.id);}catch(e){
        if(e.uncertain){db.prepare("UPDATE external_jobs SET phase='unknown' WHERE job_id=?").run(job.id);return {id:job.id,status:'external_pending',needsReview:true};}
        db.prepare("UPDATE jobs SET status='processing' WHERE id=?").run(job.id);store.fail(job.id);db.prepare('DELETE FROM external_jobs WHERE job_id=?').run(job.id);throw e;
      }
      return {id:job.id,status:'external_pending'};
    },
    async refresh(job){
      const ext=db.prepare('SELECT * FROM external_jobs WHERE job_id=?').get(job.id);if(job.status!=='external_pending')return {id:job.id,status:job.status};
      if(!provider||!ext?.receipt)return {id:job.id,status:'external_pending',needsReview:true};
      if(locks.has(job.id))throw fault(409,'외부 보정 결과를 확인 중입니다.');locks.add(job.id);
      try{
        const result=await provider.poll(JSON.parse(ext.receipt));if(result.pending)return {id:job.id,status:'external_pending'};
        const image=sharp(result.output,{limitInputPixels:24_000_000,failOn:'warning'}),meta=await image.metadata();if(!['jpeg','png','webp'].includes(meta.format)||(meta.pages??1)!==1)throw fault(422,'지원하지 않는 결과 사진입니다.');
        const original=Buffer.from(ext.original),originalMeta=await sharp(original).metadata();
        if(Math.abs(meta.width/meta.height-originalMeta.width/originalMeta.height)>0.03)throw fault(422,'사진 비율이 달라 결과를 전달하지 않았습니다.');
        const output=await image.rotate().resize({width:2400,height:2400,fit:'inside',withoutEnlargement:true}).png().toBuffer(),outputMeta=await sharp(output).metadata();
        store.complete(job.id,{original,output,width:outputMeta.width,height:outputMeta.height});db.prepare('DELETE FROM external_jobs WHERE job_id=?').run(job.id);return {id:job.id,status:'done'};
      }catch(e){if(e.status===422){db.prepare("UPDATE jobs SET status='processing' WHERE id=?").run(job.id);store.fail(job.id);db.prepare('DELETE FROM external_jobs WHERE job_id=?').run(job.id);}throw e;}finally{locks.delete(job.id);}
    },
  };
}
