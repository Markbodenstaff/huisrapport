import {json,LOCATION,building,neighbourhood} from '../public/data.js';
export async function lookupReport(id,signal) {
 if(typeof id!=='string' || !/^[a-zA-Z0-9_.-]{1,100}$/.test(id))throw new Error('Ongeldig adreskenmerk.');
 const data=await json(LOCATION+'/lookup?'+new URLSearchParams({id}),signal);
 const address=data.response?.docs?.find(a=>a.id===id && a.type==='adres');
 if(!address)throw new Error('Adres niet gevonden.');
 const fetchedAt=new Date().toISOString();
 const [bagResult,cbsResult]=await Promise.allSettled([building(address,signal),neighbourhood(address,signal)]);
 return {address,bag:bagResult.status==='fulfilled'?bagResult.value:{object:null,pands:[],urls:[],message:'BAG-pandinformatie is tijdelijk niet bereikbaar. Probeer het adres later opnieuw.'},cbs:cbsResult.status==='fulfilled'?cbsResult.value:{properties:null,urls:[]},cbsFailed:cbsResult.status==='rejected',fetchedAt};
}
