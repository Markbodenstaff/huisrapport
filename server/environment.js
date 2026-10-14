import {readFile} from 'node:fs/promises';
import {parseEnv} from 'node:util';
const keys=new Set(['DB_HOST','DB_PORT','DB_NAME','DB_USER','DB_PASSWORD','DB_SSL','NODE_ENV','APP_ORIGIN','LOG_REPORTS','REPORT_RETENTION_DAYS','ADMIN_USER','ADMIN_PASSWORD']);
export async function loadEnvironment(env=process.env,paths=[new URL('../../../.env-local',import.meta.url),new URL('../.env',import.meta.url)]) {
 for(const path of paths){
  let contents;try{contents=await readFile(path,'utf8');}catch(error){if(error.code==='ENOENT')continue;throw error;}
  const parsed=parseEnv(contents);
  for(const [key,value] of Object.entries(parsed))if(keys.has(key) && env[key]===undefined)env[key]=value;
 }
}
