// Test-only process: no real mail, payments or AI. Never imported by server.mjs.
import { mkdtemp,rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from '../server.mjs';
import sharp from 'sharp';
const dir=await mkdtemp(join(tmpdir(),'sg-commerce-ui-')),mail=[],payments=new Map();
const receipt=o=>({orderId:o.id,paymentKey:o.payment_key??`test_${o.id}`,totalAmount:o.amount,balanceAmount:o.amount,currency:'KRW',status:'DONE',approvedAt:new Date().toISOString()});
const gateway={mode:'mock',clientKey:'test_ck_mock',lookup:async o=>{if(!payments.has(o.id))throw Object.assign(new Error('missing'),{providerCode:'NOT_FOUND_PAYMENT'});return payments.get(o.id);},confirm:async o=>{const p=receipt(o);payments.set(o.id,p);return p;},cancel:async o=>{const p={...payments.get(o.id),status:'CANCELED',balanceAmount:0};payments.set(o.id,p);return p;},issue:async x=>({customerKey:x.customerKey,billingKey:'mock-only'}),charge:async o=>{const p=receipt(o);payments.set(o.id,p);return p;}};
const images=new Map();const imageProvider={submit:async original=>{const id=crypto.randomUUID();images.set(id,await sharp(original).modulate({brightness:1.05}).png().toBuffer());return {id};},poll:async r=>({output:images.get(r.id)})};
const app=await createApp({dataDir:dir,origin:'http://127.0.0.1:4391',gateway,mailer:async m=>mail.push(m),imageProvider,encryptionKey:'bc'.repeat(32)});
const handler=app.server.listeners('request')[0];app.server.removeAllListeners('request');app.server.on('request',(req,res)=>{if(req.url==='/__test/mailbox'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify(mail));return;}return handler(req,res);});
app.server.listen(4391,'127.0.0.1');
for(const signal of ['SIGINT','SIGTERM'])process.once(signal,async()=>{await app.close();await rm(dir,{recursive:true,force:true});process.exit(0);});
