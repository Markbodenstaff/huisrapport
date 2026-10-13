import test from 'node:test';
import assert from 'node:assert/strict';
import {reportHistory,retentionDays} from '../server/history.js';
import {adminAuthorized} from '../server/admin.js';
test('archive applies one-year retention to cleanup and reads',async()=>{
 assert.equal(retentionDays('365'),365);assert.equal(retentionDays('0'),null);
 const calls=[];const pool={execute:async(sql,values)=>{calls.push({sql,values});return [[]];}};
 const history=reportHistory(pool,365);await history.purge();await history.list();await history.get('test-id');
 assert.match(calls[0].sql,/DELETE.*created_at < \?/);assert.match(calls[1].sql,/created_at >= \?/);assert.match(calls[2].sql,/id = \? AND created_at >= \?/);
 for(const call of calls){const date=call.values.find(v=>v instanceof Date);assert.ok(Math.abs(Date.now()-date.getTime()-365*86400000)<5000);}
});
test('archive stores source snapshot without visitor identity',async()=>{
 const calls=[];const pool={execute:async(sql,values)=>{calls.push({sql,values});return [[]];}};const history=reportHistory(pool,365);
 await history.save({address:{weergavenaam:'Voorbeeldstraat 1'},bag:{object:{bouwjaar:1980}},fetchedAt:'2026-10-13T00:00:00Z'});
 assert.equal(calls[0].values[2],'Voorbeeldstraat 1');assert.deepEqual(JSON.parse(calls[0].values[3]).bag,{object:{bouwjaar:1980}});
 assert.match(calls[0].values[0],/^[a-f0-9-]{36}$/);
});
test('admin fails closed with absent, weak, or incorrect credentials',()=>{
 const auth='Basic '+Buffer.from('owner:test-only-password-123456').toString('base64');
 assert.equal(adminAuthorized(auth,'owner','test-only-password-123456'),true);
 assert.equal(adminAuthorized(auth,'owner','wrong-password-123456'),false);
 assert.equal(adminAuthorized(auth,'owner','short'),false);
 assert.equal(adminAuthorized(undefined,'owner','test-only-password-123456'),false);
});
