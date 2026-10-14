import {renderReport} from './report.js';
const $=id=>document.getElementById(id);
async function load(){
 $('retry').hidden=true;$('report-content').setAttribute('aria-busy','true');
 $('report-status').textContent='Uw opgeslagen rapport wordt geladen…';
 try{
  const id=window.location.pathname.split('/').pop();
  const response=await fetch('/api/rapport/'+encodeURIComponent(id));
  if(!response.ok)throw new Error(response.status===404?'Dit rapport is niet gevonden. Controleer de link of zoek het adres opnieuw.':'Het rapport kan tijdelijk niet worden geladen. Probeer opnieuw.');
  const snapshot=await response.json();
  renderReport(snapshot.address,snapshot.bag,snapshot.cbs,new Date(snapshot.fetchedAt),snapshot.cbsFailed,undefined,snapshot.analysis);
  const title=$('report-content').querySelector('.report-cover h2');
  if(title){const h1=document.createElement('h1');h1.textContent=title.textContent;title.replaceWith(h1);}
  const extras=$('report-content').querySelector('a[href="#uitbreidingen"]');if(extras)extras.href='/#uitbreidingen';
  document.title=snapshot.address.weergavenaam+' — Huisrapport';
  $('print').disabled=false;$('share').disabled=false;$('report-status').textContent='';
 }catch(error){$('report-content').replaceChildren();$('report-status').textContent=error.message;$('retry').hidden=false;}
 finally{$('report-content').setAttribute('aria-busy','false');}
}
$('print').addEventListener('click',()=>window.print());
$('retry').addEventListener('click',load);
$('share').addEventListener('click',async()=>{
 const url=window.location.origin+window.location.pathname;
 try{await navigator.clipboard.writeText(url);$('share-status').textContent='Link gekopieerd. U kunt het rapport nu delen.';}
 catch{$('manual-share').hidden=false;$('report-link').value=url;$('report-link').focus();$('report-link').select();$('share-status').textContent='Kopieer de link uit het veld hieronder.';}
});
load();
