/* Pure functions shared by the browser UI and Node's built-in tests. */
(function (root) {
  'use strict';
  const isId = n => Number.isSafeInteger(n) && n > 0;
  const isSpecial = e => e.number == null || String(e.type || '').includes('special');
  const code = e => `${e.season == null ? 'S?' : 'S' + String(e.season).padStart(2, '0')}${e.number == null ? ' · Special' : 'E' + String(e.number).padStart(2, '0')}`;
  const normalise = s => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  function airState(e, now = Date.now()) {
    if (e.airstamp && Number.isFinite(Date.parse(e.airstamp))) return Date.parse(e.airstamp) <= now ? 'aired' : 'upcoming';
    if (/^\d{4}-\d{2}-\d{2}$/.test(e.airdate || '')) {
      const today = new Date(now).toISOString().slice(0, 10);
      // A date without a time is not enough to establish that today's episode has aired.
      return e.airdate < today ? 'aired' : e.airdate > today ? 'upcoming' : 'unknown';
    }
    return 'unknown';
  }
  function filterEpisodes(episodes, opts = {}, watched = [], now = Date.now()) {
    const seen = new Set(watched), query = normalise(opts.query || '').trim();
    const rows = episodes.filter(e => (!opts.season || String(e.season ?? 'unknown') === opts.season)
      && (opts.specials !== false || !isSpecial(e))
      && (!query || normalise(`${e.name} ${code(e)}`).includes(query))
      && (!opts.status || (opts.status === 'unwatched' ? !seen.has(e.id) : opts.status === 'watched' ? seen.has(e.id) : airState(e, now) === opts.status)));
    if (opts.sort === 'reverse') rows.reverse();
    if (opts.sort === 'rating') rows.sort((a, b) => (b.rating?.average ?? -1) - (a.rating?.average ?? -1));
    return rows;
  }
  function progress(episodes, watched, now = Date.now()) {
    const seen = new Set(watched), aired = episodes.filter(e => airState(e, now) === 'aired');
    const completed = aired.filter(e => seen.has(e.id)).length;
    return { aired: aired.length, completed, percent: aired.length ? Math.round(completed / aired.length * 100) : 0,
      next: aired.find(e => !seen.has(e.id) && !isSpecial(e)) || null };
  }
  function planEvening(episodes, watched, budget, options = {}, now = Date.now()) {
    if (!Number.isFinite(budget) || budget < 1) throw new Error('Enter a positive time budget.');
    const seen = new Set(watched), candidates = episodes.filter(e => airState(e, now) === 'aired' && !seen.has(e.id) && (options.specials || !isSpecial(e)));
    const plan = []; let used = 0, reason = '', blocked = null;
    for (const episode of candidates) {
      let minutes = episode.runtime, estimated = false;
      if (!Number.isFinite(minutes) || minutes <= 0) {
        if (options.estimate && Number.isFinite(options.fallback) && options.fallback > 0) { minutes = options.fallback; estimated = true; }
        else { reason = 'unknown'; blocked = episode; break; }
      }
      if (used + minutes > budget) { reason = 'budget'; blocked = episode; break; }
      plan.push({ episode, minutes, estimated }); used += minutes;
    }
    return { items: plan, used, remaining: budget - used, reason, blocked };
  }
  function validateBackup(input) {
    if (!input || input.version !== 1 || !Array.isArray(input.library) || input.library.length > 500) throw new Error('This is not a valid ATLAS backup (version 1).');
    const ids = new Set();
    const library = input.library.map(entry => {
      const s = entry?.show;
      if (!s || !isId(s.id) || ids.has(s.id) || typeof s.name !== 'string' || !s.name.trim() || s.name.length > 500 || !Array.isArray(entry.watched) || entry.watched.length > 100000 || !entry.watched.every(isId)) throw new Error('A saved show or episode ID is invalid. Nothing was imported.');
      ids.add(s.id);
      const count = entry.progress;
      return { show: { id: s.id, name: s.name, premiered: typeof s.premiered === 'string' ? s.premiered.slice(0, 10) : null,
        language: typeof s.language === 'string' ? s.language.slice(0, 100) : null,
        genres: Array.isArray(s.genres) ? s.genres.filter(x => typeof x === 'string').slice(0, 20).map(x => x.slice(0, 100)) : [],
        image: typeof s.image === 'string' && /^https:\/\/static\.tvmaze\.com\//.test(s.image) ? s.image : null },
        watched: [...new Set(entry.watched)],
        progress: count && Number.isInteger(count.aired) && Number.isInteger(count.completed) && count.aired >= 0 && count.completed >= 0 && count.completed <= count.aired ? { aired: count.aired, completed: count.completed } : null };
    });
    return { version: 1, library };
  }
  function snapshot(show) { return { id: show.id, name: show.name, premiered: show.premiered || null, language: show.language || null, genres: show.genres || [], image: typeof show.image === 'string' ? show.image : show.image?.medium || null }; }
  const api = { isId, isSpecial, code, normalise, airState, filterEpisodes, progress, planEvening, validateBackup, snapshot };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.AtlasCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
