import { randomUUID } from 'node:crypto';
export const fault=(status,message)=>Object.assign(new Error(message),{status});
export function createWallet(db, transaction) {
  db.exec(`CREATE TABLE IF NOT EXISTS credit_lots(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,source TEXT UNIQUE NOT NULL,granted INTEGER NOT NULL,remaining INTEGER NOT NULL CHECK(remaining>=0),expires INTEGER NOT NULL,state TEXT NOT NULL DEFAULT 'active');
    CREATE TABLE IF NOT EXISTS credit_spends(job_id TEXT NOT NULL,lot_id TEXT NOT NULL REFERENCES credit_lots(id) ON DELETE CASCADE,amount INTEGER NOT NULL,refunded INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(job_id,lot_id));`);
  // Preserve the old free-only balance. Migration source is stable across restarts.
  for(const user of db.prepare('SELECT id,credits FROM users').all()) {
    if(!db.prepare('SELECT id FROM credit_lots WHERE user_id=?').get(user.id))db.prepare('INSERT OR IGNORE INTO credit_lots VALUES(?,?,?,?,?,?,?)').run(randomUUID(),user.id,`legacy:${user.id}`,user.credits,user.credits,8640000000000000,'active');
  }
  for(const job of db.prepare("SELECT id,user_id FROM jobs WHERE status='processing' AND NOT EXISTS (SELECT 1 FROM credit_spends WHERE job_id=jobs.id)").all()) {
    const lot=db.prepare('SELECT id FROM credit_lots WHERE source=?').get(`legacy:${job.user_id}`);
    if(lot){db.prepare('UPDATE credit_lots SET granted=granted+1 WHERE id=?').run(lot.id);db.prepare('INSERT INTO credit_spends VALUES(?,?,1,0)').run(job.id,lot.id);}
  }
  const balance=user=>{const value=db.prepare("SELECT COALESCE(SUM(remaining),0) AS n FROM credit_lots WHERE user_id=? AND state='active' AND expires>?").get(user,Date.now()).n;db.prepare('UPDATE users SET credits=? WHERE id=?').run(value,user);return value;};
  const ledger=(user,job,delta,reason)=>db.prepare('INSERT INTO ledger VALUES(?,?,?,?,?,?)').run(randomUUID(),user,job,delta,reason,Date.now());
  return {
    balance,
    grant(user,source,amount,expires) {
      if(!Number.isInteger(amount)||amount<1||!Number.isSafeInteger(expires)||expires<=Date.now())throw fault(400,'유효하지 않은 크레딧 지급입니다.');
      const existing=db.prepare('SELECT * FROM credit_lots WHERE source=?').get(source);
      if(existing){if(existing.user_id!==user||existing.granted!==amount)throw fault(409,'크레딧 지급 정보가 일치하지 않습니다.');return existing.id;}
      const id=randomUUID();db.prepare('INSERT INTO credit_lots VALUES(?,?,?,?,?,?,?)').run(id,user,source,amount,amount,expires,'active');ledger(user,null,amount,source);balance(user);return id;
    },
    spend(user,job,amount) {
      if(!Number.isInteger(amount)||amount<1)throw fault(400,'잘못된 차감량입니다.');
      if(balance(user)<amount)throw fault(402,'크레딧이 부족합니다.');
      let left=amount;
      for(const lot of db.prepare("SELECT * FROM credit_lots WHERE user_id=? AND state='active' AND expires>? AND remaining>0 ORDER BY expires,id").all(user,Date.now())){
        const take=Math.min(left,lot.remaining);db.prepare('UPDATE credit_lots SET remaining=remaining-? WHERE id=?').run(take,lot.id);db.prepare('INSERT INTO credit_spends VALUES(?,?,?,0)').run(job,lot.id,take);left-=take;if(!left)break;
      }
      ledger(user,job,-amount,'correction');balance(user);
    },
    refundJob(user,job) {
      let returned=0;
      for(const spend of db.prepare('SELECT * FROM credit_spends WHERE job_id=? AND refunded=0').all(job)){
        const lot=db.prepare('SELECT * FROM credit_lots WHERE id=?').get(spend.lot_id);
        if(lot?.state==='active'){db.prepare('UPDATE credit_lots SET remaining=remaining+? WHERE id=?').run(spend.amount,lot.id);if(lot.expires>Date.now())returned+=spend.amount;}
        db.prepare('UPDATE credit_spends SET refunded=1 WHERE job_id=? AND lot_id=?').run(job,spend.lot_id);
      }
      ledger(user,job,returned,'refund');balance(user);return returned;
    },
    freeze(source) {
      const lot=db.prepare('SELECT * FROM credit_lots WHERE source=?').get(source);if(!lot)throw fault(409,'지급 내역을 확인할 수 없습니다.');
      if(lot.remaining!==lot.granted)throw fault(409,'사용한 크레딧이 있어 자동 전액 환불할 수 없습니다.');
      if(lot.state==='revoked')return lot;
      db.prepare("UPDATE credit_lots SET state='refund_pending' WHERE id=?").run(lot.id);balance(lot.user_id);return lot;
    },
    revoke(source) {
      const lot=db.prepare('SELECT * FROM credit_lots WHERE source=?').get(source);if(!lot||lot.state==='revoked')return;
      db.prepare("UPDATE credit_lots SET state='revoked',remaining=0 WHERE id=?").run(lot.id);ledger(lot.user_id,null,-lot.remaining,`revoke:${source}`);balance(lot.user_id);
    },
    transaction,
  };
}
