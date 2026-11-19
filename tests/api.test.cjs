const { test } = require('node:test');
const assert = require('node:assert/strict');
const API = require('../js/api.js');
const response = (status, data) => ({ status, ok: status >= 200 && status < 300, text: async () => JSON.stringify(data), headers: { get: () => null } });
test('repeated requests use cache and log cache hits without a second network call', async () => {
 let calls = 0; const logs = [], api = new API({ fetcher: async () => { calls++; return response(200, { id: 1 }); }, onLog: x => logs.push(x) });
 await api.get('/shows/1'); await api.get('/shows/1'); assert.equal(calls, 1); assert.equal(logs[1].status, 'CACHE');
 api.clear(); await api.get('/shows/1'); assert.equal(calls, 2);
});
test('a 429 gets one retry, then succeeds', async () => {
 let calls = 0; const api = new API({ retryDelay: 1, fetcher: async () => response(++calls === 1 ? 429 : 200, []) });
 assert.deepEqual(await api.get('/search/shows?q=test'), []); assert.equal(calls, 2);
});
test('repeated server errors stop after two attempts', async () => {
 let calls = 0; const api = new API({ retryDelay: 1, fetcher: async () => { calls++; return response(503, {}); } });
 await assert.rejects(api.get('/shows/1'), /HTTP 503/); assert.equal(calls, 2);
});
test('404 does not retry or enter cache', async () => {
 let calls = 0; const api = new API({ fetcher: async () => { calls++; return response(404, {}); } });
 await assert.rejects(api.get('/shows/1'), /no longer available/); assert.equal(calls, 1); assert.equal(api.cache.size, 0);
});
test('pre-cancelled requests never reach fetch', async () => {
 const controller = new AbortController(); controller.abort();
 const api = new API({ fetcher: () => { throw new Error('should not run'); } });
 await assert.rejects(api.get('/shows/1', controller.signal), { name: 'AbortError' });
});
test('malformed JSON data is rejected without caching', async () => {
 const api = new API({ fetcher: async () => ({ ...response(200, {}), text: async () => 'not json' }) });
 await assert.rejects(api.get('/shows/1'), /unexpected response/); assert.equal(api.cache.size, 0);
});
test('timeout aborts fetch and reports a user-facing error', async () => {
 const api = new API({ timeout: 10, fetcher: (url, { signal }) => new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))) });
 await assert.rejects(api.get('/shows/1'), /too long/);
});
