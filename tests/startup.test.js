import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {safeErrorCode} from '../server/diagnostics.js';
const root=fileURLToPath(new URL('..',import.meta.url));
function environment(extra={}){
 const env={...process.env,PORT:'0',NODE_ENV:'test',...extra};
 for(const key of ['DB_HOST','DB_PORT','DB_NAME','DB_USER','DB_PASSWORD','DB_SSL','ADMIN_USER','ADMIN_PASSWORD','LOG_REPORTS'])delete env[key];
 if(!('APP_ORIGIN' in extra))delete env.APP_ORIGIN;
 return env;
}
test('directory startup works and diagnostic file cannot be downloaded',{timeout:15000},async t=>{
 const child=spawn(process.execPath,['.'],{cwd:root,env:environment(),stdio:['ignore','pipe','pipe']});
 t.after(()=>{child.kill('SIGTERM');});
 const port=await new Promise((resolve,reject)=>{let output='';child.stdout.on('data',chunk=>{output+=chunk;const match=/gestart op poort (\d+)/.exec(output);if(match)resolve(Number(match[1]));});child.once('error',reject);child.once('exit',code=>reject(new Error('Startup exited: '+code)));});
 const response=await fetch(`http://127.0.0.1:${port}/health`);assert.deepEqual(await response.json(),{ok:true});
 assert.equal((await fetch(`http://127.0.0.1:${port}/.startup-status.json`)).status,404);
 const status=JSON.parse(await readFile(root+'/.startup-status.json','utf8'));assert.ok(status.events.some(e=>e.stage==='listening'));assert.ok(status.events.some(e=>e.stage==='modules-loaded'));
});
test('invalid origin records a safe startup failure',{timeout:15000},async()=>{
 const child=spawn(process.execPath,['.'],{cwd:root,env:environment({APP_ORIGIN:'invalid-secret-value'}),stdio:'ignore'});
 const code=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('exit',resolve);});assert.equal(code,1);
 const raw=await readFile(root+'/.startup-status.json','utf8');assert.doesNotMatch(raw,/invalid-secret-value/);
 assert.equal(JSON.parse(raw).events.at(-1).code,'ERR_INVALID_URL');
});
test('unknown errors never expose credential-bearing messages',()=>{
 assert.equal(safeErrorCode({code:'ER_ACCESS_DENIED_ERROR',message:'password secret'}),'ER_ACCESS_DENIED_ERROR');
 assert.equal(safeErrorCode({code:'secret password',message:'secret password'}),'UNKNOWN_ERROR');
});
