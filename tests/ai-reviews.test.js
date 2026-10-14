
import test from 'node:test';
import assert from 'node:assert/strict';
import {createReviewGenerator,reviewFacts,validateReviews} from '../server/ai-reviews.js';
const snapshot={address:{weergavenaam:'Niet versturen',postcode:'1234 AB'},bag:{object:{oppervlakte:120},pands:[{bouwjaar:1999}]},cbs:{properties:{aantal_inwoners:500,gemiddeld_aardgasverbruik:900,grote_supermarkt_gemiddelde_afstand_in_km:1}}};
const facts=reviewFacts(snapshot);
const result=Object.fromEntries(Object.keys(facts).map(topic=>[topic,{observation:'Waarneming',meaning:'Duiding',advice:'Controleer bij de bron',evidence:[Object.keys(facts[topic])[0]]}]));
const response=data=>({ok:true,json:async()=>({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(data)}]}]})});
test('AI input excludes address and suppressed data; persists typed reviews',async()=>{
 let request;
 const generate=createReviewGenerator({enabled:true,apiKey:'test',fetchImpl:async(url,options)=>{request=JSON.parse(options.body);return response(result);}});
 const analysis=await generate(snapshot);
 assert.equal(analysis.status,'available');assert.equal(analysis.reviews.length,5);
 assert.equal(analysis.reviews[0].authorType,'ai');
 assert.equal(analysis.reviews.find(r=>r.topic==='wonen').status,'insufficient');
 assert.equal(request.store,false);assert.doesNotMatch(request.input,/Niet versturen|1234 AB/);
 assert.deepEqual(reviewFacts({...snapshot,cbs:{properties:{aantal_inwoners:-99999}}}).buurt,{});
 assert.deepEqual(JSON.parse(JSON.stringify(analysis)),analysis);
});
test('missing configuration never invokes paid generation',async()=>{
 const generate=createReviewGenerator({enabled:false,fetchImpl:()=>{throw new Error('must not call');}});
 assert.equal((await generate(snapshot)).status,'not_configured');
});
test('invalid evidence, duplicate/unknown fields and API failures do not fabricate a review',async()=>{
 assert.throws(()=>validateReviews({...result,woning:{...result.woning,evidence:['vraagprijs']}},facts));
 assert.throws(()=>validateReviews({...result,woning:{...result.woning,extra:true}},facts));
 for(const fetchImpl of [async()=>({ok:false}),async()=>response({}),async()=>{throw new Error('offline');}]){
  const generate=createReviewGenerator({enabled:true,apiKey:'test',fetchImpl});
  const analysis=await generate(snapshot);assert.equal(analysis.status,'unavailable');assert.equal(analysis.reviews.some(r=>r.authorType==='ai'),false);
 }
});
test('rate limit and abort skip generation; missing data receives no invented AI',async()=>{
 let calls=0;const generate=createReviewGenerator({enabled:true,apiKey:'test',limit:1,fetchImpl:async()=>{calls++;return response(result);}});
 assert.equal((await generate(snapshot)).status,'available');
 assert.equal((await generate(snapshot)).status,'unavailable');assert.equal(calls,1);
 const controller=new AbortController();controller.abort();
 assert.equal((await generate(snapshot,controller.signal)).status,'unavailable');
 const empty=createReviewGenerator({enabled:true,apiKey:'test',fetchImpl:()=>{throw new Error('must not call');}});
 assert.equal((await empty({})).status,'insufficient');
});
