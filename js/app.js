/* UI controller. All provider text is escaped; remote summaries become plain text. */
(() => {
  'use strict';
  const D = window.AtlasDiscovery, C = window.AtlasCore, $ = id => document.getElementById(id), STORAGE = 'episode-atlas.v1';
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const stars = n => Number.isFinite(n) ? n.toFixed(1) : '—';
  const duration = n => `${Math.floor(n / 60)}h ${Math.round(n % 60)}m`;
  const state = { view: 'discover', results: [], show: null, episodes: [], library: [], favourites: [], catalog: [], catalogDone: false, catalogBusy: false, browsePage: 1, genre: '', year: '', browseSort: 'rating', query: '', page: 1, operation: 0, controller: null, opts: { query: '', season: '', status: '', sort: 'airing', specials: true }, spoilers: false, budget: 90, estimate: false, planSpecials: false, planned: false };
  let storageFailure = false;
  try { const stored = localStorage.getItem(STORAGE); if (stored) { const data = D.backup(JSON.parse(stored), C); state.library = data.library; state.favourites = data.favourites; } }
  catch { storageFailure = true; }
  function toast(text) { $('toast').textContent = text; clearTimeout(toast.timer); toast.timer = setTimeout(() => $('toast').textContent = '', 4800); }
  function persist() {
    try { localStorage.setItem(STORAGE, JSON.stringify({ version: 2, library: state.library, favourites: state.favourites })); }
    catch { toast('Browser storage is unavailable or full. Export a backup before closing this page.'); }
    $('libraryCount').textContent = state.library.length;
  }
  const entry = id => state.library.find(x => x.show.id === id);
  const watched = () => entry(state.show?.id)?.watched || [];
  function plain(html) {
    if (!html) return '';
    const doc = new DOMParser().parseFromString(String(html), 'text/html');
    doc.querySelectorAll('script,style,iframe,object').forEach(e => e.remove());
    doc.querySelectorAll('p,br').forEach(e => e.append('\n'));
    return doc.body.textContent.trim();
  }
  function href(url) { try { const u = new URL(url); return ['https:', 'http:'].includes(u.protocol) ? u.href : ''; } catch { return ''; } }
  function link(url, label) { const safe = href(url); return safe ? `<a href="${esc(safe)}" target="_blank" rel="noopener noreferrer">${esc(label)} ↗</a>` : ''; }
  function poster(url, title, cls) {
    const safe = typeof url === 'string' && /^https:\/\/static\.tvmaze\.com\//.test(url);
    return `<div class="${cls}"><span class="poster-fallback" aria-hidden="true">${esc(title.slice(0, 1))}</span>${safe ? `<img src="${esc(url)}" alt="${esc(title)} poster" loading="lazy" referrerpolicy="no-referrer">` : ''}</div>`;
  }
  // Broken or missing posters must never obscure the title or controls.
  document.addEventListener('error', e => { if (e.target.tagName === 'IMG') e.target.remove(); }, true);
  function date(v) {
    if (!v) return 'Date TBA'; const d = new Date(v + 'T12:00:00Z');
    return Number.isNaN(d.getTime()) ? 'Date TBA' : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
  }
  function message(text, error = false) { $('message').textContent = text; $('message').className = 'message' + (error ? ' error' : ''); }
  function begin() { state.controller?.abort(); state.controller = new AbortController(); state.operation++; return { version: state.operation, signal: state.controller.signal }; }
  function route(showId) {
    try { const url = new URL(location.href); url.hash = showId ? `show=${showId}` : ''; history.replaceState(null, '', url); } catch { /* Some file URL contexts restrict history. */ }
  }
  function screen(name) {
    state.view = name;
    $('discoverIntro').hidden = name !== 'discover'; $('welcome').hidden = name !== 'discover';
    $('searchArea').hidden = ['library','show','spin'].includes(name); $('browseView').hidden = !['genres', 'years'].includes(name); $('spinView').hidden=name!=='spin'; $('navSpin').classList.toggle('active',name==='spin'); $('navSpin').setAttribute('aria-current',name==='spin'?'page':'false');
    $('searchResults').hidden = name !== 'results'; $('libraryView').hidden = name !== 'library'; $('showView').hidden = name !== 'show';
    $('navDiscover').classList.toggle('active', ['discover','results','show'].includes(name)); for (const [id, view] of [['navGenres','genres'],['navYears','years']]) { $(id).classList.toggle('active', name === view); $(id).setAttribute('aria-current', name === view ? 'page' : 'false'); } $('navLibrary').classList.toggle('active', name === 'library');
    $('navDiscover').setAttribute('aria-current', ['discover','results','show'].includes(name) ? 'page' : 'false'); $('navLibrary').setAttribute('aria-current', name === 'library' ? 'page' : 'false');
  }
  const api = new window.AtlasAPI();
  function showCard(s, saved = false) {
    const existing = entry(s.id), progress = existing?.progress;
    const image = typeof s.image === 'string' ? s.image : s.image?.medium;
    const meta = `${s.premiered?.slice(0, 4) || 'Year TBA'} · ${s.language || 'Language unknown'}`;
    return `<article class="show-card"><button class="card-favourite" data-action="favourite" data-id="${s.id}" aria-label="${state.favourites.some(f => f.id === s.id) ? 'Remove from' : 'Add to'} top five: ${esc(s.name)}" aria-pressed="${state.favourites.some(f => f.id === s.id)}">${state.favourites.some(f => f.id === s.id) ? '★' : '☆'}</button><button class="card-save ${existing ? 'saved' : ''}" data-action="save" data-id="${s.id}" aria-pressed="${!!existing}" aria-label="${existing ? 'Remove from' : 'Add to'} watchlist: ${esc(s.name)}">${existing ? '♥' : '♡'}</button>${poster(image, s.name, 'poster-wrap')}<div class="card-body"><button class="card-title" data-action="show" data-id="${s.id}">${esc(s.name)}</button><div class="card-meta">${esc(meta)}</div><div class="card-tags">${esc((s.genres || []).slice(0, 2).join(' / ') || s.type || 'TV series')}</div>${saved && progress ? `<div class="card-progress"><div class="progress-label"><span>${progress.completed} / ${progress.aired} aired episodes</span><span>Last checked</span></div><div class="progress-track"><div class="progress-fill" style="width:${progress.aired ? progress.completed / progress.aired * 100 : 0}%"></div></div></div>` : saved ? '<p class="small muted">Open to check episode progress.</p>' : `<p class="small muted" style="margin:8px 0 0">${esc(s.network?.name || s.webChannel?.name || s.status || 'Channel not listed')} · ★ ${stars(s.rating?.average)}</p>`}<button class="outline card-open" data-action="show" data-id="${s.id}">${saved ? 'Continue exploring' : 'Explore episodes'} →</button></div></article>`;
  }
  function renderResults() { $('resultsTitle').textContent = `Results for “${state.query}”`; $('resultCount').textContent = `${state.results.length} MATCHES · RELEVANCE ORDER`; $('resultGrid').innerHTML = state.results.length ? state.results.map(s => showCard(s)).join('') : '<div class="empty-state"><h2>No stories found here.</h2><p>Try a shorter title or a different spelling.</p></div>'; }
  function library() { begin(); route(); message(''); screen('library'); renderLibrary(); }
  function renderLibrary() { $('libraryGrid').innerHTML = state.library.length ? state.library.map(e => showCard(e.show, true)).join('') : '<div class="empty-state"><h2>Your next favourite belongs here.</h2><p>Save a show with the heart button. Mark episodes watched to keep your place across visits.</p><button class="primary" data-action="home">Find your first show →</button></div>'; }
  function home() { begin(); route(); message(''); screen('discover'); }
  async function search(q) {
    q = q.trim(); if (!q) return; const op = begin(); route(); state.query = q; $('query').value = q;
    screen('results'); state.results = []; $('resultGrid').innerHTML = ''; $('resultsTitle').textContent = 'Finding your next story…'; $('resultCount').textContent = ''; message('Searching TVmaze…');
    try {
      const data = await api.get('/search/shows?q=' + encodeURIComponent(q), op.signal);
      if (op.version !== state.operation) return;
      if (!Array.isArray(data)) throw new Error('Unexpected search response.');
      state.results = data.filter(x => C.isId(x.show?.id) && typeof x.show?.name === 'string').map(x => x.show); renderResults(); message('');
    } catch (e) { if (e.name !== 'AbortError' && op.version === state.operation) { message(e.message, true); $('resultsTitle').textContent = 'Search unavailable'; $('resultGrid').innerHTML = '<button class="outline" data-action="retry-search">Try the search again</button>'; } }
  }
  async function openShow(id, refresh = false) {
    if (!C.isId(id)) return; const op = begin(); if (refresh) api.clear(); route(id); message(''); screen('show');
    state.show = null; state.episodes = []; state.page = 1; state.planned = false;
    state.opts = { query: '', season: '', status: '', sort: 'airing', specials: true };
    $('showView').innerHTML = '<div class="empty-state" role="status"><h2>Opening the next chapter…</h2><p>Loading show details and its complete episode guide.</p></div>';
    try {
      const [s, episodes] = await Promise.all([api.get(`/shows/${id}`, op.signal), api.get(`/shows/${id}/episodes?specials=1`, op.signal)]);
      if (op.version !== state.operation) return;
      if (s.id !== id || typeof s.name !== 'string' || !Array.isArray(episodes) || !episodes.every(e => C.isId(e.id))) throw new Error('Unexpected show or episode response.');
      state.show = s; state.episodes = episodes; if (entry(id)) { entry(id).show = C.snapshot(s); updateProgress(); persist(); }
      renderShow(); $('showName').focus({ preventScroll: true });
    } catch (e) { if (e.name !== 'AbortError' && op.version === state.operation) { state.controller.abort(); $('showView').innerHTML = `<div class="empty-state"><h2>We couldn’t load this show.</h2><p>${esc(e.message)}</p><button class="primary" data-action="show" data-id="${id}">Try again</button> <button class="outline" data-action="home">Back to discovery</button></div>`; } }
  }
  function updateProgress() { if (!state.show || !entry(state.show.id)) return; const p = C.progress(state.episodes, watched()); entry(state.show.id).progress = { completed: p.completed, aired: p.aired }; }
  function toggleSave(id) {
    const existing = entry(id);
    if (existing) { if (existing.watched.length && !confirm('Remove this show and its saved episode progress from your watchlist?')) return; state.library = state.library.filter(x => x.show.id !== id); toast('Removed from your watchlist.'); }
    else {
      if (state.library.length >= 500) { toast('Your watchlist is limited to 500 shows.'); return; }
      const s = state.show?.id === id ? state.show : findShow(id); if (!s) return;
      state.library.push({ show: C.snapshot(s), watched: [], progress: null }); if (state.show?.id === id) updateProgress(); toast('Added to your watchlist.');
    }
    persist(); if (['genres','years'].includes(state.view)) renderBrowse(); if (state.view === 'results') renderResults(); else if (state.view === 'library') renderLibrary(); else if (state.show) { updateSaveButton(); renderEpisodes(); renderProgress(); renderPlan(); }
  }
  function updateSaveButton() { const b = $('saveShow'); if (b) { b.textContent = entry(state.show.id) ? '♥ Saved to watchlist' : '♡ Save to watchlist'; b.setAttribute('aria-pressed', !!entry(state.show.id)); } }
  function toggleWatched(id) {
    const e = state.episodes.find(x => x.id === id); if (!e || (C.airState(e) !== 'aired' && !watched().includes(id))) return;
    if (!entry(state.show.id)) { if (state.library.length >= 500) { toast('Your watchlist is limited to 500 shows.'); return; } state.library.push({ show: C.snapshot(state.show), watched: [], progress: null }); }
    const saved = entry(state.show.id); saved.watched = saved.watched.includes(id) ? saved.watched.filter(x => x !== id) : [...saved.watched, id];
    updateProgress(); persist(); updateSaveButton(); renderEpisodes(); renderProgress(); renderPlan();
  }
  function renderShow() {
    const s = state.show, network = s.network || s.webChannel;
    const seasons = [...new Set(state.episodes.map(e => String(e.season ?? 'unknown')))].sort((a, b) => a === b ? 0 : a === 'unknown' ? 1 : b === 'unknown' ? -1 : Number(a) - Number(b));
    const fact = (label, value) => `<div><small>${label}</small><b>${esc(value)}</b></div>`;
    $('showView').innerHTML = `<div class="show-toolbar"><button class="text-button" data-action="back">← Back to discovery</button><div><button class="outline small" data-action="share">Copy show link ↗</button><button class="outline small" data-action="refresh" data-id="${s.id}">Refresh data</button></div></div><div class="show-hero">${poster(s.image?.medium, s.name, 'show-poster')}<div><div class="show-heading"><div><div class="eyebrow">${esc(s.type || 'TV series')} · ${esc(s.status || 'Status unknown')}</div><h1 id="showName" tabindex="-1">${esc(s.name)}</h1></div><span class="show-rating">★ ${stars(s.rating?.average)}<small> /10</small></span></div><div class="pills">${(s.genres || []).map(g => `<span class="pill">${esc(g)}</span>`).join('')}</div><p class="summary">${esc(plain(s.summary) || 'No show summary is available.')}</p><button id="saveShow" class="outline small" data-action="save" data-id="${s.id}"></button><button class="outline small" data-action="favourite" data-id="${s.id}" id="showFavourite">${state.favourites.some(f => f.id === s.id) ? '★ In my top five' : '☆ Add to my top five'}</button><div class="facts">${fact('Premiered', date(s.premiered))}${fact('Language', s.language || 'Not listed')}${fact('Network / platform', network?.name || 'Not listed')}${fact('Country', network?.country?.name || 'Not listed')}${fact('Typical runtime', (s.averageRuntime ?? s.runtime) != null ? (s.averageRuntime ?? s.runtime) + ' min' : 'Unknown')}${fact('Ended', s.ended ? date(s.ended) : 'Not listed')}</div><div class="show-source">${link(s.url, 'Show on TVmaze')}${link(s.officialSite, 'Official website')}</div></div></div>
    <div class="content-columns"><div class="episodes-panel"><div class="section-title" style="margin-top:0"><h2>The episode guide.</h2><span id="episodeCount"></span></div><div class="episode-controls"><label class="sr" for="epQuery">Search episodes</label><input id="epQuery" type="search" placeholder="Search episode title or number…"><label class="sr" for="seasonFilter">Season</label><select id="seasonFilter"><option value="">All seasons</option>${seasons.map(x => `<option value="${x}">${x === 'unknown' ? 'Unassigned season' : 'Season ' + x}</option>`).join('')}</select><label class="sr" for="statusFilter">Episode status</label><select id="statusFilter"><option value="">All episodes</option><option value="unwatched">Unwatched</option><option value="watched">Watched</option><option value="aired">Aired</option><option value="upcoming">Upcoming</option><option value="unknown">Air date / time unknown</option></select><label class="sr" for="sortFilter">Sort episodes</label><select id="sortFilter"><option value="airing">Airing order</option><option value="reverse">Reverse airing order</option><option value="rating">Highest rated</option></select></div><div class="episode-toggles"><label class="checkbox"><input id="specials" type="checkbox" checked> Include specials</label><label class="checkbox"><input id="spoilers" type="checkbox" ${state.spoilers ? 'checked' : ''}> Reveal summaries</label><button class="text-button" data-action="reset-filters">Reset</button></div><div id="episodeList"></div><div class="pagination"><button class="outline" id="previous" data-action="previous">← Previous</button><span id="pageLabel"></span><button class="outline" id="next" data-action="next">Next →</button></div><p class="small muted">All episodes currently listed by TVmaze are loaded, including specials and announced episodes. Ratings and dates may be missing. Network details are not a streaming availability guarantee.</p></div><aside class="right-column"><section class="side-panel" id="progressPanel"></section><section class="side-panel planner"><div class="eyebrow">MAKE THE MOST OF TONIGHT</div><h3>Tonight’s plan.</h3><p class="small muted">Your next unwatched episodes, in order. Tell us how much time you have.</p><label class="sr" for="budget">Minutes available</label><div class="planner-input"><input id="budget" type="number" min="1" max="1440" step="1" value="${state.budget}"><span>minutes available</span></div><label class="checkbox"><input id="planSpecials" type="checkbox" ${state.planSpecials ? 'checked' : ''}> Include specials in the plan</label><label class="checkbox"><input id="estimate" type="checkbox" ${state.estimate ? 'checked' : ''}> Estimate missing runtimes using the show’s typical length</label><button class="primary" data-action="plan">Plan my evening →</button><div id="planOutput" aria-live="polite"></div><p class="small muted">Uses aired episodes only. No episodes are skipped to fill spare time. Estimates exclude breaks and adverts.</p></section></aside></div>`;
    updateSaveButton(); renderEpisodes(); renderProgress(); renderPlan();
    $('epQuery').oninput = e => { state.opts.query = e.target.value; state.page = 1; renderEpisodes(); };
    for (const [id, key] of [['seasonFilter', 'season'], ['statusFilter', 'status'], ['sortFilter', 'sort']]) $(id).onchange = e => { state.opts[key] = e.target.value; state.page = 1; renderEpisodes(); };
    $('specials').onchange = e => { state.opts.specials = e.target.checked; state.page = 1; renderEpisodes(); };
    $('spoilers').onchange = e => { state.spoilers = e.target.checked; renderEpisodes(); };
    $('budget').oninput = () => { state.budget = Number($('budget').value); if (state.planned) renderPlan(); };
    $('estimate').onchange = e => { state.estimate = e.target.checked; if (state.planned) renderPlan(); };
    $('planSpecials').onchange = e => { state.planSpecials = e.target.checked; if (state.planned) renderPlan(); };
  }
  function renderEpisodes() {
    if (!$('episodeList')) return;
    const list = C.filterEpisodes(state.episodes, state.opts, watched()), pages = Math.max(1, Math.ceil(list.length / 24)), seen = new Set(watched());
    state.page = Math.min(pages, Math.max(1, state.page));
    $('episodeCount').textContent = `${list.length} / ${state.episodes.length} EPISODES`;
    $('episodeList').innerHTML = list.length ? list.slice((state.page - 1) * 24, state.page * 24).map(e => {
      const aired = C.airState(e), done = seen.has(e.id);
      return `<article class="episode-row"><button class="watched-button ${done ? 'done' : ''}" data-action="watched" data-id="${e.id}" aria-pressed="${done}" aria-label="${done ? 'Mark unwatched' : 'Mark watched'}: ${esc(e.name || C.code(e))}" title="${aired === 'aired' ? (done ? 'Mark unwatched' : 'Mark watched') : 'Available after a known air date/time has passed'}" ${aired !== 'aired' && !done ? 'disabled' : ''}>${done ? '✓' : ''}</button><details><summary><span class="ep-code">${esc(C.code(e))}</span><span class="ep-title"><b>${esc(e.name || 'Untitled episode')}</b><small>${date(e.airdate)} · ${e.runtime == null ? 'Runtime unknown' : esc(e.runtime) + ' min'}${aired === 'upcoming' ? ' · Upcoming' : ''}${C.isSpecial(e) ? ' · Special' : ''}</small></span><span class="ep-plus" aria-hidden="true">＋</span></summary><div class="ep-body"><p>${state.spoilers ? esc(plain(e.summary) || 'No summary available.') : 'Spoiler protection is on. Enable “Reveal summaries” above to read this description.'}</p><p>TVmaze rating: ${stars(e.rating?.average)} /10${e.airtime ? ' · Listed airtime ' + esc(e.airtime) : ''}</p>${link(e.url, 'Episode on TVmaze')}</div></details></article>`;
    }).join('') : `<div class="empty-state"><h2>${state.episodes.length ? 'No matches on this shelf.' : 'The story is still being written.'}</h2><p>${state.episodes.length ? 'Try resetting your episode filters.' : 'TVmaze has not listed episodes for this show yet.'}</p></div>`;
    $('pageLabel').textContent = `${state.page} / ${pages}`; $('previous').disabled = state.page === 1; $('next').disabled = state.page === pages;
  }
  function renderProgress() {
    if (!$('progressPanel')) return; const p = C.progress(state.episodes, watched());
    $('progressPanel').innerHTML = `<div class="eyebrow">YOUR PLACE IN THE STORY</div><h3>${p.percent}% caught up.</h3><div class="progress-label"><span>${p.completed} watched</span><span>${p.aired} aired episodes</span></div><div class="progress-track" role="progressbar" aria-label="Aired episode progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${p.percent}"><div class="progress-fill" style="width:${p.percent}%"></div></div><div class="next-box"><small>NEXT REGULAR EPISODE</small>${p.next ? `<b>${esc(C.code(p.next))} · ${esc(p.next.name || 'Untitled')}</b><p>${p.next.runtime == null ? 'Runtime not listed' : p.next.runtime + ' minutes'} · ${date(p.next.airdate)}</p><button class="outline small" data-action="watched" data-id="${p.next.id}">Mark as watched ✓</button>` : `<b>${p.aired ? 'You’re caught up on regular episodes.' : 'No aired episodes confirmed yet.'}</b><p>Check the episode list for specials and upcoming dates.</p>`}</div><p class="small muted" style="margin:15px 0 0">Marking an episode watched saves this show to your watchlist. Progress includes aired specials.</p>`;
  }
  function renderPlan() {
    if (!$('planOutput') || !state.show) return; if (!state.planned) { $('planOutput').innerHTML = ''; return; }
    if (!Number.isInteger(state.budget) || state.budget < 1 || state.budget > 1440) { $('planOutput').innerHTML = '<p class="plan-empty">Enter a whole number from 1 to 1,440 minutes.</p>'; return; }
    const plan = C.planEvening(state.episodes, watched(), state.budget, { specials: state.planSpecials, estimate: state.estimate, fallback: state.show.averageRuntime ?? state.show.runtime });
    let explanation = plan.reason === 'unknown' ? `We stopped before ${C.code(plan.blocked)} because its runtime is unknown. Enable estimates if the show has a typical runtime.` : plan.reason === 'budget' ? `The next episode (${C.code(plan.blocked)}) does not fit. It has not been skipped.` : 'That is every remaining aired episode matching your plan settings.';
    $('planOutput').innerHTML = `<div class="plan-total"><b>${plan.items.length} episode${plan.items.length === 1 ? '' : 's'} · ${duration(plan.used)}</b><br>${plan.remaining} minutes left over</div>${plan.items.length ? `<ol class="plan-list">${plan.items.map(x => `<li><b>${esc(C.code(x.episode))}</b> · ${esc(x.episode.name || 'Untitled')}<small>${x.minutes} min${x.estimated ? ' · Estimated from typical runtime' : ''}</small></li>`).join('')}</ol>` : '<p class="plan-empty">No next episode fits this plan.</p>'}<p class="small muted">${esc(explanation)}</p>`;
  }
  function findShow(id) { return (state.spinResult?.id===id?state.spinResult:null) || (state.show?.id === id ? state.show : null) || state.results.find(s=>s.id===id) || state.catalog.find(s=>s.id===id) || entry(id)?.show || state.favourites.find(s=>s.id===id); }
  function renderFavourites() {
    $('favouriteGrid').innerHTML = Array.from({length:5},(_,i) => {
      const s = state.favourites[i];
      if(!s) return `<button class="favourite-slot vacant" data-action="explore"><span class="rank">0${i+1}</span><span>＋</span><b>Your next favourite</b></button>`;
      return `<article class="favourite-slot"><span class="rank">0${i+1}</span>${poster(s.image,s.name,'favourite-poster')}<button class="favourite-title" data-action="show" data-id="${s.id}">${esc(s.name)}</button><div class="rank-controls"><button data-action="rank-up" data-id="${s.id}" ${i===0?'disabled':''} aria-label="Move ${esc(s.name)} up">←</button><button data-action="rank-down" data-id="${s.id}" ${i===state.favourites.length-1?'disabled':''} aria-label="Move ${esc(s.name)} down">→</button><button data-action="favourite" data-id="${s.id}" aria-label="Remove ${esc(s.name)} from top five">×</button></div></article>`;
    }).join('');
  }
  function toggleFavourite(id) {
    const s = findShow(id); if(!s) return;
    const snap = typeof s.image === 'string' ? s : C.snapshot(s);
    try { state.favourites = D.toggle(state.favourites,snap); } catch(e) { toast(e.message); return; }
    persist(); renderFavourites(); if(state.view==='results') renderResults(); if(state.view==='library') renderLibrary(); if(['genres','years'].includes(state.view)) renderBrowse();
    if($('showFavourite')) $('showFavourite').textContent = state.favourites.some(s=>s.id===id) ? '★ In my top five' : '☆ Add to my top five';
  }
  function browse(mode) { begin(); route(); message(''); screen(mode); browseKey=''; renderBrowse(); }
  let browseKey='', browseQueue=[], browseVisible=24, browseRendered=0;
  function renderBrowse(incremental=false) {
    $('browseTitle').textContent=state.view==='years'?'Stories through the years.':'Find your kind of story.';
    const genres=[...new Set(state.catalog.flatMap(s=>s.genres?.length?s.genres:['Unclassified']))].sort();
    const years=[...new Set(state.catalog.map(D.year))].sort((a,b)=>b.localeCompare(a));
    // Append new options instead of replacing an open dropdown or focused category.
    function options(id,items){const select=$(id),known=new Set([...select.options].map(o=>o.value));for(const value of items)if(!known.has(value)){const o=document.createElement('option');o.value=value;o.textContent=value;select.append(o);}}
    options('genreSelect',genres);options('yearSelect',years);
    $('genreSelect').value=state.genre;$('yearSelect').value=state.year;
    $('genreSelect').parentElement.classList.toggle('filter-primary',state.view==='genres');$('yearSelect').parentElement.classList.toggle('filter-primary',state.view==='years');
    const key=JSON.stringify([state.view,state.genre,state.year,state.browseSort]);
    const fresh=key!==browseKey;
    const sorted=D.filter(state.catalog,state.genre,state.year,state.browseSort);
    if(fresh){browseKey=key;browseQueue=sorted;browseVisible=24;browseRendered=0;$('browseGrid').innerHTML='';$('categoryChips').innerHTML='';}
    else browseQueue=D.appendStable(browseQueue,sorted);
    const categories=state.view==='years'?years:genres,active=state.view==='years'?state.year:state.genre;
    const known=new Set([...$('categoryChips').children].map(b=>b.dataset.value));
    for(const value of categories)if(!known.has(value)){$('categoryChips').insertAdjacentHTML('beforeend',`<button class="outline small" data-action="category" data-value="${esc(value)}">${esc(value)}</button>`);}
    for(const b of $('categoryChips').children){b.classList.toggle('selected',b.dataset.value===active);b.setAttribute('aria-pressed',String(b.dataset.value===active));}
    if(!incremental&&!fresh){$('browseGrid').innerHTML='';browseRendered=0;}
    if(incremental && !$('browseView').hidden && browseVisible<browseQueue.length && $('browseTail').getBoundingClientRect().top<window.innerHeight+350) browseVisible+=24;
    appendBrowseCards();
    $('catalogStatus').textContent=state.catalogDone?`${state.catalog.length.toLocaleString()} shows · Complete catalogue`:state.catalogError?`Loading interrupted. ${state.catalogError}`:'Discovering more stories in the background.';
    $('retryCatalogue').hidden=!state.catalogError;
    const more=browseRendered<browseQueue.length;
    $('downloadIndicator').hidden=!more&&(state.catalogDone||!!state.catalogError);
    $('downloadLabel').textContent=more?'More titles below…':'Downloading titles…';
    $('browseCount').textContent=`${browseRendered} of ${browseQueue.length} matches${state.catalogDone?'':' found so far'}`;
    if(!browseQueue.length&&state.catalogDone)$('browseCount').textContent='No titles match these filters.';
  }
  function appendBrowseCards(){const rows=browseQueue.slice(browseRendered,browseVisible);if(rows.length){$('browseGrid').insertAdjacentHTML('beforeend',rows.map(s=>showCard(s)).join(''));browseRendered+=rows.length;}}
  // Grow the displayed list only as the viewer approaches its end.
  const browseObserver=new IntersectionObserver(entries=>{
    if(entries.some(e=>e.isIntersecting)&&['genres','years'].includes(state.view)&&browseVisible<browseQueue.length){browseVisible+=24;renderBrowse(true);}
  },{rootMargin:'0px 0px 350px 0px'});
  browseObserver.observe($('browseTail'));
  async function loadCatalog() {
    if(state.catalogBusy || state.catalogDone) return;
    state.catalogBusy=true;state.catalogError='';renderBrowse(true);
    const known=new Set(state.catalog.map(s=>s.id));
    try {
      await window.AtlasCatalogue.load({api,onBatch:(rows,complete)=>{
        for(const s of rows) if(!known.has(s.id)){known.add(s.id);state.catalog.push(s);}
        state.catalogDone=complete;
        if(!coverStarted)renderCovers();
        if(['genres','years'].includes(state.view) || complete)renderBrowse(true); updateSpinGenres();
      }});
    } catch(e){state.catalogError=e.message;}
    finally{state.catalogBusy=false;renderBrowse(true);}
  }
  let coverIndex=0, coverStarted=false, motionPaused=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function renderCovers() {
    const pool=state.catalog.filter(s=>s.image?.medium); if(!pool.length) return;
    coverStarted=true; const covers=Array.from({length:6},(_,i)=>pool[(coverIndex+i)%pool.length]);
    $('coverWall').innerHTML=covers.map(s=>poster(s.image.medium,s.name,'cover-tile')).join('');
    $('coverCaption').textContent='On the wall: '+covers.slice(0,3).map(s=>s.name).join(' · '); coverIndex=(coverIndex+6)%pool.length;
  }
  function updateMotion() { $('motionButton').textContent=motionPaused?'Play covers':'Pause covers'; $('motionButton').setAttribute('aria-pressed',String(motionPaused)); $('coverWall').classList.toggle('paused',motionPaused); }
  setInterval(()=>{if(!motionPaused && !document.hidden && state.view==='discover') renderCovers();},8000);
  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',e=>{motionPaused=e.matches;updateMotion();});
  for(const [id,key] of [['genreSelect','genre'],['yearSelect','year'],['browseSort','browseSort']]) $(id).onchange=e=>{state[key]=e.target.value;state.browsePage=1;renderBrowse();};

  function spinBusy(busy){for(const id of ['spinMinutes','spinGenre','spinScope','spinButton'])$(id).disabled=busy;$('cancelSpin').hidden=!busy;$('spinWheel').classList.toggle('spinning',busy);}
  function spinView(){begin();$('spinStatus').textContent='';route();message('');screen('spin');spinBusy(false);updateSpinGenres();}
  function updateSpinGenres(){const genres=[...new Set([...state.catalog,...state.library.map(e=>e.show)].flatMap(s=>s.genres||[]))].sort();const known=new Set([...$('spinGenre').options].map(o=>o.value));for(const genre of genres)if(!known.has(genre)){const o=document.createElement('option');o.value=genre;o.textContent=genre;$('spinGenre').append(o);}}
  async function spin(){
    const budget=Number($('spinMinutes').value),genre=$('spinGenre').value;
    if(!Number.isInteger(budget)||budget<1||budget>1440){$('spinStatus').textContent='Enter a whole number from 1 to 1,440 minutes.';return;}
    const op=begin(),spinController=state.controller,pool=$('spinScope').value==='watchlist'?state.library.map(e=>e.show):[...state.catalog,...state.library.map(e=>e.show)];
    spinBusy(true);$('spinResult').innerHTML='';$('spinStatus').textContent='Finding an unwatched story that fits…';
    let expired=false;const timeout=setTimeout(()=>{expired=true;spinController.abort();},60000);
    try{
      const result=await window.AtlasSpin.choose({shows:pool,genre,budget,watched:id=>entry(id)?.watched||[],core:C,signal:op.signal,fetchEpisodes:(id,signal)=>api.get(`/shows/${id}/episodes?specials=1`,signal),onCheck:(n,total)=>{if(op.version===state.operation)$('spinStatus').textContent=`Checking your possibilities… ${n} / ${total}`;}});
      if(op.version!==state.operation)return;
      if(!result.show){$('spinStatus').textContent=result.candidates===0?'No shows are available for that selection yet. Try another genre, your watchlist, or wait for more titles.':`No suitable plan found among ${result.checked} checked shows${result.failures?` (${result.failures} could not be loaded)`:''}. Try more time or spin again.`;return;}
      const {show,plan}=result;state.spinResult=show;
      $('spinStatus').textContent='Your next chapter is ready.';
      $('spinResult').innerHTML=`<article class="spin-result">${poster(typeof show.image==='string'?show.image:show.image?.medium,show.name,'show-poster')}<div><div class="eyebrow">THE WHEEL CHOSE</div><h2>${esc(show.name)}</h2><p><b>${plan.items.length} episode${plan.items.length===1?'':'s'} · ${duration(plan.used)}</b> · ${plan.remaining} minutes spare</p><ol class="plan-list">${plan.items.map(x=>`<li><b>${esc(C.code(x.episode))} · ${esc(x.episode.name||'Untitled')}</b><small>${x.minutes} minutes</small></li>`).join('')}</ol><p class="small muted">Aired episodes only. No runtime estimates or skipped episodes. Watch progress changes only when you mark episodes watched.</p><button class="primary" data-action="show" data-id="${show.id}">Open episode guide →</button></div></article>`;
    }catch(e){if(op.version===state.operation)$('spinStatus').textContent=expired?'That spin took too long. Please try again.':e.name==='AbortError'?'Spin cancelled.':e.message;}
    finally{clearTimeout(timeout);if(op.version===state.operation){spinBusy(false);}}
  }
  $('spinForm').onsubmit=e=>{e.preventDefault();spin();};

  function downloadBackup() {
    const blob = new Blob([JSON.stringify({ version: 2, exportedAt: new Date().toISOString(), library: state.library, favourites: state.favourites }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = 'atlas-backup.json'; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function restore() {
    const box = $('restoreMessage');
    try {
      if (!$('replaceConsent').checked) throw new Error('Confirm replacement of your current watchlist and progress first.');
      const file = $('backupFile').files[0]; if (!file) throw new Error('Choose a backup JSON file.'); if (file.size > 10 * 1024 * 1024) throw new Error('Backup is too large (maximum 10 MB).');
      const restored = D.backup(JSON.parse(await file.text()), C); state.library = restored.library; state.favourites = restored.favourites; persist(); renderFavourites(); library();
      box.textContent = `Restored ${state.library.length} shows. Open a show to refresh its details.`; box.className = 'message'; $('replaceConsent').checked = false; $('backupFile').value = '';
    } catch (e) { box.textContent = e instanceof SyntaxError ? 'This file is not valid JSON. Nothing was changed.' : e.message; box.className = 'message error'; }
  }
  async function share() {
    if (location.protocol === 'file:') { toast('Publish on GitHub Pages first to share a working app link.'); return; }
    try { await navigator.clipboard.writeText(location.href); toast('Show link copied.'); } catch { toast('Copy the address from your browser’s address bar.'); }
  }
  document.addEventListener('click', e => {
    const close = e.target.closest('[data-close]'); if (close) { $(close.dataset.close).close(); return; }
    const suggestion = e.target.closest('[data-search]'); if (suggestion) { search(suggestion.dataset.search); return; }
    const b = e.target.closest('[data-action]'); if (!b) return; const id = Number(b.dataset.id);
    switch (b.dataset.action) {
      case 'home': home(); break; case 'library': library(); break;
      case 'category': if(state.view==='years') state.year=b.dataset.value; else state.genre=b.dataset.value; state.browsePage=1; renderBrowse(); break;
      case 'genres': case 'years': browse(b.dataset.action); break;
      case 'favourites': $('topFive').scrollIntoView({block:'start'}); break;
      case 'favourite': toggleFavourite(id); break;
      case 'rank-up': case 'rank-down': state.favourites = D.move(state.favourites, id, b.dataset.action === 'rank-up' ? -1 : 1); persist(); renderFavourites(); break;
      case 'explore': if ($('searchArea').hidden) home(); $('searchArea').scrollIntoView({block:'center'}); $('query').focus(); break;
      case 'motion': motionPaused = !motionPaused; updateMotion(); break;
      case 'retry-catalogue': loadCatalog(); break;
      case 'spin-view': spinView(); break;
      case 'cancel-spin': state.controller?.abort(); break;
      case 'settings': if (!$('settingsDialog').open) $('settingsDialog').showModal(); break;
      case 'show': openShow(id); break; case 'refresh': openShow(id, true); break;
      case 'save': toggleSave(id); break; case 'watched': toggleWatched(id); break;
      case 'retry-search': search(state.query); break;
      case 'back': begin(); route(); message(''); if (state.results.length) { screen('results'); renderResults(); } else home(); break;
      case 'next': state.page++; renderEpisodes(); $('episodeCount').scrollIntoView({ block: 'center' }); break;
      case 'previous': state.page--; renderEpisodes(); $('episodeCount').scrollIntoView({ block: 'center' }); break;
      case 'reset-filters': state.opts = { query: '', season: '', status: '', sort: 'airing', specials: true }; state.page = 1; $('epQuery').value = ''; $('seasonFilter').value = ''; $('statusFilter').value = ''; $('sortFilter').value = 'airing'; $('specials').checked = true; renderEpisodes(); break;
      case 'plan': state.planned = true; renderPlan(); break;
      case 'backup': downloadBackup(); break; case 'share': share(); break;
    }
  });
  $('searchForm').onsubmit = e => { e.preventDefault(); search($('query').value); };
  $('restoreButton').onclick = restore;
  document.addEventListener('keydown', e => { if (e.key === '/' && !/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName) && !document.querySelector('dialog[open]')) { e.preventDefault(); if (state.view !== 'discover' && state.view !== 'results') home(); $('query').focus(); } });
  $('libraryCount').textContent = state.library.length; renderFavourites(); loadCatalog(); updateMotion();
  if (storageFailure) toast('Saved data could not be read. You can restore a JSON backup in Backup & restore.');
  const id = Number(new URLSearchParams(location.hash.slice(1)).get('show')); if (C.isId(id)) openShow(id);
  window.addEventListener('hashchange', () => { const id = Number(new URLSearchParams(location.hash.slice(1)).get('show')); if (C.isId(id)) openShow(id); else home(); });
})();
