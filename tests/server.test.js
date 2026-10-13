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
