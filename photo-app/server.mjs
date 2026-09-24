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
async function readJson(req) { try { return JSON.parse((await readBody(req,4096)).toString()); } catch(e) { if(e.status) throw e; throw error(400,'요청 형식을 확인해주세요.'); } }
export async function createApp({ dataDir = resolve(root,'data'), origin = 'http://127.0.0.1:4387', processor = correctPhoto } = {}) {
  if (!['127.0.0.1', 'localhost'].includes(new URL(origin).hostname)) throw new Error('This prelaunch build only supports a loopback origin. Public release requires a separate review.');
  await mkdir(dataDir,{recursive:true,mode:0o700});
  const store = createStore(resolve(dataDir,'photo.sqlite'));
  await chmod(resolve(dataDir,'photo.sqlite'),0o600);
  const { db } = store;
  const limits=new Map(); let active=0;
  function rate(key,max,ms) { const now=Date.now(), bucket=limits.get(key); if(!bucket || bucket.until<now) { limits.set(key,{n:1,until:now+ms}); return; } if(++bucket.n>max) throw error(429,'요청이 많습니다. 잠시 후 다시 시도해주세요.'); }
  const timer=setInterval(() => { store.cleanup(); for(const [key,value] of limits) if(value.until<Date.now()) limits.delete(key); },60_000); timer.unref();
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
  const summary = id => db.prepare('SELECT username,credits FROM users WHERE id=?').get(id);
  const jobs = id => db.prepare('SELECT id,category,preset,strength,status,created,expires,width,height FROM jobs WHERE user_id=? AND expires>? ORDER BY created DESC').all(id,Date.now());
  function ownedJob(id,user) { const job=db.prepare('SELECT * FROM jobs WHERE id=? AND user_id=? AND expires>?').get(id,user,Date.now()); if(!job || job.status==='deleted') throw error(404,'사진을 찾을 수 없거나 보관 기간이 지났습니다.'); return job; }
  const server=http.createServer(async(req,res)=>{
    res.setHeader('X-Content-Type-Options','nosniff'); res.setHeader('Referrer-Policy','no-referrer'); res.setHeader('Cache-Control','no-store');
    res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' blob:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
    const send=(value,status=200)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(value));};
    try {
      if (req.headers.host !== new URL(origin).host) throw error(403,'허용되지 않은 주소입니다.');
      const url=new URL(req.url,origin), path=url.pathname;
      if(!['GET','HEAD'].includes(req.method) && req.headers.origin!==origin) throw error(403,'같은 사이트에서 다시 요청해주세요.');
      rate(req.socket.remoteAddress,180,60_000);
      if(path==='/api/catalog' && req.method==='GET') return send(catalog);
      if(['/api/register','/api/login'].includes(path) && req.method==='POST') {
        rate(`auth:${req.socket.remoteAddress}`,20,3600_000);
        const body=await readJson(req), username=String(body.username??'').toLowerCase(), password=body.password;
        if(!/^[a-z0-9_-]{4,32}$/.test(username) || typeof password!=='string' || password.length<10 || password.length>128) throw error(400,'아이디는 영문·숫자 4~32자, 비밀번호는 10~128자로 입력해주세요.');
        let id;
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
        if(path==='/api/me' && req.method==='GET') return send({...summary(user.id),jobs:jobs(user.id)});
        if(path==='/api/logout' && req.method==='POST') {
          const token=(req.headers.cookie??'').match(/(?:^|;\s*)sg_session=([^;]+)/)?.[1];
          if(token) db.prepare('DELETE FROM sessions WHERE token=?').run(hash(token));
          res.setHeader('Set-Cookie','sg_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'); return send({ok:true});
        }
        if(path==='/api/account' && req.method==='DELETE') {
          if(db.prepare("SELECT id FROM jobs WHERE user_id=? AND status='processing'").get(user.id)) throw error(409,'보정이 끝난 뒤 탈퇴해주세요.');
          db.prepare('DELETE FROM users WHERE id=?').run(user.id); store.cleanup();
          res.setHeader('Set-Cookie','sg_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'); return send({ok:true});
        }
        if(path==='/api/checkout' && req.method==='POST') throw error(503,'가격과 크레딧은 출시 검토안입니다. 현재 결제·정기청구는 제공하지 않습니다.');
        if(path==='/api/jobs' && req.method==='POST') {
          const options=validateOptions({category:url.searchParams.get('category'),preset:url.searchParams.get('preset'),strength:Number(url.searchParams.get('strength'))});
          const requestKey=req.headers['idempotency-key'];
          if(typeof requestKey!=='string' || !/^[a-zA-Z0-9_-]{16,80}$/.test(requestKey)) throw error(400,'요청 번호를 확인해주세요.');
          if(active>=2) throw error(429,'다른 사진을 처리 중입니다. 잠시 후 다시 시도해주세요.');
          if(db.prepare("SELECT id FROM jobs WHERE user_id=? AND status='processing'").get(user.id)) throw error(409,'앞선 보정이 끝난 뒤 다시 시도해주세요.');
          active++;
          try {
            const bytes=await readBody(req,catalog.maxBytes);
            if(!bytes.length) throw error(400,'사진을 선택해주세요.');
            const fingerprint=hash(Buffer.concat([bytes,Buffer.from(JSON.stringify(options))]));
            const job=store.reserve(user.id,requestKey,fingerprint,options);
            if(job.reused) return send({job,credits:summary(user.id).credits});
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
        const match=path.match(/^\/api\/jobs\/([a-f0-9-]+)(?:\/(original|output))?$/);
        if(match) {
          const job=ownedJob(match[1],user.id);
          if(req.method==='DELETE' && !match[2]) { if(job.status==='processing') throw error(409,'보정이 끝난 뒤 삭제해주세요.'); db.prepare("UPDATE jobs SET status='deleted',original=NULL,output=NULL WHERE id=?").run(job.id); store.cleanup(); return send({ok:true}); }
          if(req.method==='GET' && match[2]) { if(job.status!=='done') throw error(409,'아직 내려받을 수 없습니다.'); res.setHeader('Content-Type','image/png'); if(url.searchParams.has('download')) res.setHeader('Content-Disposition',`attachment; filename="sajingyeol-${job.id}.png"`); return res.end(Buffer.from(job[match[2]])); }
        }
        throw error(404,'요청한 기능을 찾을 수 없습니다.');
      }
      const staticFiles={'/':['index.html','text/html; charset=utf-8'],'/app.js':['app.js','text/javascript; charset=utf-8'],'/style.css':['style.css','text/css; charset=utf-8']};
      const file=staticFiles[path];
      if(!file || !['GET','HEAD'].includes(req.method)) throw error(404,'페이지를 찾을 수 없습니다.');
      res.setHeader('Content-Type',file[1]);res.end(req.method==='HEAD'?undefined:await readFile(resolve(root,'public',file[0])));
    } catch(e) { if(!res.headersSent) send({error:e.status?e.message:'요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.'},e.status??500); else res.end(); }
  });
  server.requestTimeout=30_000;server.headersTimeout=10_000;
  return {server,store,close:async()=>{clearInterval(timer);await new Promise(resolve=>server.close(resolve));store.close();}};
}
if(process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href) {
  const port=Number(process.env.PORT??4387), origin=`http://127.0.0.1:${port}`;
  const app=await createApp({dataDir:process.env.PHOTO_DATA_DIR??resolve(root,'data'),origin});
  app.server.listen(port,'127.0.0.1',()=>console.log(`사진결 로컬 MVP: ${origin} — 결제 비활성`));
  for(const signal of ['SIGINT','SIGTERM']) process.once(signal,()=>app.close().then(()=>process.exit(0)));
}
