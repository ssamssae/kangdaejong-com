import http from 'node:http';
import { readFile, mkdir, chmod } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { randomBytes, createHash, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { zipSync } from 'fflate';
import { catalog, validateOptions } from './catalog.mjs';
import { createStore } from './store.mjs';
import { correctPhoto } from './image.mjs';
import { createCommerce } from './commerce.mjs';
import { createAuth,createResend } from './auth.mjs';
import { createToss } from './toss.mjs';
import { createGenerative,createFal,edits } from './generative.mjs';
const scrypt = promisify(scryptCallback);
const root = dirname(fileURLToPath(import.meta.url));
const hash = value => createHash('sha256').update(value).digest('hex');
const error = (status, message) => Object.assign(new Error(message), { status });
async function passwordHash(password, salt = randomBytes(16).toString('hex')) { return `${salt}:${(await scrypt(password,salt,64)).toString('hex')}`; }
async function readBody(req, limit) {
  const chunks=[]; let length=0;
  for await (const chunk of req) { length += chunk.length; if(length>limit) throw error(413,'파일은 10MB 이하로 올려주세요.'); chunks.push(chunk); }
  return Buffer.concat(chunks);
}
async function readJson(req,limit=4096) { try { const value=JSON.parse((await readBody(req,limit)).toString());if(!value||typeof value!=='object'||Array.isArray(value))throw error(400,'요청 형식을 확인해주세요.');return value; } catch(e) { if(e.status) throw e; throw error(400,'요청 형식을 확인해주세요.'); } }
export async function createApp({ dataDir = resolve(root,'data'), origin = 'http://127.0.0.1:4387', processor = correctPhoto, gateway = null, encryptionKey = null, mailer = null, imageProvider = null, autoRenewals = false } = {}) {
  if (!['127.0.0.1', 'localhost'].includes(new URL(origin).hostname)) throw new Error('This prelaunch build only supports a loopback origin. Public release requires a separate review.');
  if((gateway||imageProvider) && !mailer)throw new Error('External mode requires verified email accounts');
  if(autoRenewals&&(!gateway||!encryptionKey))throw new Error('Renewals require a test gateway and billing encryption key');
  await mkdir(dataDir,{recursive:true,mode:0o700});
  const store = createStore(resolve(dataDir,'photo.sqlite'));
  await chmod(resolve(dataDir,'photo.sqlite'),0o600);
  const { db } = store;
  const auth=createAuth(store,{mailer,origin}),commerce=createCommerce(store,{gateway,encryptionKey}),generated=createGenerative(store,imageProvider);
  const limits=new Map(); let active=0;
  function rate(key,max,ms) { const now=Date.now(), bucket=limits.get(key); if(!bucket || bucket.until<now) { limits.set(key,{n:1,until:now+ms}); return; } if(++bucket.n>max) throw error(429,'요청이 많습니다. 잠시 후 다시 시도해주세요.'); }
  let renewing=false,renewalTask=Promise.resolve();
  const timer=setInterval(() => { store.cleanup();auth.cleanup();if(autoRenewals&&commerce.enabled&&!renewing){renewing=true;renewalTask=commerce.renewDue().catch(()=>{}).finally(()=>{renewing=false;});} for(const [key,value] of limits) if(value.until<Date.now()) limits.delete(key); },60_000); timer.unref();
  store.cleanup();
  function userFor(req) {
    const token=(req.headers.cookie??'').split(';').map(v=>v.trim()).find(v=>v.startsWith('sg_session='))?.slice(11);
    const user=token && db.prepare('SELECT users.* FROM sessions JOIN users ON users.id=sessions.user_id WHERE token=? AND expires>?').get(hash(token),Date.now());
    if(!user) throw error(401,'로그인 후 무료 3장을 보정해보세요.'); return user;
  }
  function session(res,id) {
    const token=randomBytes(32).toString('hex');
    db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(hash(token),id,Date.now()+7*86400000);
    res.setHeader('Set-Cookie',`sg_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=604800`);
  }
  const summary = id => {store.wallet.balance(id);return {...db.prepare('SELECT username,credits FROM users WHERE id=?').get(id),emailRequired:auth.required,emailVerified:auth.verified(id)};};
  const jobs = id => db.prepare('SELECT id,category,preset,strength,status,created,expires,width,height FROM jobs WHERE user_id=? AND expires>? ORDER BY created DESC').all(id,Date.now());
  function ownedJob(id,user) { const job=db.prepare('SELECT * FROM jobs WHERE id=? AND user_id=? AND expires>?').get(id,user,Date.now()); if(!job || job.status==='deleted') throw error(404,'사진을 찾을 수 없거나 보관 기간이 지났습니다.'); return job; }
  const server=http.createServer(async(req,res)=>{
    res.setHeader('X-Content-Type-Options','nosniff'); res.setHeader('Referrer-Policy','no-referrer'); res.setHeader('Cache-Control','no-store');
    res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self' https://js.tosspayments.com; style-src 'self'; img-src 'self' blob:; connect-src 'self' https://*.tosspayments.com; frame-src https://*.tosspayments.com; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
    const send=(value,status=200)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(value));};
    try {
      if (req.headers.host !== new URL(origin).host) throw error(403,'허용되지 않은 주소입니다.');
      const url=new URL(req.url,origin), path=url.pathname;
      const webhook=path==='/api/webhooks/toss' && req.method==='POST';
      if(!webhook && !['GET','HEAD'].includes(req.method) && req.headers.origin!==origin) throw error(403,'같은 사이트에서 다시 요청해주세요.');
      rate(req.socket.remoteAddress,180,60_000);
      if(path==='/api/catalog' && req.method==='GET') return send({...catalog,salesEnabled:commerce.enabled,paymentMode:commerce.mode,clientKey:commerce.clientKey,emailRequired:auth.required,generatedEditingEnabled:generated.enabled,edits});
      if(webhook){const body=await readJson(req,32768);if(body.eventType!=='PAYMENT_STATUS_CHANGED')return send({ignored:true});rate(`webhook:${body.data?.orderId}`,10,60000);return send(await commerce.event(req.headers['tosspayments-webhook-transmission-id'],body.data?.orderId));}
      if(path==='/api/verify-email'&&req.method==='POST'){const body=await readJson(req);const id=auth.verify(body.token);session(res,id);return send(summary(id));}
      if(path==='/api/password/request'&&req.method==='POST'){rate(`reset:${req.socket.remoteAddress}`,5,3600_000);const body=await readJson(req);return send(await auth.requestReset(body.email));}
      if(path==='/api/password/reset'&&req.method==='POST'){rate(`reset-use:${req.socket.remoteAddress}`,10,3600_000);const body=await readJson(req);return send(await auth.reset(body.token,body.password));}
      if(['/api/register','/api/login'].includes(path) && req.method==='POST') {
        rate(`auth:${req.socket.remoteAddress}`,20,3600_000);
        const body=await readJson(req), username=String(body.username??'').toLowerCase(), password=body.password;
        if(!/^[a-z0-9_-]{4,32}$/.test(username) || typeof password!=='string' || password.length<10 || password.length>128) throw error(400,'아이디는 영문·숫자 4~32자, 비밀번호는 10~128자로 입력해주세요.');
        let id;
        if(path==='/api/register' && auth.required){const registered=await auth.register(username,password,body.email);id=registered.id;session(res,id);return send({...summary(id),mailPending:registered.mailPending});}
        if(path==='/api/register') {
          const digest=await passwordHash(password);
          try { id=store.register(username,digest); } catch(e) { if(e.code?.includes('CONSTRAINT') || e.message.includes('UNIQUE')) throw error(409,'이미 사용 중인 아이디입니다.'); throw e; }
        } else {
          const user=db.prepare('SELECT * FROM users WHERE username=?').get(username);
          const salt=user?.password.split(':')[0]??'00000000000000000000000000000000';
          const digest=await passwordHash(password,salt);
          if(!user || !timingSafeEqual(Buffer.from(digest),Buffer.from(user.password))) throw error(401,'아이디 또는 비밀번호를 확인해주세요.'); id=user.id;
        }
        session(res,id); return send(summary(id));
      }
      if(path.startsWith('/api/')) {
        const user=userFor(req);
        if(path==='/api/me' && req.method==='GET') return send({...summary(user.id),jobs:jobs(user.id),styles:db.prepare('SELECT id,name,category,preset,strength FROM styles WHERE user_id=?').all(user.id),orders:commerce.list(user.id),subscription:commerce.subscription(user.id)});
        if(path==='/api/verify-email/resend'&&req.method==='POST'){rate(`verify:${user.id}`,3,3600_000);await auth.resend(user.id);return send({ok:true});}
        if(path==='/api/styles'&&req.method==='POST'){const body=await readJson(req),options=validateOptions(body);if(typeof body.name!=='string'||!body.name.trim()||body.name.length>40)throw error(400,'스타일 이름은 1~40자로 입력해주세요.');if(db.prepare('SELECT count(*) AS n FROM styles WHERE user_id=?').get(user.id).n>=20)throw error(409,'스타일은 최대 20개까지 저장할 수 있습니다.');const id=randomBytes(16).toString('hex');db.prepare('INSERT INTO styles VALUES(?,?,?,?,?,?)').run(id,user.id,body.name.trim(),options.category,options.preset,options.strength);return send({id});}
        if(path.startsWith('/api/styles/')&&req.method==='DELETE'){db.prepare('DELETE FROM styles WHERE id=? AND user_id=?').run(path.slice(12),user.id);return send({ok:true});}
        if(path==='/api/logout' && req.method==='POST') {
          const token=(req.headers.cookie??'').match(/(?:^|;\s*)sg_session=([^;]+)/)?.[1];
          if(token) db.prepare('DELETE FROM sessions WHERE token=?').run(hash(token));
          res.setHeader('Set-Cookie','sg_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'); return send({ok:true});
        }
        if(path==='/api/account' && req.method==='DELETE') {
          if(db.prepare("SELECT id FROM jobs WHERE user_id=? AND status IN ('processing','external_pending')").get(user.id)) throw error(409,'보정이 끝난 뒤 탈퇴해주세요.');
          if(commerce.hasFinancialHistory(user.id))commerce.eraseAccount(user.id);else db.prepare('DELETE FROM users WHERE id=?').run(user.id); store.cleanup();
          res.setHeader('Set-Cookie','sg_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'); return send({ok:true});
        }
        if(path.startsWith('/api/billing') || path==='/api/checkout' || path.startsWith('/api/subscription')){
          if(!commerce.enabled)throw error(503,'결제·구독은 아직 활성화되지 않았습니다.');
          if(auth.required&&!auth.verified(user.id))throw error(403,'이메일 인증 후 결제를 진행해주세요.');
          if(path==='/api/checkout'&&req.method==='POST'){const body=await readJson(req);return send({...commerce.order(user.id,body.plan,body.requestKey),customerKey:user.id,clientKey:commerce.clientKey});}
          if(path==='/api/billing/confirm'&&req.method==='POST'){const body=await readJson(req);return send(await commerce.confirm(user.id,body.orderId,body.paymentKey));}
          if(path==='/api/billing/reconcile'&&req.method==='POST'){const body=await readJson(req);return send(await commerce.reconcile(user.id,body.orderId));}
          if(path==='/api/billing/refund'&&req.method==='POST'){const body=await readJson(req);return send(await commerce.refund(user.id,body.orderId));}
          if(path==='/api/subscription/start'&&req.method==='POST')return send(commerce.startSubscription(user.id));
          if(path==='/api/subscription/authorize'&&req.method==='POST'){const body=await readJson(req);return send(await commerce.authorize(user.id,body.authKey,body.customerKey));}
          if(path==='/api/subscription/cancel'&&req.method==='POST')return send(commerce.cancelSubscription(user.id));
        }
        if(path==='/api/jobs' && req.method==='POST') {
          const options=validateOptions({category:url.searchParams.get('category'),preset:url.searchParams.get('preset'),strength:Number(url.searchParams.get('strength'))});
          if(auth.required&&!auth.verified(user.id))throw error(403,'이메일 인증 후 보정할 수 있습니다.');
          if(commerce.hasReview(user.id))throw error(409,'환불·결제 상태 확인이 끝난 뒤 보정할 수 있습니다.');
          const edit=url.searchParams.get('edit');if(edit){if(!generated.enabled||!Object.hasOwn(edits[options.category]??{},edit))throw error(503,'이 생성형 보정은 아직 제공하지 않습니다.');if(req.headers['x-photo-ai-consent']!=='yes')throw error(400,'외부 AI 처리 동의가 필요합니다.');options.edit=edit;}
          const cost=edit?edits[options.category][edit].cost:1;
          if(commerce.enabled)await commerce.ensureSpendable(user.id);
          const requestKey=req.headers['idempotency-key'];
          if(typeof requestKey!=='string' || !/^[a-zA-Z0-9_-]{16,80}$/.test(requestKey)) throw error(400,'요청 번호를 확인해주세요.');
          if(active>=2) throw error(429,'다른 사진을 처리 중입니다. 잠시 후 다시 시도해주세요.');
          if(db.prepare("SELECT id FROM jobs WHERE user_id=? AND status IN ('processing','external_pending')").get(user.id)) throw error(409,'앞선 보정이 끝난 뒤 다시 시도해주세요.');
          active++;
          try {
            const bytes=await readBody(req,catalog.maxBytes);
            if(!bytes.length) throw error(400,'사진을 선택해주세요.');
            const fingerprint=hash(Buffer.concat([bytes,Buffer.from(JSON.stringify(options))]));
            const job=store.reserve(user.id,requestKey,fingerprint,options,cost);
            if(job.reused) return send({job,credits:summary(user.id).credits});
            if(edit){try{const result=await generated.start(job,bytes,options);return send({job:result,credits:summary(user.id).credits},202);}catch(e){store.fail(job.id);throw e;}}
            try { const result=await processor(bytes,options); store.complete(job.id,result); }
            catch(e) { store.fail(job.id); throw e.status?e:error(422,'보정하지 못했습니다. 크레딧을 복구했습니다.'); }
            return send({job:{id:job.id,status:'done'},credits:summary(user.id).credits},201);
          } finally { active--; }
        }
        if(path==='/api/download.zip' && req.method==='GET') {
          const selected=(url.searchParams.get('ids')??'').split(',');
          if(!selected.length || selected.length>20 || new Set(selected).size!==selected.length) throw error(400,'사진을 1~20장 선택해주세요.');
          const files={}; let total=0;
          for(const id of selected) { const job=ownedJob(id,user.id); if(job.status!=='done') throw error(409,'완료된 사진만 내려받을 수 있습니다.'); total+=job.output.length; if(total>60*1024*1024) throw error(413,'묶음 용량이 큽니다. 나누어 내려받아주세요.'); files[`sajingyeol-${id}.png`]=new Uint8Array(job.output); }
          res.writeHead(200,{'Content-Type':'application/zip','Content-Disposition':'attachment; filename="sajingyeol.zip"'}); return res.end(zipSync(files,{level:0}));
        }
        const match=path.match(/^\/api\/jobs\/([a-f0-9-]+)(?:\/(original|output|refresh))?$/);
        if(match) {
          const job=ownedJob(match[1],user.id);
          if(req.method==='POST'&&match[2]==='refresh')return send({job:await generated.refresh(job),credits:summary(user.id).credits});
          if(req.method==='DELETE' && !match[2]) { if(['processing','external_pending'].includes(job.status)) throw error(409,'보정이 끝난 뒤 삭제해주세요.'); db.prepare("UPDATE jobs SET status='deleted',original=NULL,output=NULL WHERE id=?").run(job.id); store.cleanup(); return send({ok:true}); }
          if(req.method==='GET' && ['original','output'].includes(match[2])) { if(job.status!=='done') throw error(409,'아직 내려받을 수 없습니다.'); res.setHeader('Content-Type','image/png'); if(url.searchParams.has('download')) res.setHeader('Content-Disposition',`attachment; filename="sajingyeol-${job.id}.png"`); return res.end(Buffer.from(job[match[2]])); }
        }
        throw error(404,'요청한 기능을 찾을 수 없습니다.');
      }
      const staticFiles={'/':['index.html','text/html; charset=utf-8'],'/app.js':['app.js','text/javascript; charset=utf-8'],'/style.css':['style.css','text/css; charset=utf-8'],'/privacy':['privacy.html','text/html; charset=utf-8'],'/terms':['terms.html','text/html; charset=utf-8']};
      const file=staticFiles[path];
      if(!file || !['GET','HEAD'].includes(req.method)) throw error(404,'페이지를 찾을 수 없습니다.');
      res.setHeader('Content-Type',file[1]);res.end(req.method==='HEAD'?undefined:await readFile(resolve(root,'public',file[0])));
    } catch(e) { if(!res.headersSent) send({error:e.status?e.message:'요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.'},e.status??500); else res.end(); }
  });
  server.requestTimeout=30_000;server.headersTimeout=10_000;
  return {server,store,commerce,auth,generated,close:async()=>{clearInterval(timer);await new Promise(resolve=>server.close(resolve));await renewalTask;store.close();}};
}
if(process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href) {
  const port=Number(process.env.PORT??4387), origin=`http://127.0.0.1:${port}`;
  const gateway=process.env.PHOTO_PAYMENTS_MODE==='test'?createToss({secretKey:process.env.PHOTO_TOSS_SECRET_KEY,clientKey:process.env.PHOTO_TOSS_CLIENT_KEY}):null;
  const mailer=process.env.PHOTO_MAIL_ENABLED==='true'?createResend({apiKey:process.env.PHOTO_RESEND_KEY,from:process.env.PHOTO_MAIL_FROM,origin}):null;
  const imageProvider=process.env.PHOTO_AI_ENABLED==='true'?createFal({apiKey:process.env.PHOTO_FAL_KEY}):null;
  const app=await createApp({dataDir:process.env.PHOTO_DATA_DIR??resolve(root,'data'),origin,gateway,mailer,imageProvider,encryptionKey:process.env.PHOTO_BILLING_ENCRYPTION_KEY,autoRenewals:process.env.PHOTO_AUTO_RENEWALS==='true'});
  app.server.listen(port,'127.0.0.1',()=>console.log(`사진결 로컬 MVP: ${origin} — 외부 기능은 명시 설정 시에만 동작`));
  for(const signal of ['SIGINT','SIGTERM']) process.once(signal,()=>app.close().then(()=>process.exit(0)));
}
