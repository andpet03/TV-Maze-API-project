/* Catalogue filters and ranked favourites. No DOM dependencies. */
(function(root) {
  'use strict';
  function year(s) { return /^\d{4}-/.test(s.premiered || '') ? s.premiered.slice(0,4) : 'Unknown'; }
  function filter(shows, genre = '', premiere = '', sort = 'rating') {
    return shows.filter(s => (!genre || (genre === 'Unclassified' ? !s.genres?.length : s.genres?.includes(genre))) && (!premiere || year(s) === premiere)).sort((a,b) => sort === 'name' ? a.name.localeCompare(b.name) : sort === 'newest' ? (b.premiered || '').localeCompare(a.premiered || '') : (b.rating?.average ?? -1) - (a.rating?.average ?? -1) || a.name.localeCompare(b.name));
  }
  function appendStable(existing,incoming) { const ids=new Set(existing.map(s=>s.id));const result=[...existing];for(const s of incoming)if(!ids.has(s.id)){ids.add(s.id);result.push(s);}return result; }
  function move(items,id,delta) { const out = [...items], i = out.findIndex(s => s.id === id), j = i + delta; if(i >= 0 && j >= 0 && j < out.length) [out[i],out[j]] = [out[j],out[i]]; return out; }
  function toggle(items,show) { if(items.some(s => s.id === show.id)) return items.filter(s => s.id !== show.id); if(items.length >= 5) throw Error('Your top five is full. Remove one favourite first to make room.'); return [...items,show]; }
  function backup(input,C) {
    if(!input || ![1,2].includes(input.version)) throw Error('This is not a valid ATLAS backup.');
    const library = C.validateBackup({...input,version:1}).library;
    const fav = input.version === 1 ? [] : input.favourites;
    if(!Array.isArray(fav) || fav.length > 5) throw Error('This is not a valid top-five ranking. Nothing was imported.');
    const favourites = C.validateBackup({version:1,library:fav.map(show => ({show,watched:[]}))}).library.map(e=>e.show);
    return {version:2,library,favourites};
  }
  const api = {year,filter,appendStable,move,toggle,backup}; if(typeof module !== 'undefined' && module.exports) module.exports=api; else root.AtlasDiscovery=api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
