const form=document.getElementById('interest-form'),button=document.getElementById('interest-submit'),status=document.getElementById('interest-status');
const chosen=()=>[...form.querySelectorAll('input[name="extra"]:checked')].map(el=>el.value);
form.addEventListener('change',()=>{const count=chosen().length;button.disabled=count===0;document.getElementById('interest-count').textContent=count?count+' onderdeel'+(count===1?'':'en')+' gekozen':'Kies één of meer onderdelen';status.textContent='';});
let memoryId;
function voteId(){try{const existing=localStorage.getItem('huisrapport-interest-id');if(existing && /^[a-f0-9-]{36}$/i.test(existing))return existing;const id=crypto.randomUUID();localStorage.setItem('huisrapport-interest-id',id);return id;}catch{return memoryId ||= crypto.randomUUID();}}
form.addEventListener('submit',async event=>{
 event.preventDefault();const options=chosen();if(!options.length)return;
 button.disabled=true;button.textContent='Interesse doorgeven…';status.textContent='';
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),15000);
 try{const response=await fetch('/api/interesse',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:voteId(),options}),signal:controller.signal});const data=await response.json();if(!response.ok || !data.saved)throw new Error(data.error || 'Opslaan is niet gelukt.');status.textContent='Bedankt! Uw interesse is opgeslagen. Dit is geen bestelling; u hoeft niets te betalen. U kunt uw keuze aanpassen en opnieuw doorgeven.';}
 catch(error){status.textContent=error.name==='AbortError'?'Het opslaan duurt te lang. Probeer het opnieuw.':error.message || 'Opslaan is niet gelukt. Probeer het opnieuw.';}
 finally{clearTimeout(timeout);button.disabled=chosen().length===0;button.textContent='Geef mijn interesse door';}
});
