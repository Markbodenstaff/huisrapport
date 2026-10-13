export const LOCATION = 'https://api.pdok.nl/bzk/locatieserver/search/v3_1';
export const BAG = 'https://api.pdok.nl/kadaster/bag/ogc/v2';
export const CBS = 'https://api.pdok.nl/cbs/wijken-en-buurten-2024/ogc/v1';
export function available(value) { return typeof value === 'number' && Number.isFinite(value) && value >= 0; }
export function number(value, suffix = '', factor = 1) { return available(value) ? new Intl.NumberFormat('nl-NL',{maximumFractionDigits:1}).format(value * factor) + suffix : 'Niet beschikbaar'; }
export function text(value) { return value === null || value === undefined || value === '' ? 'Niet beschikbaar' : String(value); }
export function point(wkt) { const match = /^POINT\(\s*(-?[\d.]+)\s+(-?[\d.]+)\s*\)$/.exec(wkt || ''); return match ? [Number(match[1]),Number(match[2])] : null; }
export function inRing(p, ring) { let inside = false; for (let i=0,j=ring.length-1;i<ring.length;j=i++) { const a=ring[i],b=ring[j]; if (((a[1]>p[1]) !== (b[1]>p[1])) && p[0] < (b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0]) inside=!inside; } return inside; }
export function contains(geometry,p) { if(!geometry || !p) return false; const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.type === 'MultiPolygon' ? geometry.coordinates : []; return polygons.some(rings=>inRing(p,rings[0]) && !rings.slice(1).some(r=>inRing(p,r))); }
export function exactFeature(data,key,id) { return data.features?.find(f=>String(f.properties?.[key])===String(id)) || null; }
export async function json(url, signal) {
 const controller = new AbortController(); const cancel = ()=>controller.abort();
 if(signal?.aborted) controller.abort(); else signal?.addEventListener('abort',cancel,{once:true});
 const timeout=setTimeout(()=>controller.abort(),20000);
 try { const response = await fetch(url,{signal:controller.signal,headers:{Accept:'application/json'}}); if(!response.ok) throw new Error('Bron tijdelijk niet bereikbaar ('+response.status+').'); return await response.json(); }
 finally {clearTimeout(timeout); signal?.removeEventListener('abort',cancel);}
}
export function searchURL(query) { const url = new URL(LOCATION+'/free'); url.search=new URLSearchParams({q:query,fq:'type:adres',rows:'8'}); return url.href; }
export async function search(query,signal) { const data=await json(searchURL(query),signal); return (data.response?.docs || []).filter(d=>d.type==='adres'); }
export async function building(address,signal) {
 const id=address.adresseerbaarobject_id;
 if(!/^\d{16}$/.test(id || '')) return {object:null,pands:[],urls:[],message:'Dit adres heeft geen verblijfsobject; pandgegevens zijn niet beschikbaar.'};
 const url=BAG+'/collections/verblijfsobject/items?'+new URLSearchParams({f:'json',limit:'5',identificatie:id});
 const data=await json(url,signal); const feature=exactFeature(data,'identificatie',id);
 if(!feature) return {object:null,pands:[],urls:[url],message:'Geen bijbehorend verblijfsobject gevonden in de BAG.'};
 const links=feature.properties['pand.href'] || [];
 const results=await Promise.allSettled(links.filter(h=>h.startsWith(BAG+'/collections/pand/items/')).map(h=>json(h+'?f=json',signal)));
 return {object:feature.properties,pands:results.filter(r=>r.status==='fulfilled').map(r=>r.value.properties),urls:[url,...links],message:results.some(r=>r.status==='rejected')?'Een deel van de pandgegevens kon niet worden opgehaald.':null};
}
export async function neighbourhood(address,signal) {
 const id=address.buurtcode; const urls=[];
 if(/^BU\d{8}$/.test(id || '')) {
  const url=CBS+'/collections/buurten/items?'+new URLSearchParams({f:'json',limit:'5',buurtcode:id}); urls.push(url);
  const data=await json(url,signal); const feature=exactFeature(data,'buurtcode',id);
  if(feature) return {properties:feature.properties,urls};
 }
 const p=point(address.centroide_ll); if(!p) return {properties:null,urls};
 const url=CBS+'/collections/buurten/items?'+new URLSearchParams({f:'json',limit:'100',bbox:[p[0]-.00001,p[1]-.00001,p[0]+.00001,p[1]+.00001].join(',')}); urls.push(url);
 const data=await json(url,signal); return {properties:data.features?.find(f=>contains(f.geometry,p))?.properties || null,urls};
}
