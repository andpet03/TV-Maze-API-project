/* Read-only TVmaze client: bounded cache, cancellation, timeout and retry. */
(function (root) {
  'use strict';
  class AtlasAPI {
    constructor({ fetcher = (...args) => fetch(...args), onLog = () => {}, ttl = 300000, timeout = 18000, retryDelay = 1500 } = {}) {
      Object.assign(this, { fetcher, onLog, ttl, timeout, retryDelay }); this.cache = new Map();
    }
    async get(path, signal = new AbortController().signal) {
      if (!path.startsWith('/') || path.startsWith('//')) throw new Error('Invalid API path.');
      if (signal.aborted) throw new DOMException('Cancelled', 'AbortError');
      const url = 'https://api.tvmaze.com' + path, cached = this.cache.get(path);
      const report = (status, data, start, note) => this.onLog({ method: 'GET', url, path, status, data, duration: Date.now() - start, note });
      if (cached && Date.now() - cached.time < this.ttl) { report('CACHE', cached.data, Date.now(), 'Reused in-memory response; no network request.'); return cached.data; }
      for (let attempt = 0; attempt < 2; attempt++) {
        if (signal.aborted) throw new DOMException('Cancelled', 'AbortError');
        const controller = new AbortController(), start = Date.now(); let timedOut = false, response, data;
        const abort = () => controller.abort(); signal.addEventListener('abort', abort, { once: true });
        const timer = setTimeout(() => { timedOut = true; controller.abort(); }, this.timeout);
        try {
          response = await this.fetcher(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
          const text = await response.text(); try { data = JSON.parse(text); } catch { data = text; }
          report(response.status, data, start, `Network request · attempt ${attempt + 1}`);
        } catch (error) {
          if (signal.aborted) throw new DOMException('Cancelled', 'AbortError');
          const message = timedOut ? 'TVmaze took too long to respond. Please try again.' : 'Cannot reach TVmaze. Check your internet connection and try again.';
          report('NETWORK ERROR', { message }, start, 'No complete HTTP response.'); throw new Error(message);
        } finally { clearTimeout(timer); signal.removeEventListener('abort', abort); }
        if (signal.aborted) throw new DOMException('Cancelled', 'AbortError');
        if ((response.status === 429 || response.status >= 500) && attempt === 0) {
          const seconds = Number(response.headers?.get('Retry-After'));
          const ms = seconds > 0 ? Math.min(seconds * 1000, 10000) : this.retryDelay;
          await new Promise((resolve, reject) => {
            const cancel = () => { clearTimeout(t); reject(new DOMException('Cancelled', 'AbortError')); };
            const t = setTimeout(() => { signal.removeEventListener('abort', cancel); resolve(); }, ms);
            signal.addEventListener('abort', cancel, { once: true });
          }); continue;
        }
        if (!response.ok) throw Object.assign(new Error(response.status === 429 ? 'TVmaze is busy. Wait a moment before retrying.' : response.status === 404 ? 'This show is no longer available on TVmaze.' : `TVmaze returned HTTP ${response.status}. Please try again.`), { status: response.status });
        if (!data || typeof data !== 'object') throw new Error('TVmaze returned an unexpected response format.');
        if (this.cache.size >= 40) this.cache.delete(this.cache.keys().next().value);
        this.cache.set(path, { data, time: Date.now() }); return data;
      }
    }
    clear() { this.cache.clear(); }
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = AtlasAPI; else root.AtlasAPI = AtlasAPI;
})(typeof globalThis !== 'undefined' ? globalThis : this);
