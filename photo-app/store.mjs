import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import { createWallet } from './wallet.mjs';
import { openSync,writeFileSync,closeSync,unlinkSync } from 'node:fs';
import { resolve } from 'node:path';
export function createStore(path) {
  // Never let a second process refund the first process's in-flight work.
  const lock=resolve(path)+'.lock';let fd;
  try{fd=openSync(lock,'wx',0o600);}catch(e){if(e.code==='EEXIST')throw new Error('Photo database is locked. Stop its owner before removing a stale .lock file.');throw e;}
  const release=()=>{closeSync(fd);unlinkSync(lock);};
  try{writeFileSync(fd,`${process.pid}\n`);const store=openStore(path),close=store.close;let closed=false;store.close=()=>{if(closed)return;closed=true;try{close();}finally{release();}};return store;}catch(e){release();throw e;}
}
function openStore(path) {
  const db = new DatabaseSync(path);
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA secure_delete=ON;
    CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL, password TEXT NOT NULL, credits INTEGER NOT NULL CHECK(credits>=0), created INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS jobs(id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, request_key TEXT NOT NULL, fingerprint TEXT NOT NULL, category TEXT NOT NULL, preset TEXT NOT NULL, strength INTEGER NOT NULL, status TEXT NOT NULL, created INTEGER NOT NULL, expires INTEGER NOT NULL, original BLOB, output BLOB, width INTEGER, height INTEGER, UNIQUE(user_id,request_key));
    CREATE TABLE IF NOT EXISTS ledger(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,job_id TEXT,delta INTEGER NOT NULL,reason TEXT NOT NULL,created INTEGER NOT NULL,UNIQUE(job_id,reason));`);
  const transaction = fn => { db.exec('BEGIN IMMEDIATE'); try { const result = fn(); db.exec('COMMIT'); return result; } catch (error) { db.exec('ROLLBACK'); throw error; } };
  const wallet = createWallet(db,transaction);
  const fail = id => transaction(() => {
    const job = db.prepare('SELECT * FROM jobs WHERE id=?').get(id);
    if (!job || job.status !== 'processing') return;
    db.prepare("UPDATE jobs SET status='failed' WHERE id=?").run(id);
    wallet.refundJob(job.user_id,id);
  });
  // One process owns this local SQLite database. Interrupted local corrections are refunded.
  for (const row of db.prepare("SELECT id FROM jobs WHERE status='processing'").all()) fail(row.id);
  const cleanup = () => {
    for(const job of db.prepare("SELECT id FROM jobs WHERE expires<=? AND status='external_pending'").all(Date.now())) {
      db.prepare("UPDATE jobs SET status='processing' WHERE id=?").run(job.id);fail(job.id);
      if(db.prepare("SELECT name FROM sqlite_master WHERE name='external_jobs'").get())db.prepare('DELETE FROM external_jobs WHERE job_id=?').run(job.id);
    }
    db.prepare("DELETE FROM jobs WHERE expires<=? AND status NOT IN ('processing','external_pending')").run(Date.now());
    db.prepare('DELETE FROM sessions WHERE expires<=?').run(Date.now());
    db.exec('PRAGMA wal_checkpoint(TRUNCATE)');
  };
  return {
    db, transaction, cleanup, fail, wallet,
    register(username, password, { trial = true } = {}) { return transaction(() => {
      const id = randomUUID();
      db.prepare('INSERT INTO users VALUES(?,?,?,?,?)').run(id, username, password, 0, Date.now());
      if(trial)wallet.grant(id,`trial:${id}`,3,8640000000000000); return id;
    }); },
    reserve(user, requestKey, fingerprint, options, cost = 1) { return transaction(() => {
      const previous = db.prepare('SELECT id,status,fingerprint FROM jobs WHERE user_id=? AND request_key=?').get(user, requestKey);
      if (previous) {
        if (previous.fingerprint !== fingerprint) throw Object.assign(new Error('같은 요청 번호에 다른 사진을 보낼 수 없습니다.'), { status: 409 });
        return { ...previous, reused: true };
      }
      if (db.prepare("SELECT id FROM jobs WHERE user_id=? AND status IN ('processing','external_pending')").get(user)) throw Object.assign(new Error('앞선 보정이 끝난 뒤 다시 시도해주세요.'), { status: 409 });
      const id = randomUUID(), now = Date.now();
      db.prepare("INSERT INTO jobs(id,user_id,request_key,fingerprint,category,preset,strength,status,created,expires) VALUES(?,?,?,?,?,?,?,'processing',?,?)").run(id,user,requestKey,fingerprint,options.category,options.preset,options.strength,now,now+7*86400000);
      wallet.spend(user,id,cost); return { id, status: 'processing', reused: false };
    }); },
    complete(id, result) { return transaction(() => {
      const changed = db.prepare("UPDATE jobs SET status='done',original=?,output=?,width=?,height=? WHERE id=? AND status IN ('processing','external_pending')").run(result.original,result.output,result.width,result.height,id);
      if (!changed.changes) throw new Error('Job no longer available');
    }); },
    close() { db.close(); },
  };
}
