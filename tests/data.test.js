import test from 'node:test';
import assert from 'node:assert/strict';
import {available,number,point,contains,exactFeature,searchURL} from '../public/data.js';
test('CBS suppressed values are unavailable, zero is valid',()=>{for(const v of [-99997,-99998,-99999,null,undefined,NaN,Infinity]){assert.equal(available(v),false);assert.equal(number(v),'Niet beschikbaar');}assert.equal(number(0,' km'),'0 km');assert.equal(number(298,'',1000),'298.000');});
test('only the requested identifier can be used',()=>{const data={features:[{properties:{identificatie:'999'}},{properties:{identificatie:'0342010000003755'}}]};assert.equal(exactFeature(data,'identificatie','0342010000003755'),data.features[1]);assert.equal(exactFeature(data,'identificatie','123'),null);});
test('address queries are encoded and restricted to addresses',()=>{const url=new URL(searchURL('3766 EB 51 & foo'));assert.equal(url.searchParams.get('q'),'3766 EB 51 & foo');assert.equal(url.searchParams.get('fq'),'type:adres');});
test('geographic fallback handles polygon holes and outside points',()=>{const g={type:'Polygon',coordinates:[[[0,0],[10,0],[10,10],[0,10],[0,0]],[[4,4],[6,4],[6,6],[4,6],[4,4]]]};assert.equal(contains(g,[1,1]),true);assert.equal(contains(g,[5,5]),false);assert.equal(contains(g,[11,1]),false);assert.deepEqual(point('POINT(5.28 52.17)'),[5.28,52.17]);assert.equal(point('invalid'),null);});
