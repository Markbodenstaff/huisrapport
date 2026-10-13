import {writeFileSync,renameSync} from 'node:fs';
const events=[];
const allowedCodes=new Set(['ECONNREFUSED','ENOTFOUND','ETIMEDOUT','EADDRINUSE','EACCES','EINVAL','ERR_INVALID_URL','ERR_MODULE_NOT_FOUND','MODULE_NOT_FOUND','ERR_SOCKET_BAD_PORT','ER_ACCESS_DENIED_ERROR','ER_BAD_DB_ERROR','ER_TABLEACCESS_DENIED_ERROR','ER_DBACCESS_DENIED_ERROR','ER_NO_SUCH_TABLE']);
export function safeErrorCode(error){return allowedCodes.has(error?.code)?error.code:'UNKNOWN_ERROR';}
export function checkpoint(stage,code){
 events.push({time:new Date().toISOString(),stage,...(code?{code}: {})});
 if(events.length>20)events.shift();
 const port=process.env.PORT;
 const status={node:process.version,portProvided:Boolean(port),numericPort:port && /^\d+$/.test(port)?Number(port):null,events};
 try{
  const target=new URL('../.startup-status.json',import.meta.url);
  const temporary=new URL('../.startup-status.json.tmp',import.meta.url);
  writeFileSync(temporary,JSON.stringify(status,null,2),{mode:0o600});renameSync(temporary,target);
 }catch{console.error('Diagnosebestand kon niet worden opgeslagen.');}
}
