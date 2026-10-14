import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const id='12345678-1234-4234-8234-123456789abc';
test('address selection navigates only after successful persistent storage',async()=>{
 const source=(await readFile(new URL('../public/app.js',import.meta.url),'utf8')).replace("import {search} from './data.js';",'');
 const nodes=new Map();const node=key=>{if(!nodes.has(key))nodes.set(key,{textContent:'',disabled:false,addEventListener(){},setAttribute(){},querySelectorAll(){return [];}});return nodes.get(key);};
 const destinations=[];let response={ok:true,json:async()=>({reportUrl:'/rapport/'+id})};
 const context=vm.createContext({document:{getElementById:node},AbortController,fetch:async()=>response,window:{location:{assign:url=>destinations.push(url)}}});
 vm.runInContext(source,context);await vm.runInContext("loadReport({id:'adr-example'})",context);assert.deepEqual(destinations,['/rapport/'+id]);
 response={ok:false};await vm.runInContext("loadReport({id:'adr-example'})",context);assert.equal(destinations.length,1);assert.match(node('search-status').textContent,/opnieuw/);
 response={ok:true,json:async()=>({})};await vm.runInContext("loadReport({id:'adr-example'})",context);assert.equal(destinations.length,1);assert.match(node('search-status').textContent,/nog niet beschikbaar/);
});
test('report page shares its permanent URL and offers manual clipboard fallback',async()=>{
 const handlers=new Map();const nodes=new Map();
 const node=key=>{if(!nodes.has(key))nodes.set(key,{textContent:'',hidden:true,disabled:true,value:'',focus(){this.focused=true;},select(){this.selected=true;},setAttribute(){},replaceChildren(){},querySelector(){return null;},addEventListener(event,fn){handlers.set(key+':'+event,fn);}});return nodes.get(key);};
 const snapshot={address:{weergavenaam:'Teststraat 1'},bag:{},cbs:{},fetchedAt:'2026-10-14T06:00:00Z'};
 const source=(await readFile(new URL('../public/report-page.js',import.meta.url),'utf8')).replace("import {renderReport} from './report.js';",'');
 let copied;
 const context=vm.createContext({document:{getElementById:node},window:{location:{origin:'https://example.test',pathname:'/rapport/'+id},print(){}},navigator:{clipboard:{writeText:async url=>{copied=url;}}},fetch:async()=>({ok:true,json:async()=>snapshot}),renderReport(){},Date});
 vm.runInContext(source,context);await vm.runInContext('load()',context);
 assert.equal(node('share').disabled,false);await handlers.get('share:click')();assert.equal(copied,'https://example.test/rapport/'+id);
 context.navigator.clipboard.writeText=async()=>{throw new Error('denied');};await handlers.get('share:click')();
 assert.equal(node('manual-share').hidden,false);assert.equal(node('report-link').value,copied);assert.equal(node('report-link').selected,true);
});
