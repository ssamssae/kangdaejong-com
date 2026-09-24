import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from '../server.mjs';
const dir=await mkdtemp(join(tmpdir(),'sajingyeol-browser-'));
const app=await createApp({dataDir:dir,origin:'http://127.0.0.1:4390'});
app.server.listen(4390,'127.0.0.1');
for(const signal of ['SIGINT','SIGTERM'])process.once(signal,async()=>{await app.close();await rm(dir,{recursive:true,force:true});process.exit(0);});
