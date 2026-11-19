const { test } = require('node:test');
const assert = require('node:assert/strict');
const C = require('../js/core.js');
const NOW = Date.parse('2026-11-18T12:00:00Z');
const ep = (id, runtime = 30, more = {}) => ({ id, season: 1, number: id, name: 'Episode ' + id, runtime, airdate: '2020-01-01', airstamp: '2020-01-01T20:00:00Z', ...more });
test('air classification respects exact airstamps and missing dates', () => {
 assert.equal(C.airState(ep(1), NOW), 'aired');
 assert.equal(C.airState(ep(1, 20, { airstamp: '2027-01-01T00:00:00Z' }), NOW), 'upcoming');
 assert.equal(C.airState({ airdate: '2026-11-18' }, NOW), 'unknown');
 assert.equal(C.airState({ airdate: '2026-11-17' }, NOW), 'aired');
 assert.equal(C.airState({}, NOW), 'unknown');
});
test('planner stops when the next episode is too long instead of skipping it', () => {
 const result = C.planEvening([ep(1, 40), ep(2, 60), ep(3, 10)], [], 55, {}, NOW);
 assert.deepEqual(result.items.map(x => x.episode.id), [1]); assert.equal(result.remaining, 15); assert.equal(result.blocked.id, 2);
});
test('planner includes exact fit and never exceeds the budget', () => {
 const p = C.planEvening([ep(1, 30), ep(2, 45), ep(3, 10)], [], 75, {}, NOW);
 assert.equal(p.used, 75); assert.equal(p.items.length, 2); assert.equal(p.remaining, 0);
});
test('planner excludes watched, upcoming and undated episodes', () => {
 const p = C.planEvening([ep(1), ep(2), ep(3, 10, { airstamp: '2030-01-01T00:00:00Z' }), ep(4, 10, { airstamp: null, airdate: null })], [1], 100, {}, NOW);
 assert.deepEqual(p.items.map(x => x.episode.id), [2]);
});
test('unknown runtime blocks the plan unless an explicit valid estimate is available', () => {
 const eps = [ep(1, null), ep(2, 20)];
 assert.equal(C.planEvening(eps, [], 90, {}, NOW).reason, 'unknown');
 const p = C.planEvening(eps, [], 90, { estimate: true, fallback: 45 }, NOW);
 assert.equal(p.used, 65); assert.equal(p.items[0].estimated, true); assert.equal(p.items[1].estimated, false);
 assert.equal(C.planEvening(eps, [], 90, { estimate: true, fallback: null }, NOW).items.length, 0);
});
test('specials are optional in planning, but recognised even when numbered', () => {
 const eps = [ep(1, 10, { type: 'significant_special' }), ep(2, 30)];
 assert.deepEqual(C.planEvening(eps, [], 90, {}, NOW).items.map(x => x.episode.id), [2]);
 assert.equal(C.planEvening(eps, [], 90, { specials: true }, NOW).items.length, 2);
});
test('progress is based only on aired episodes; next regular episode excludes specials', () => {
 const p = C.progress([ep(1, 10, { number: null }), ep(2), ep(3), ep(4, 10, { airstamp: '2030-01-01T00:00:00Z' })], [2, 4, 999], NOW);
 assert.deepEqual({ aired: p.aired, completed: p.completed, percent: p.percent, next: p.next.id }, { aired: 3, completed: 1, percent: 33, next: 3 });
});
test('filtering combines query, season, watched state and specials without mutating input', () => {
 const eps = [ep(1, 10, { name: 'Café', rating: { average: 7 } }), ep(2, 20, { season: 2, rating: { average: 9 } }), ep(3, 10, { number: null })];
 assert.equal(C.filterEpisodes(eps, { query: 'cafe', season: '1', status: 'watched' }, [1], NOW).length, 1);
 assert.deepEqual(C.filterEpisodes(eps, { sort: 'rating', specials: false }, [], NOW).map(x => x.id), [2, 1]);
 assert.equal(eps[0].id, 1);
});
test('backup validates atomically, deduplicates IDs and removes untrusted image URLs', () => {
 const good = { version: 1, library: [{ show: { id: 1, name: 'A', image: 'javascript:alert(1)' }, watched: [10, 10] }] };
 const result = C.validateBackup(good); assert.deepEqual(result.library[0].watched, [10]); assert.equal(result.library[0].show.image, null);
 assert.throws(() => C.validateBackup({ ...good, library: [...good.library, ...good.library] }));
 assert.throws(() => C.validateBackup({ version: 1, library: [{ show: { id: 1, name: 'A' }, watched: ['10'] }] }));
 assert.throws(() => C.validateBackup({ version: 2, library: [] }));
});
test('empty catalogue produces zero progress and an empty plan', () => {
 assert.equal(C.progress([], [], NOW).percent, 0); assert.equal(C.planEvening([], [], 60, {}, NOW).used, 0);
 assert.throws(() => C.planEvening([], [], -10));
});
