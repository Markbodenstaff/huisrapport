import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from '../server/index.js';
import {sharedReports,validReportId} from '../server/shared-reports.js';
const id='12345678-1234-4234-8234-123456789abc';
const snapshot={address:{id:'adr-example',weergavenaam:'Teststraat 1, Teststad'},bag:{object:null,pands:[],urls:[]},cbs:{properties:null,urls:[]},fetchedAt:'2026-10-14T06:00:00.000Z',cbsFailed:false};
test('shareable reports persist once and reopen without fetching source data',async t=>{
 const entries=new Map();let lookups=0;
 const shared={save:async data=>{entries.set(id,structuredClone(data));return id;},get:async key=>entries.get(key)||null};
 const server=await createServer({shared,appOrigin:'https://huisrapport.example',getReport:async()=>{lookups++;return snapshot;}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>server.close(r)));
 const base='http://127.0.0.1:'+server.address().port;
 const home=await(await fetch(base)).text();assert.match(home,/Iedereen met de link/);assert.doesNotMatch(home,/id="report"/);
 const response=await fetch(base+'/api/report',{method:'POST',headers:{Origin:'https://huisrapport.example','Content-Type':'application/json'},body:JSON.stringify({id:'adr-example',snapshot:{address:'forged'}})});
 assert.equal(response.status,200);assert.equal((await response.json()).reportUrl,'/rapport/'+id);
 for(let i=0;i<2;i++){
  const page=await fetch(base+'/rapport/'+id);assert.equal(page.status,200);assert.match(await page.text(),/Link kopiëren/);assert.equal(page.headers.get('cache-control'),'no-store');assert.equal(page.headers.get('referrer-policy'),'no-referrer');assert.match(page.headers.get('x-robots-tag'),/noindex/);
  assert.deepEqual(await(await fetch(base+'/api/rapport/'+id)).json(),snapshot);
 }
 assert.equal(lookups,1);assert.equal(entries.size,1);
 assert.equal((await fetch(base+'/rapport/'+id,{method:'HEAD'})).status,200);
 assert.equal((await fetch(base+'/api/rapport/'+id,{method:'POST'})).status,405);
 assert.equal((await fetch(base+'/api/rapport/12345678-1234-4234-8234-123456789abd')).status,404);
 assert.equal((await fetch(base+'/api/rapport/not-valid')).status,404);
 assert.equal((await fetch(base+'/api/rapport/12345678-1234-1234-1234-123456789abc')).status,404);
 assert.equal((await fetch(base+'/admin/report/'+id)).status,503);
});
test('storage failure never returns a shareable success',async t=>{
 const server=await createServer({shared:{save:async()=>{throw new Error('offline');},get:async()=>{throw new Error('offline');}},appOrigin:'https://huisrapport.example',getReport:async()=>snapshot});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>server.close(r)));
 const base='http://127.0.0.1:'+server.address().port;
 const response=await fetch(base+'/api/report',{method:'POST',headers:{Origin:'https://huisrapport.example','Content-Type':'application/json'},body:'{"id":"adr-example"}'});
 assert.equal(response.status,503);assert.equal((await response.json()).reportUrl,undefined);
 assert.equal((await fetch(base+'/api/rapport/'+id)).status,503);
});
test('public storage uses parameterized queries and an independent table',async()=>{
 const calls=[];const pool={execute:async(sql,args)=>{calls.push({sql,args});return sql.startsWith('SELECT')?[[{snapshot:JSON.stringify(snapshot)}]]:[[]];}};
 const store=sharedReports(pool);const key=await store.save(snapshot);assert.ok(validReportId(key));assert.match(calls[0].sql,/INSERT INTO huisrapport_shared_reports/);assert.deepEqual(JSON.parse(calls[0].args[2]),snapshot);
 assert.deepEqual(await store.get(key),snapshot);assert.deepEqual(calls[1].args,[key]);
 const count=calls.length;assert.equal(await store.get('../admin'),null);assert.equal(calls.length,count);
});
