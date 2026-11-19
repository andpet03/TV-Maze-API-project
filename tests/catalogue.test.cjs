const {test}=require('node:test'),assert=require('node:assert/strict'),{load}=require('../js/catalogue');
const show=id=>({id,name:'Show '+id});
const defaults={read:async()=>null,write:async()=>{},pause:async()=>{}};
test('automatically fetches every page through 404 with no user interaction',async()=>{
 const calls=[],batches=[];let saved;
 await load({...defaults,api:{get:async p=>{calls.push(p);if(p.endsWith('=2'))throw Object.assign(Error(),{status:404});return [show(calls.length)];}},onBatch:(rows,done)=>batches.push({rows,done}),write:async v=>{saved=v;}});
 assert.deepEqual(calls,['/shows?page=0','/shows?page=1','/shows?page=2']);assert.equal(saved.shows.length,2);assert.equal(batches.at(-1).done,true);
});
test('fresh complete cache makes all titles available without network requests',async()=>{
 let result;
 await load({...defaults,now:()=>100,read:async()=>({version:1,time:50,shows:[show(1),show(2)]}),api:{get:()=>{throw Error('Unexpected request');}},onBatch:(rows,done)=>{result={rows,done};}});
 assert.equal(result.rows.length,2);assert.equal(result.done,true);
});
test('interrupted loading never caches or reports partial results as complete',async()=>{
 let complete=false,writes=0;
 await assert.rejects(load({...defaults,api:{get:async p=>{if(p.endsWith('=0'))return [show(1)];throw Error('Offline');}},onBatch:(r,d)=>{complete=d;},write:async()=>writes++}),/Offline/);
 assert.equal(complete,false);assert.equal(writes,0);
});
test('expired cache is rebuilt and unavailable cache storage is nonfatal',async()=>{
 const calls=[];let complete=false;
 await load({...defaults,now:()=>86400001,read:async()=>({version:1,time:0,shows:[show(99)]}),write:async()=>{throw Error('Storage blocked');},api:{get:async p=>{calls.push(p);throw Object.assign(Error(),{status:404});}},onBatch:(r,d)=>complete=d});
 assert.deepEqual(calls,['/shows?page=0']);assert.equal(complete,true);
});
