// Offline snapshot: acquire the same lock as the app; never alter its source DB.
import { DatabaseSync, backup } from 'node:sqlite';
import { open, mkdir, chmod, writeFile, unlink, rm, realpath, lstat, stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
export async function backupDatabase(source, destination) {
  if((await lstat(source)).isSymbolicLink())throw new Error('Use the original database path, not a symlink');
  source=await realpath(source);destination=resolve(destination);
  const lock=await open(source+'.lock','wx',0o600);
  let db,created=false;
  try {
    await lock.writeFile(`${process.pid}\n`);
    await mkdir(destination,{mode:0o700});created=true;
    const target=join(destination,'photo.sqlite');
    await writeFile(target,'',{flag:'wx',mode:0o600});
    db=new DatabaseSync(source,{readOnly:true});
    if(db.prepare('PRAGMA quick_check').all().some(r=>r.quick_check!=='ok'))throw new Error('Source database integrity check failed');
    await backup(db,target);db.close();db=null;
    await chmod(target,0o600);
    const check=new DatabaseSync(target,{readOnly:true});
    try {
      if(check.prepare('PRAGMA integrity_check').all().some(r=>r.integrity_check!=='ok')||check.prepare('PRAGMA foreign_key_check').all().length)throw new Error('Snapshot integrity check failed');
    } finally { check.close(); }
    const hash=createHash('sha256');
    for await(const chunk of createReadStream(target))hash.update(chunk);
    const manifest={format:1,createdAt:new Date().toISOString(),file:'photo.sqlite',bytes:(await stat(target)).size,sha256:hash.digest('hex'),integrity:'ok',containsPersonalData:true};
    await writeFile(join(destination,'manifest.json'),JSON.stringify(manifest,null,2)+'\n',{flag:'wx',mode:0o600});
    return manifest;
  } catch(error) {
    if(created)await rm(destination,{recursive:true,force:true});
    throw error;
  } finally {
    db?.close();await lock.close();await unlink(source+'.lock');
  }
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  const [source,destination]=process.argv.slice(2);
  if(!source||!destination)throw new Error('Usage: node scripts/backup.mjs <stopped-photo.sqlite> <new-private-directory>');
  console.log(JSON.stringify(await backupDatabase(source,destination)));
}
