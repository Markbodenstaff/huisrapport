import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from '../server/index.js';
import {mysqlBucket} from '../server/storage.js';
test('Node server serves only public assets and keeps API failures honest',async t=>{
 const server=await createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>server.close(r)));
 const port=server.address().port,base=`http://127.0.0.1:${port}`;
 assert.match(await(await fetch(base)).text(),/Huisrapport/);
 for(const path of ['/.env','/package.json','/server/storage.js','/sources/document.pdf'])assert.equal((await fetch(base+path)).status,404);
 assert.equal((await fetch(base+'/health')).status,200);
 assert.equal((await fetch(base,{method:'HEAD'})).status,200);
 const body=JSON.stringify({id:'12345678-1234-1234-1234-123456789abc',options:['last-sale']});
 const headers={'Content-Type':'application/json',Origin:`http://localhost:${port}`};
 assert.equal((await fetch(base+'/api/interesse',{method:'POST',headers,body})).status,503);
 assert.equal((await fetch(base+'/api/interesse',{method:'POST',headers:{...headers,Origin:'https://evil.test'},body})).status,403);
 assert.equal((await fetch(base+'/api/interesse',{method:'POST',headers,body:'x'.repeat(5000)})).status,413);
});
test('MySQL adapter paginates and parameterizes storage without extra personal fields',async()=>{
 const calls=[];const pool={async execute(sql,values){calls.push({sql,values});if(sql.startsWith('SELECT id'))return [[{id:'a'},{id:'b'},{id:'c'}]];if(sql.startsWith('SELECT payload'))return [[{payload:'{"options":["last-sale"]}'}]];return [[]];}};
 const b=mysqlBucket(pool);await b.put('interest/abc.json','{"options":["last-sale"]}');
 assert.deepEqual(calls[0].values,['abc','{"options":["last-sale"]}','{"options":["last-sale"]}']);assert.match(calls[0].sql,/ON DUPLICATE KEY UPDATE/);
 const page=await b.list({limit:2});assert.equal(page.truncated,true);assert.equal(page.cursor,'b');assert.equal(page.objects.length,2);
 assert.deepEqual(await(await b.get('interest/abc.json')).json(),{options:['last-sale']});
});
test('HTTPS deployment origin permits submissions and aggregates through Node',async t=>{
 const entries=new Map();const bucket={put:async(k,v)=>entries.set(k,v),get:async k=>({json:async()=>JSON.parse(entries.get(k))}),list:async()=>({objects:[...entries.keys()].map(key=>({key})),truncated:false})};
 const server=await createServer({bucket,appOrigin:'https://huisrapport.example'});await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>server.close(r)));
 const base=`http://127.0.0.1:${server.address().port}`;
 const send=options=>fetch(base+'/api/interesse',{method:'POST',headers:{Origin:'https://huisrapport.example','Content-Type':'application/json'},body:JSON.stringify({id:'12345678-1234-1234-1234-123456789abc',options,address:'must not persist'})});
 assert.deepEqual(await(await send(['last-sale'])).json(),{saved:true});
 assert.equal((await send(['comparables'])).status,200);assert.equal(entries.size,1);
 const payload=JSON.parse([...entries.values()][0]);assert.deepEqual(Object.keys(payload).sort(),['createdAt','options','version']);
 const total=await(await fetch(base+'/api/interesse-totaal')).json();assert.equal(total.responses,1);assert.equal(total.counts.comparables,1);assert.equal(total.counts['last-sale'],0);
});
test('report snapshots and administrator pages require separate authorization',async t=>{
 const snapshot={address:{id:'adr-example',type:'adres',weergavenaam:'Voorbeeldstraat 1, Teststad',straatnaam:'Voorbeeldstraat',huis_nlt:'1'},bag:{object:null,pands:[],urls:[]},cbs:{properties:null,urls:[]},cbsFailed:false,fetchedAt:new Date().toISOString()};
 const saved=[];let reads=0;
 const history={save:async s=>saved.push(structuredClone(s)),list:async()=>{reads++;return [{id:'12345678-1234-1234-1234-123456789abc',created_at:new Date(),address:'<script>private address</script>'}];},get:async()=>{reads++;return snapshot;}};
 const password='test-only-password-123456';
 const server=await createServer({history,appOrigin:'https://huisrapport.example',adminUser:'owner',adminPassword:password,getReport:async()=>snapshot});await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>server.close(r)));
 const base=`http://127.0.0.1:${server.address().port}`,authorization='Basic '+Buffer.from('owner:'+password).toString('base64');
 assert.equal((await fetch(base+'/admin')).status,401);assert.equal(reads,0);
 assert.equal((await fetch(base+'/admin/report/12345678-1234-1234-1234-123456789abc.json')).status,401);assert.equal(reads,0);
 const home=await(await fetch(base)).text();assert.match(home,/365 dagen/);assert.doesNotMatch(home,/Zoekopdrachten worden niet door de applicatie opgeslagen/);
 const response=await fetch(base+'/api/report',{method:'POST',headers:{Origin:'https://huisrapport.example','Content-Type':'application/json'},body:JSON.stringify({id:'adr-example',address:'forged address'})});
 assert.equal(response.status,200);assert.equal(saved.length,1);assert.equal(saved[0].address.weergavenaam,snapshot.address.weergavenaam);assert.equal(saved[0].address.address,undefined);
 const admin=await fetch(base+'/admin',{headers:{authorization}});assert.equal(admin.headers.get('cache-control'),'no-store');const html=await admin.text();assert.match(html,/&lt;script&gt;private address/);assert.doesNotMatch(html,/<script>private address/);
 const archived=await fetch(base+'/admin/report/12345678-1234-1234-1234-123456789abc.json',{headers:{authorization}});assert.deepEqual(await archived.json(),snapshot);
 assert.equal((await fetch(base+'/api/report',{method:'POST',headers:{Origin:'https://evil.test','Content-Type':'application/json'},body:'{"id":"adr-example"}'})).status,403);
});
test('archive failure does not prevent viewing public report data',async t=>{
 const snapshot={address:{weergavenaam:'Voorbeeld 1'},fetchedAt:new Date().toISOString()};
 const server=await createServer({history:{save:async()=>{throw new Error('database unavailable');}},appOrigin:'https://huisrapport.example',adminUser:'owner',adminPassword:'test-password-123456',getReport:async()=>snapshot});await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>server.close(r)));
 const response=await fetch(`http://127.0.0.1:${server.address().port}/api/report`,{method:'POST',headers:{Origin:'https://huisrapport.example','Content-Type':'application/json'},body:'{"id":"adr-test"}'});assert.equal(response.status,200);assert.deepEqual(await response.json(),snapshot);
});
