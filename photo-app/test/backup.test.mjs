import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp,rm,readFile,stat,writeFile,symlink } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { createStore } from '../store.mjs';
import { backupDatabase } from '../scripts/backup.mjs';
test('offline backup restores wallet, photo bytes, request dedup and owner lock without overwriting files',async t=>{
  const dir=await mkdtemp(join(tmpdir(),'photo-backup-'));t.after(()=>rm(dir,{recursive:true,force:true}));
  const path=join(dir,'photo.sqlite'),snapshot=join(dir,'snapshot'),store=createStore(path);
  t.after(()=>{try{store.close();}catch{}});
  const user=store.register('backup-fixture','not-a-real-password');
  const options={category:'portrait',preset:'natural',strength:60};
  const job=store.reserve(user,'backup-request-001','fingerprint',options);
  const bytes=Buffer.from('synthetic-photo-fixture');
  store.db.prepare("UPDATE jobs SET status='done',original=?,output=?,width=1,height=1 WHERE id=?").run(bytes,bytes,job.id);
  await assert.rejects(backupDatabase(path,snapshot),{code:'EEXIST'});
  const alias=join(dir,'alias.sqlite');await symlink(path,alias);
  await assert.rejects(backupDatabase(alias,snapshot),/not a symlink/);
  assert.equal(store.wallet.balance(user),2);store.close();
  const result=await backupDatabase(path,snapshot);
  assert.equal(result.integrity,'ok');assert.equal((await stat(join(snapshot,'photo.sqlite'))).mode&0o777,0o600);
  assert.equal((await stat(snapshot)).mode&0o777,0o700);
  assert.equal(result.sha256,createHash('sha256').update(await readFile(join(snapshot,'photo.sqlite'))).digest('hex'));
  await assert.rejects(backupDatabase(path,snapshot),{code:'EEXIST'});
  const restored=createStore(join(snapshot,'photo.sqlite'));
  try {
    assert.equal(restored.wallet.balance(user),2);
    assert.deepEqual(Buffer.from(restored.db.prepare('SELECT output FROM jobs WHERE id=?').get(job.id).output),bytes);
    assert.equal(restored.reserve(user,'backup-request-001','fingerprint',options).reused,true);
    assert.equal(restored.wallet.balance(user),2);
  } finally {restored.close();}
  const invalid=join(dir,'invalid.sqlite');await writeFile(invalid,'invalid');
  await assert.rejects(backupDatabase(invalid,join(dir,'failed')));
  await assert.rejects(stat(invalid+'.lock'),{code:'ENOENT'});
  await assert.rejects(stat(join(dir,'failed')),{code:'ENOENT'});
});
