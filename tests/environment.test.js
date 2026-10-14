import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {loadEnvironment} from '../server/environment.js';
test('hosting env fallback loads only approved keys and preserves process settings',async t=>{
 const dir=await mkdtemp(join(tmpdir(),'huisrapport-env-'));t.after(()=>rm(dir,{recursive:true,force:true}));const path=join(dir,'.env-local');
 await writeFile(path,"export ADMIN_USER='owner'\nADMIN_PASSWORD='test-only-long-password'\nAPP_ORIGIN=https://markb847.sg-host.com\nDB_HOST=localhost\nPORT=1234\nUNRELATED=ignored\n");
 const env={ADMIN_USER:'already-configured',PORT:'9999'};await loadEnvironment(env,[path]);
 assert.equal(env.ADMIN_USER,'already-configured');assert.equal(env.ADMIN_PASSWORD,'test-only-long-password');assert.equal(env.APP_ORIGIN,'https://markb847.sg-host.com');assert.equal(env.PORT,'9999');assert.equal(env.UNRELATED,undefined);
});
test('missing hosting env leaves ordinary runtime deployments unchanged',async()=>{const env={};await loadEnvironment(env,['/tmp/huisrapport-does-not-exist/.env-local']);assert.deepEqual(env,{});});
