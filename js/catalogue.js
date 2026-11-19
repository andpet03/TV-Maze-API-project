/* Automatic catalogue loading, with an optional 24-hour browser cache. */
(function(root){
 'use strict';
 async function cache(mode, value) {
  if(typeof indexedDB==='undefined') return null;
  return new Promise(resolve=>{
   let db, settled=false;
   const finish=v=>{if(settled)return;settled=true;clearTimeout(timer);db?.close();resolve(v);};
   const timer=setTimeout(()=>finish(null),4000);
   const request=indexedDB.open('atlas-catalogue',1);
   request.onupgradeneeded=()=>request.result.createObjectStore('catalogue');
   request.onerror=()=>finish(null); request.onblocked=()=>finish(null);
   request.onsuccess=()=>{
    db=request.result;if(settled){db.close();return;}
    const tx=db.transaction('catalogue',mode==='read'?'readonly':'readwrite');
    const op=mode==='read'?tx.objectStore('catalogue').get('complete'):tx.objectStore('catalogue').put(value,'complete');
    let result=null;op.onsuccess=()=>{result=op.result;};tx.oncomplete=()=>finish(result);tx.onerror=()=>finish(null);tx.onabort=()=>finish(null);
   };
  });
 }
 async function load({api,onBatch,read=()=>cache('read'),write=v=>cache('write',v),pause=()=>new Promise(r=>setTimeout(r,400)),now=Date.now}) {
  const saved=await read().catch(()=>null);
  if(saved && saved.version===1 && Number.isFinite(saved.time) && now()-saved.time>=0 && now()-saved.time<86400000 && Array.isArray(saved.shows) && saved.shows.every(s=>Number.isInteger(s.id)&&s.id>0&&typeof s.name==='string')) {
   onBatch(saved.shows,true);return;
  }
  const all=[],ids=new Set();
  for(let page=0;;page++) {
   let rows;
   try {rows=await api.get('/shows?page='+page);}catch(e){if(e.status===404)break;throw e;}
   if(!Array.isArray(rows))throw Error('The catalogue could not be read. Please try again.');
   const batch=rows.filter(s=>Number.isInteger(s.id)&&s.id>0&&typeof s.name==='string'&&!ids.has(s.id));
   batch.forEach(s=>ids.add(s.id));all.push(...batch);onBatch(batch,false);await pause();
  }
  // Only complete catalogues are cached. Errors must never appear as completion.
  await write({version:1,time:now(),shows:all}).catch(()=>null);onBatch([],true);
 }
 const api={load};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.AtlasCatalogue=api;
})(typeof globalThis!=='undefined'?globalThis:this);
