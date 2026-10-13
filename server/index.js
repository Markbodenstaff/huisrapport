import http from 'node:http';
import {safeErrorCode} from './diagnostics.js';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {handle} from '../worker/handler.js';
import {databasePool,mysqlBucket,initializeDatabase} from './storage.js';
import {reportHistory,retentionDays} from './history.js';
import {lookupReport} from './reports.js';
import {adminAuthorized,privateHeaders,dashboard,archivePage} from './admin.js';
const files=[['index.html','text/html; charset=utf-8'],['app.js','text/javascript; charset=utf-8'],['report.js','text/javascript; charset=utf-8'],['data.js','text/javascript; charset=utf-8'],['interest.js','text/javascript; charset=utf-8'],['styles.css','text/css; charset=utf-8']];
export async function createServer({bucket,history,appOrigin=process.env.APP_ORIGIN,adminUser=process.env.ADMIN_USER,adminPassword=process.env.ADMIN_PASSWORD,days=365,getReport=lookupReport}={}) {
 const assets=Object.fromEntries(await Promise.all(files.map(async([name,type])=>['/'+name,{body:await readFile(new URL('../public/'+name,import.meta.url),'utf8'),type}])));
 const configuredOrigin=appOrigin ? new URL(appOrigin).origin : null;
 const adminEnabled=Boolean(adminUser && adminPassword?.length>=16 && (process.env.NODE_ENV!=='production' || configuredOrigin?.startsWith('https://')));
 const archiveEnabled=Boolean(history && adminEnabled && retentionDays(days));
 if(archiveEnabled){
  assets['/index.html'].body=assets['/index.html'].body.replace('Zoekopdrachten worden niet door de applicatie opgeslagen.',`Wanneer u een rapport opent, bewaren we het gekozen adres, tijdstip en bijbehorende openbare rapportgegevens ${days} dagen in een afgeschermde database. We koppelen dit niet aan uw naam, e-mailadres of IP-adres.`).replace('<div class="trust-row">',`<p class="source-note">Als u een rapport opent, bewaren we het gekozen adres en de rapportgegevens ${days} dagen voor inzicht in het gebruik van Huisrapport. Deze gegevens zijn alleen toegankelijk voor de beheerder.</p><div class="trust-row">`);
 }

 return http.createServer(async(req,res)=>{
  try {
   // APP_ORIGIN is authoritative behind HTTPS proxies; forwarded headers are not trusted.
   const origin=configuredOrigin || `http://localhost:${req.socket.localPort}`;
   const url=new URL(req.url,origin);
   if(url.origin!==origin) {res.writeHead(400);res.end('Ongeldig verzoek.');return;}
   if(url.pathname==='/admin' || url.pathname.startsWith('/admin/')) {
    if(!adminEnabled){res.writeHead(503,privateHeaders);res.end('Beheer is nog niet ingesteld.');return;}
    if(!adminAuthorized(req.headers.authorization,adminUser,adminPassword)){res.writeHead(401,{...privateHeaders,'WWW-Authenticate':'Basic realm="Huisrapport beheer", charset="UTF-8"'});res.end('Log in om dit overzicht te bekijken.');return;}
    if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,privateHeaders);res.end();return;}
    let body,type='text/html; charset=utf-8',status=200;
    if(url.pathname==='/admin'){
     const currentPage=Math.max(1,Math.min(100000,Number.parseInt(url.searchParams.get('page'),10)||1));
     const rows=archiveEnabled?await history.list(currentPage):[];
     const totals=await handle(new Request(origin+'/api/interesse-totaal'),{BUCKET:bucket},assets);
     body=dashboard(rows,totals.ok?await totals.json():null,days,currentPage);
    }else{
     const match=/^\/admin\/report\/([a-f0-9-]{36})(\.json)?$/.exec(url.pathname);
     const snapshot=match && archiveEnabled?await history.get(match[1]):null;
     if(!snapshot){status=404;body='Rapport niet gevonden.';type='text/plain; charset=utf-8';}
     else if(match[2]){type='application/json';body=JSON.stringify(snapshot);}
     else body=archivePage(match[1]);
    }
    res.writeHead(status,{...privateHeaders,'Content-Type':type});res.end(req.method==='HEAD'?undefined:body);return;
   }
   if(url.pathname==='/health' && ['GET','HEAD'].includes(req.method)) {res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(req.method==='HEAD'?undefined:'{"ok":true}');return;}
   if(url.pathname.startsWith('/api/') && !configuredOrigin && process.env.NODE_ENV==='production') {res.writeHead(503,{'Content-Type':'application/json'});res.end('{"error":"Interesse opslaan is nog niet ingesteld."}');return;}
   const chunks=[];let size=0;
   for await(const chunk of req) {
    size+=chunk.length;
    if(size>4096) {res.writeHead(413,{'Content-Type':'application/json','Connection':'close'});res.end('{"error":"Verzoek te groot."}');return;}
    chunks.push(chunk);
   }
   if(url.pathname==='/api/report'){
    const send=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
    if(req.method!=='POST'){send(405,{error:'Gebruik de adreszoeker.'});return;}
    if(req.headers.origin!==origin){send(403,{error:'Open het rapport vanaf deze website.'});return;}
    if(!req.headers['content-type']?.startsWith('application/json')){send(415,{error:'Ongeldig verzoek.'});return;}
    let input;try{input=JSON.parse(Buffer.concat(chunks).toString());}catch{send(400,{error:'Ongeldig verzoek.'});return;}
    if(typeof input.id!=='string' || !/^[a-zA-Z0-9_.-]{1,100}$/.test(input.id)){send(400,{error:'Kies een geldig adres.'});return;}
    const controller=new AbortController();res.on('close',()=>controller.abort());
    let snapshot;try{snapshot=await getReport(input.id,controller.signal);}catch{send(502,{error:'Rapport tijdelijk niet beschikbaar. Probeer opnieuw.'});return;}
    if(controller.signal.aborted)return;
    if(archiveEnabled){try{await history.save(snapshot);}catch{console.error('Rapportarchief kon niet worden bijgewerkt.');}}
    send(200,snapshot);return;
   }
   const request=new Request(url,{method:req.method,headers:req.headers,...(!['GET','HEAD'].includes(req.method)?{body:Buffer.concat(chunks)}:{})});
   const response=await handle(request,{BUCKET:bucket},assets);
   res.writeHead(response.status,Object.fromEntries(response.headers));
   res.end(req.method==='HEAD'?undefined:Buffer.from(await response.arrayBuffer()));
  }catch {res.writeHead(500,{...privateHeaders,'Content-Type':'application/json'});res.end('{"error":"Verzoek kon niet worden verwerkt."}');}
 });
}
export async function start({checkpoint=()=>{}}={}) {
 checkpoint('configuration-loading');
 const pool=await databasePool();
 if(pool){checkpoint('database-initializing');try{await initializeDatabase(pool);checkpoint('database-ready');console.log('Databasetabellen gereed.');}catch(error){checkpoint('database-unavailable',safeErrorCode(error));console.error('Databasetabellen niet bereikbaar; controleer de database-instellingen en rechten.');}}else checkpoint('database-not-configured');
 const days=retentionDays(process.env.REPORT_RETENTION_DAYS || '365');
 const archiveConfigured=process.env.LOG_REPORTS==='true' && pool && days && process.env.ADMIN_USER && process.env.ADMIN_PASSWORD?.length>=16 && process.env.APP_ORIGIN?.startsWith('https://');
 const history=archiveConfigured?reportHistory(pool,days):undefined;
 let purgeTimer;
 if(history){const purge=()=>history.purge().catch(error=>{checkpoint('retention-check-failed',safeErrorCode(error));console.error('Bewaartermijncontrole kon niet worden uitgevoerd.');});checkpoint('retention-check');await purge();purgeTimer=setInterval(purge,86400000);purgeTimer.unref();}
 checkpoint('http-server-creating');
 const server=await createServer({bucket:pool?mysqlBucket(pool):undefined,history,days:days||365});
 const port=Number(process.env.PORT || 3000);
 server.requestTimeout=15000;server.headersTimeout=10000;
 checkpoint('http-server-starting');
 server.once('error',error=>{checkpoint('http-server-failed',safeErrorCode(error));console.error('Server kon niet luisteren. Foutcode: '+safeErrorCode(error));clearInterval(purgeTimer);pool?.end().catch(()=>{});process.exitCode=1;});
 server.listen(port,'0.0.0.0',()=>{checkpoint('listening');console.log(`Huisrapport gestart op poort ${server.address().port}.`);});
 const shutdown=()=>{clearInterval(purgeTimer);server.close(async()=>{await pool?.end();process.exit(0);});setTimeout(()=>process.exit(1),10000).unref();};
 process.on('SIGTERM',shutdown);process.on('SIGINT',shutdown);
}
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) start().catch(()=>{console.error('Huisrapport kon niet starten. Controleer de serverinstellingen.');process.exitCode=1;});
