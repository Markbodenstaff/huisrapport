import {search} from './data.js';
const $=id=>document.getElementById(id);
let searchController,reportController,reportSequence=0,searchSequence=0;
async function findAddress(event){
 event?.preventDefault(); reportController?.abort(); ++reportSequence; const query=$('address').value.trim(); if(query.length<3){$('search-status').textContent='Vul minimaal drie tekens in, bijvoorbeeld een postcode en huisnummer.';$('address').setAttribute('aria-invalid','true');$('address').focus();return;}
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
 $('search-status').textContent='We maken uw rapport en slaan het op…';
 $('results').setAttribute('aria-busy','true');
 for(const button of $('results').querySelectorAll('button'))button.disabled=true;
 try{
  const response=await fetch('/api/report',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:address.id}),signal:reportController.signal});
  if(seq!==reportSequence)return;
  if(!response.ok)throw new Error('Rapport opslaan is tijdelijk niet beschikbaar. Kies uw adres opnieuw om het nogmaals te proberen.');
  const snapshot=await response.json();
  if(seq!==reportSequence)return;
  if(!/^\/rapport\/[a-f0-9-]{36}$/.test(snapshot.reportUrl || ''))throw new Error('Rapport opslaan is nog niet beschikbaar. Probeer het later opnieuw.');
  window.location.assign(snapshot.reportUrl);
 }catch(error){
  if(seq!==reportSequence || error.name==='AbortError')return;
  $('search-status').textContent=error.message || 'Rapport opslaan is tijdelijk niet beschikbaar. Probeer opnieuw.';
 }finally{
  if(seq===reportSequence){$('results').setAttribute('aria-busy','false');for(const button of $('results').querySelectorAll('button'))button.disabled=false;}
 }
}
$('search-form').addEventListener('submit',findAddress);
$('example').addEventListener('click',()=>{$('address').value='Di Lassostraat 51, Soest';findAddress();});
