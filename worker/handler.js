export const OPTIONS=['last-sale','sale-history','comparables','ownership-history','environment'];
const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export async function handle(request,env,assets){
 const url=new URL(request.url);
 if(url.pathname==='/api/interesse'){
  if(request.method!=='POST')return reply({error:'Gebruik het interesseformulier.'},405);
  if(request.headers.get('Origin')!==url.origin)return reply({error:'Verstuur uw keuze vanaf deze website.'},403);
  if(!request.headers.get('Content-Type')?.startsWith('application/json'))return reply({error:'Ongeldig verzoek.'},415);
  if(Number(request.headers.get('Content-Length'))>4096)return reply({error:'Verzoek te groot.'},413);
  let input;try{const body=await request.text();if(body.length>4096)return reply({error:'Verzoek te groot.'},413);input=JSON.parse(body);}catch{return reply({error:'Ongeldig verzoek.'},400);}
  if(!input || !/^[a-f0-9-]{36}$/i.test(input.id || '') || !Array.isArray(input.options) || input.options.length<1 || input.options.length>OPTIONS.length || !input.options.every(o=>OPTIONS.includes(o)) || new Set(input.options).size!==input.options.length)return reply({error:'Kies minimaal één geldig onderdeel.'},400);
  if(!env.BUCKET)return reply({error:'Interesse opslaan is tijdelijk niet beschikbaar. Probeer later opnieuw.'},503);
  try{await env.BUCKET.put('interest/'+input.id+'.json',JSON.stringify({options:input.options,createdAt:new Date().toISOString(),version:1}),{httpMetadata:{contentType:'application/json'}});return reply({saved:true});}catch{return reply({error:'Opslaan is niet gelukt. Probeer later opnieuw.'},503);}
 }
 if(url.pathname==='/api/interesse-totaal'){
  if(request.method!=='GET')return reply({error:'Niet toegestaan.'},405);
  if(!env.BUCKET)return reply({error:'Tellingen niet beschikbaar.'},503);
  try{let cursor;const counts=Object.fromEntries(OPTIONS.map(o=>[o,0]));let responses=0;do{const page=await env.BUCKET.list({prefix:'interest/',cursor,limit:1000});for(const object of page.objects){const entry=await env.BUCKET.get(object.key);if(!entry)continue;const data=await entry.json();responses++;for(const option of data.options || [])if(option in counts)counts[option]++;}cursor=page.truncated?page.cursor:undefined;}while(cursor);return reply({responses,counts});}catch{return reply({error:'Tellingen niet beschikbaar.'},503);}
 }
 if(request.method!=='GET' && request.method!=='HEAD')return new Response('Niet toegestaan',{status:405});
 const asset=assets[url.pathname==='/'?'/index.html':url.pathname];
 if(!asset)return new Response('Pagina niet gevonden',{status:404});
 return new Response(request.method==='HEAD'?null:asset.body,{headers:{'Content-Type':asset.type,'Cache-Control':'public, max-age=0, must-revalidate','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin'}});
}
