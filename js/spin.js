/* Random show selection with sequential, known-runtime, unwatched episode plans. */
(function(root){
 'use strict';
 function shuffle(items,random=Math.random){const out=[...items];for(let i=out.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}
 async function choose({shows,genre,budget,watched,fetchEpisodes,core,signal,random=Math.random,maxChecks=30,onCheck=()=>{}}){
  if(!Number.isInteger(budget)||budget<1||budget>1440)throw Error('Enter a whole number from 1 to 1,440 minutes.');
  const unique=[...new Map(shows.map(s=>[s.id,s])).values()].filter(s=>!genre||s.genres?.includes(genre));
  const pool=shuffle(unique,random);let checked=0,failures=0;
  for(const show of pool.slice(0,maxChecks)){
   if(signal?.aborted)throw new DOMException('Cancelled','AbortError');
   checked++;onCheck(checked,Math.min(pool.length,maxChecks));
   let episodes;try{episodes=await fetchEpisodes(show.id,signal);if(!Array.isArray(episodes)||!episodes.every(e=>core.isId(e.id)))throw Error('Invalid episodes');}catch(e){if(e.name==='AbortError')throw e;failures++;continue;}
   if(signal?.aborted)throw new DOMException('Cancelled','AbortError');
   const plan=core.planEvening(episodes,watched(show.id),budget,{specials:false,estimate:false});
   if(plan.items.length)return {show,plan,checked,failures,candidates:pool.length};
  }
  return {show:null,checked,failures,candidates:pool.length};
 }
 const api={shuffle,choose};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.AtlasSpin=api;
})(typeof globalThis!=='undefined'?globalThis:this);
