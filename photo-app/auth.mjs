import { randomBytes,createHash,scrypt as scryptCallback,timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { fault } from './wallet.mjs';
const scrypt=promisify(scryptCallback),hash=value=>createHash('sha256').update(value).digest('hex');
export async function passwordHash(password,salt=randomBytes(16).toString('hex')){return `${salt}:${(await scrypt(password,salt,64)).toString('hex')}`;}
export function validatePassword(password){if(typeof password!=='string'||password.length<10||password.length>128)throw fault(400,'비밀번호는 10~128자로 입력해주세요.');}
export async function passwordMatches(password,digest){validatePassword(password);const candidate=await passwordHash(password,digest?.split(':')[0]??'00000000000000000000000000000000');return !!digest&&candidate.length===digest.length&&timingSafeEqual(Buffer.from(candidate),Buffer.from(digest));}
export function createResend({apiKey,from,origin,fetcher=fetch}){
  if(!apiKey||!from)throw new Error('Mail credentials are missing');
  return async({email,token,purpose,id})=>{
    const link=`${origin}/#${purpose}=${encodeURIComponent(token)}`;
    let response;try{response=await fetcher('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json','Idempotency-Key':id},body:JSON.stringify({from,to:[email],subject:purpose==='verify'?'사진결 이메일 확인':'사진결 비밀번호 재설정',text:`15분 안에 아래 링크를 열어주세요. 본인이 요청하지 않았다면 무시해주세요.\n${link}`}),signal:AbortSignal.timeout(15000),redirect:'error'});}catch{throw fault(503,'메일 전송을 확인할 수 없습니다. 잠시 후 다시 요청해주세요.');}
    if(!response.ok)throw fault(503,'메일을 보내지 못했습니다. 잠시 후 다시 요청해주세요.');
  };
}
export function createAuth(store,{mailer=null,origin}={}){
  const {db,transaction,wallet}=store;
  db.exec(`CREATE TABLE IF NOT EXISTS identities(user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,email TEXT UNIQUE NOT NULL,verified INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE IF NOT EXISTS auth_tokens(token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,purpose TEXT NOT NULL,expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS trial_claims(email_hash TEXT PRIMARY KEY,expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS styles(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,name TEXT NOT NULL,category TEXT NOT NULL,preset TEXT NOT NULL,strength INTEGER NOT NULL);`);
  async function send(user,purpose){if(!mailer)throw fault(503,'이메일 인증 서비스가 아직 연결되지 않았습니다.');const identity=db.prepare('SELECT * FROM identities WHERE user_id=?').get(user);if(!identity)return;
    const token=randomBytes(32).toString('hex'),digest=hash(token);
    db.prepare('INSERT INTO auth_tokens VALUES(?,?,?,?)').run(digest,user,purpose,Date.now()+15*60000);
    try{await mailer({email:identity.email,token,purpose,id:`${purpose}-${digest}`,origin});}catch(e){db.prepare('DELETE FROM auth_tokens WHERE token_hash=?').run(digest);throw e;}
  }
  return {
    required:!!mailer,
    verified:user=>!!db.prepare('SELECT verified FROM identities WHERE user_id=?').get(user)?.verified,
    async register(username,password,email){validatePassword(password);if(typeof email!=='string'||email.length>254||!/^\S+@[^\s@]+\.[^\s@]+$/.test(email))throw fault(400,'이메일 주소를 확인해주세요.');email=email.toLowerCase().trim();
      const digest=await passwordHash(password);let id;
      try{id=store.register(username,digest,{trial:false});db.prepare('INSERT INTO identities VALUES(?,?,0)').run(id,email);}catch(e){if(id)db.prepare('DELETE FROM users WHERE id=?').run(id);if(e.message.includes('UNIQUE'))throw fault(409,'이미 등록된 아이디 또는 이메일입니다.');throw e;}
      // Account remains unverified on delivery failure so resend can recover it.
      try{await send(id,'verify');}catch{return {id,mailPending:true};}return {id,mailPending:false};
    },
    async resend(user){await send(user,'verify');},
    async requestReset(email){if(!mailer)throw fault(503,'이메일 복구 서비스가 아직 연결되지 않았습니다.');const identity=typeof email==='string'&&db.prepare('SELECT * FROM identities WHERE email=?').get(email.toLowerCase().trim());if(identity?.verified){try{await send(identity.user_id,'reset');}catch{/* Uniform response: retry does not disclose account existence. */}}return {ok:true};},
    consume(token,purpose){if(typeof token!=='string'||!/^[a-f0-9]{64}$/.test(token))throw fault(400,'인증 링크를 확인해주세요.');const row=db.prepare('SELECT * FROM auth_tokens WHERE token_hash=? AND purpose=? AND expires>?').get(hash(token),purpose,Date.now());if(!row)throw fault(400,'사용했거나 만료된 인증 링크입니다.');return row;},
    verify(token){return transaction(()=>{const row=this.consume(token,'verify'),identity=db.prepare('SELECT * FROM identities WHERE user_id=?').get(row.user_id);db.prepare('DELETE FROM auth_tokens WHERE user_id=? AND purpose=?').run(row.user_id,'verify');
      db.prepare('UPDATE identities SET verified=1 WHERE user_id=?').run(row.user_id);
      db.prepare('DELETE FROM trial_claims WHERE expires<=?').run(Date.now());
      const claimed=db.prepare('INSERT OR IGNORE INTO trial_claims VALUES(?,?)').run(hash(identity.email),Date.now()+180*86400000);
      if(claimed.changes)wallet.grant(row.user_id,`trial:${row.user_id}`,3,8640000000000000);
      return row.user_id;
    });},
    async reset(token,password){validatePassword(password);const digest=await passwordHash(password);return transaction(()=>{const row=this.consume(token,'reset');db.prepare('UPDATE users SET password=? WHERE id=?').run(digest,row.user_id);db.prepare('DELETE FROM auth_tokens WHERE user_id=?').run(row.user_id);db.prepare('DELETE FROM sessions WHERE user_id=?').run(row.user_id);return {ok:true};});},
    cleanup(){db.prepare('DELETE FROM auth_tokens WHERE expires<=?').run(Date.now());db.prepare('DELETE FROM trial_claims WHERE expires<=?').run(Date.now());},
  };
}
