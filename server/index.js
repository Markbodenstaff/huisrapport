import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {handle} from '../worker/handler.js';
import {databasePool,mysqlBucket} from './storage.js';
const files=[['index.html','text/html; charset=utf-8'],['app.js','text/javascript; charset=utf-8'],['data.js','text/javascript; charset=utf-8'],['interest.js','text/javascript; charset=utf-8'],['styles.css','text/css; charset=utf-8']];
export async function createServer({bucket,appOrigin=process.env.APP_ORIGIN}={}) {
 const assets=Object.fromEntries(await Promise.all(files.map(async([name,type])=>['/'+name,{body:await readFile(new URL('../public/'+name,import.meta.url),'utf8'),type}])));
 const configuredOrigin=appOrigin ? new URL(appOrigin).origin : null;
 return http.createServer(async(req,res)=>{
  try {
   // APP_ORIGIN is authoritative behind HTTPS proxies; forwarded headers are not trusted.
   const origin=configuredOrigin || `http://localhost:${req.socket.localPort}`;
   const url=new URL(req.url,origin);
   if(url.origin!==origin) {res.writeHead(400);res.end('Ongeldig verzoek.');return;}
   if(url.pathname==='/health' && ['GET','HEAD'].includes(req.method)) {res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(req.method==='HEAD'?undefined:'{"ok":true}');return;}
   if(url.pathname.startsWith('/api/') && !configuredOrigin && process.env.NODE_ENV==='production') {res.writeHead(503,{'Content-Type':'application/json'});res.end('{"error":"Interesse opslaan is nog niet ingesteld."}');return;}
   const chunks=[];let size=0;
   for await(const chunk of req) {
    size+=chunk.length;
    if(size>4096) {res.writeHead(413,{'Content-Type':'application/json','Connection':'close'});res.end('{"error":"Verzoek te groot."}');return;}
    chunks.push(chunk);
   }
   const request=new Request(url,{method:req.method,headers:req.headers,...(!['GET','HEAD'].includes(req.method)?{body:Buffer.concat(chunks)}:{})});
   const response=await handle(request,{BUCKET:bucket},assets);
   res.writeHead(response.status,Object.fromEntries(response.headers));
   res.end(req.method==='HEAD'?undefined:Buffer.from(await response.arrayBuffer()));
  }catch {res.writeHead(500,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end('{"error":"Verzoek kon niet worden verwerkt."}');}
 });
}
async function start() {
 const pool=await databasePool();
 const server=await createServer({bucket:pool?mysqlBucket(pool):undefined});
 const port=Number(process.env.PORT || 3000);
 server.requestTimeout=15000;server.headersTimeout=10000;
 server.listen(port,'0.0.0.0',()=>console.log(`Huisrapport gestart op poort ${port}.`));
 const shutdown=()=>{server.close(async()=>{await pool?.end();process.exit(0);});setTimeout(()=>process.exit(1),10000).unref();};
 process.on('SIGTERM',shutdown);process.on('SIGINT',shutdown);
}
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) start().catch(()=>{console.error('Huisrapport kon niet starten. Controleer de serverinstellingen.');process.exitCode=1;});
