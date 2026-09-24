import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
export function createStore(path) {
  const db = new DatabaseSync(path);
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA secure_delete=ON;
    CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL, password TEXT NOT NULL, credits INTEGER NOT NULL CHECK(credits>=0), created INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS jobs(id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, request_key TEXT NOT NULL, fingerprint TEXT NOT NULL, category TEXT NOT NULL, preset TEXT NOT NULL, strength INTEGER NOT NULL, status TEXT NOT NULL, created INTEGER NOT NULL, expires INTEGER NOT NULL, original BLOB, output BLOB, width INTEGER, height INTEGER, UNIQUE(user_id,request_key));
    CREATE TABLE IF NOT EXISTS ledger(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,job_id TEXT,delta INTEGER NOT NULL,reason TEXT NOT NULL,created INTEGER NOT NULL,UNIQUE(job_id,reason));`);
  const transaction = fn => { db.exec('BEGIN IMMEDIATE'); try { const result = fn(); db.exec('COMMIT'); return result; } catch (error) { db.exec('ROLLBACK'); throw error; } };
  const addLedger = (user, job, delta, reason) => db.prepare('INSERT INTO ledger VALUES(?,?,?,?,?,?)').run(randomUUID(), user, job, delta, reason, Date.now());
  const fail = id => transaction(() => {
    const job = db.prepare('SELECT * FROM jobs WHERE id=?').get(id);
    if (!job || job.status !== 'processing') return;
    db.prepare("UPDATE jobs SET status='failed' WHERE id=?").run(id);
    db.prepare('UPDATE users SET credits=credits+1 WHERE id=?').run(job.user_id);
    addLedger(job.user_id, id, 1, 'refund');
  });
  // One process owns this local SQLite database. Interrupted local corrections are refunded.
  for (const row of db.prepare("SELECT id FROM jobs WHERE status='processing'").all()) fail(row.id);
  const cleanup = () => {
    db.prepare('DELETE FROM jobs WHERE expires<=? AND status!=?').run(Date.now(), 'processing');
    db.prepare('DELETE FROM sessions WHERE expires<=?').run(Date.now());
    db.exec('PRAGMA wal_checkpoint(TRUNCATE)');
  };
  return {
    db, transaction, cleanup, fail,
    register(username, password) { return transaction(() => {
      const id = randomUUID();
      db.prepare('INSERT INTO users VALUES(?,?,?,?,?)').run(id, username, password, 3, Date.now());
      addLedger(id, null, 3, 'trial'); return id;
    }); },
    reserve(user, requestKey, fingerprint, options) { return transaction(() => {
      const previous = db.prepare('SELECT id,status,fingerprint FROM jobs WHERE user_id=? AND request_key=?').get(user, requestKey);
      if (previous) {
        if (previous.fingerprint !== fingerprint) throw Object.assign(new Error('같은 요청 번호에 다른 사진을 보낼 수 없습니다.'), { status: 409 });
        return { ...previous, reused: true };
      }
      if (db.prepare("SELECT id FROM jobs WHERE user_id=? AND status='processing'").get(user)) throw Object.assign(new Error('앞선 보정이 끝난 뒤 다시 시도해주세요.'), { status: 409 });
      const updated = db.prepare('UPDATE users SET credits=credits-1 WHERE id=? AND credits>=1').run(user);
      if (!updated.changes) throw Object.assign(new Error('크레딧이 부족합니다. 유료 충전은 출시 준비 중입니다.'), { status: 402 });
      const id = randomUUID(), now = Date.now();
      db.prepare("INSERT INTO jobs(id,user_id,request_key,fingerprint,category,preset,strength,status,created,expires) VALUES(?,?,?,?,?,?,?,'processing',?,?)").run(id,user,requestKey,fingerprint,options.category,options.preset,options.strength,now,now+7*86400000);
      addLedger(user,id,-1,'correction'); return { id, status: 'processing', reused: false };
    }); },
    complete(id, result) { return transaction(() => {
      const changed = db.prepare("UPDATE jobs SET status='done',original=?,output=?,width=?,height=? WHERE id=? AND status='processing'").run(result.original,result.output,result.width,result.height,id);
      if (!changed.changes) throw new Error('Job no longer available');
    }); },
    close() { db.close(); },
  };
}
