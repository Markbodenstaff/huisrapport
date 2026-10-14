import {renderReport} from './report.js';
import {search,building,neighbourhood} from './data.js';
const $=id=>document.getElementById(id);
let searchController,reportController,reportSequence=0,searchSequence=0;
async function findAddress(event){
 event?.preventDefault(); const query=$('address').value.trim(); if(query.length<3){$('search-status').textContent='Vul minimaal drie tekens in, bijvoorbeeld een postcode en huisnummer.';$('address').setAttribute('aria-invalid','true');$('address').focus();return;}
 $('address').removeAttribute('aria-invalid');
 searchController?.abort(); searchController=new AbortController(); const seq=++searchSequence;
 $('search-button').disabled=true; $('search-status').textContent='We zoeken uw adres…'; $('results').replaceChildren();
 try { const addresses=await search(query,searchController.signal); if(seq!==searchSequence)return;
  $('search-status').textContent=addresses.length?'Kies uw adres. Daarna opent uw gratis rapport.':'Geen adressen gevonden. Probeer postcode en huisnummer, of voeg de woonplaats toe.';
  for(const address of addresses){const button=document.createElement('button');button.type='button';button.append(document.createTextNode(address.weergavenaam));const label=document.createElement('span');label.textContent='Open gratis rapport →';button.append(label);button.addEventListener('click',()=>loadReport(address));$('results').append(button);}
 }catch(error){if(seq!==searchSequence)return;$('search-status').textContent='Adreszoeker tijdelijk niet bereikbaar. Controleer uw verbinding en probeer opnieuw.';}
 finally{if(seq===searchSequence)$('search-button').disabled=false;}
}
async function loadReport(address){
 reportController?.abort(); reportController=new AbortController(); const seq=++reportSequence;
 $('results').replaceChildren();$('search-status').textContent='Gekozen: '+address.weergavenaam;$('report').hidden=false;$('print').disabled=true;
 $('report-content').setAttribute('aria-busy','true');$('report-content').innerHTML='<div class="pending" role="status">We verzamelen de beschikbare woning- en buurtgegevens voor uw rapport…</div>';
 let fetchedAt=new Date();
 try {
 const snapshotResponse=await fetch('/api/report',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:address.id}),signal:reportController.signal});
 let bag,cbs,cbsFailed=false;
 if([404,405,503].includes(snapshotResponse.status)){
  // Keep public reports available on the old Worker and unconfigured Node hosting.
  const [bagResult,cbsResult]=await Promise.allSettled([building(address,reportController.signal),neighbourhood(address,reportController.signal)]);
  bag=bagResult.status==='fulfilled'?bagResult.value:{object:null,pands:[],urls:[],message:'BAG-pandinformatie is tijdelijk niet bereikbaar. Probeer het adres later opnieuw.'};
  cbs=cbsResult.status==='fulfilled'?cbsResult.value:{properties:null,urls:[]};cbsFailed=cbsResult.status==='rejected';
 }else{
  if(!snapshotResponse.ok)throw new Error('Rapport ophalen is niet gelukt.');
  const snapshot=await snapshotResponse.json();
  address=snapshot.address;bag=snapshot.bag;cbs=snapshot.cbs;cbsFailed=snapshot.cbsFailed;fetchedAt=new Date(snapshot.fetchedAt);
 }
 if(seq!==reportSequence)return;
 renderReport(address,bag,cbs,fetchedAt,cbsFailed);
 $('report-content').setAttribute('aria-busy','false');$('print').disabled=false;$('report-content').scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
 }catch(error){if(seq!==reportSequence)return;$('report-content').setAttribute('aria-busy','false');$('report-content').innerHTML='<p class="warning">Het rapport kon niet worden samengesteld. Zoek het adres opnieuw om het nogmaals te proberen.</p>';}
}
$('search-form').addEventListener('submit',findAddress);
$('example').addEventListener('click',()=>{$('address').value='Di Lassostraat 51, Soest';findAddress();});
$('print').addEventListener('click',()=>window.print());
