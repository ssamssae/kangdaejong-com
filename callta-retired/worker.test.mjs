import test from 'node:test';
import assert from 'node:assert/strict';
import worker from './worker.mjs';
test('retired Callta cannot create a session, prepare speech or send mail',async()=>{
 for(const method of ['GET','HEAD','POST','PUT','PATCH','DELETE','OPTIONS']){
  for(const route of ['/','/index.html','/api/session','/api/prepare','/api/summary','/web/app.js','/missing']){
   const response=worker.fetch({method,url:'https://callta.kangdaejong.com'+route,get body(){throw Error('body read');}},new Proxy({},{get(){throw Error('binding accessed');}}));
   assert.equal(response.status,410);assert.match(response.headers.get('x-robots-tag'),/noindex/);
   const text=await response.text();
   if(method==='HEAD')assert.equal(text,'');
   else if(method==='GET'&&['/','/index.html'].includes(route)){assert.match(text,/콜타 서비스를/);assert.doesNotMatch(text,/<(?:script|form|input)\b/);}
   else assert.equal(JSON.parse(text).error,'SERVICE_RETIRED');
  }
 }
});
