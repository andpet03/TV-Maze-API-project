/* Optional end-to-end test. Install Playwright, then run npm run test:browser.
   All TVmaze responses below are explicit synthetic fixtures, not live show data. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '..');
const show = { id: 1, name: 'Fixture Series', premiered: '2020-01-01', language: 'English', genres: ['Drama'], status: 'Ended', type: 'Scripted', averageRuntime: 30, summary: '<p>A test story.</p>', rating: { average: 8 }, network: { name: 'Fixture Network', country: { name: 'Test Country' } }, url: 'https://www.tvmaze.com/shows/1', image: null };
const episodes = Array.from({ length: 32 }, (_, i) => ({ id: 101 + i, season: i < 24 ? 1 : 2, number: i + 1, name: 'Episode ' + (i + 1), runtime: i === 2 ? null : 30, airdate: '2020-02-01', airstamp: '2020-02-01T20:00:00Z', summary: '<p>A hidden plot twist.</p>', rating: { average: 7 } }));
episodes.push({ id: 200, season: 3, number: 1, name: 'Future Episode', runtime: 30, airdate: '2099-01-01', airstamp: '2099-01-01T20:00:00Z' });
const server = http.createServer(async (req, res) => {
 try { const file = path.resolve(ROOT, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname)); if (!file.startsWith(ROOT + path.sep) && file !== ROOT) throw Error('Forbidden'); const target = file === ROOT ? path.join(ROOT, 'index.html') : file; const body = await fs.readFile(target); const ext = path.extname(target); res.setHeader('Content-Type', ({ '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript', '.svg': 'image/svg+xml' })[ext] || 'text/plain'); res.end(body); } catch { res.writeHead(404); res.end('Not found'); }
});
(async () => {
 let browser;
 try {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {}) });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage(), errors = []; page.on('pageerror', e => errors.push(e.message));
  await context.route('https://api.tvmaze.com/**', async route => {
   const u = new URL(route.request().url()); let data;
   if (u.pathname === '/search/shows') data = u.searchParams.get('q') === 'nothing' ? [] : [{ score: 1, show }];
   else if (u.pathname === '/shows' && u.searchParams.get('page') === '0') data = [show];
   else if (u.pathname === '/shows/1') data = show;
   else if (u.pathname === '/shows/1/episodes') data = episodes;
   else { await route.fulfill({ status: 404, body: '{}' }); return; }
   await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data) });
  });
  await fs.mkdir(path.join(ROOT, 'artifacts'), { recursive: true });
  await page.goto(url);
  await page.screenshot({ path: path.join(ROOT, 'artifacts/home-desktop.png'), fullPage: true });
  await page.locator('#query').fill('fixture'); await page.locator('#searchForm button').click();
  await page.waitForSelector('#resultGrid .show-card'); assert.equal(await page.locator('#resultGrid .show-card').count(), 1);
  await page.locator('#resultGrid .card-open').click(); await page.waitForSelector('#showName');
  assert.equal(await page.locator('#showName').textContent(), show.name);
  assert.equal(await page.locator('.episode-row').count(), 24);
  await page.locator('#next').click(); assert.equal(await page.locator('.episode-row').count(), 9);
  await page.locator('#statusFilter').selectOption('upcoming'); assert.equal(await page.locator('.episode-row').count(), 1); assert.equal(await page.locator('.watched-button').isDisabled(), true);
  await page.locator('[data-action="reset-filters"]').click();
  await page.locator('.episode-row summary').first().click();
  assert.match(await page.locator('.ep-body').first().textContent(), /Spoiler protection/);
  await page.locator('#spoilers').check(); await page.locator('.episode-row summary').first().click();
  assert.match(await page.locator('.ep-body').first().textContent(), /hidden plot twist/);
  await page.locator('.watched-button').first().click(); assert.equal(await page.locator('#libraryCount').textContent(), '1');
  assert.match(await page.locator('#progressPanel').textContent(), /1 watched/);
  await page.locator('[data-action="plan"]').click(); assert.match(await page.locator('#planOutput').textContent(), /1 episode/); assert.match(await page.locator('#planOutput').textContent(), /runtime is unknown/);
  await page.locator('#estimate').check(); assert.match(await page.locator('#planOutput').textContent(), /3 episodes/); assert.match(await page.locator('#planOutput').textContent(), /Estimated/);
  await page.screenshot({ path: path.join(ROOT, 'artifacts/show-desktop.png'), fullPage: true });
  await page.locator('#navLibrary').click(); assert.equal(await page.locator('#libraryGrid .show-card').count(), 1);
  await page.reload(); await page.locator('#navLibrary').click(); assert.equal(await page.locator('#libraryGrid .show-card').count(), 1);
  await page.locator('#libraryGrid .card-open').click(); await page.waitForSelector('#showName'); assert.match(await page.locator('#progressPanel').textContent(), /1 watched/);
  assert.equal(await page.locator('[data-action="lab"]').count(),0);
  await page.locator('#showFavourite').click(); assert.equal(await page.locator('.favourite-title').textContent(),show.name);
  await page.reload(); await page.waitForSelector('#showName'); assert.equal(await page.locator('.favourite-title').textContent(),show.name);
  await page.locator('#navGenres').click(); await page.locator('#genreSelect').selectOption('Drama'); assert.equal(await page.locator('#browseGrid .show-card').count(),1);
  await page.locator('#navYears').click(); await page.locator('#yearSelect').selectOption('2020'); assert.equal(await page.locator('#browseGrid .show-card').count(),1);
  assert.equal(await page.locator('#loadMore, #loadAll').count(),0); await page.waitForFunction(()=>document.getElementById('catalogStatus').textContent.includes('Complete catalogue'));
  await page.locator('#browseGrid .card-open').click(); await page.waitForSelector('#showName');
  await page.locator('#navSpin').click(); await page.locator('#spinMinutes').fill('60'); await page.locator('#spinGenre').selectOption('Drama'); await page.locator('#spinButton').click(); await page.waitForSelector('.spin-result');
  assert.match(await page.locator('#spinResult').textContent(), /Fixture Series/); assert.match(await page.locator('#spinResult').textContent(), /1 episode/);
  await page.locator('#spinResult [data-action="show"]').click(); await page.waitForSelector('#showName');
  await page.locator('.sidebar [data-action="settings"]').click();
  await page.locator('#backupFile').setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('{"version":2,"library":[]}') });
  await page.locator('#replaceConsent').check(); await page.locator('#restoreButton').click(); assert.match(await page.locator('#restoreMessage').textContent(), /not a valid/); assert.equal(await page.locator('#libraryCount').textContent(), '1');
  await page.locator('[data-close="settingsDialog"]').click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: path.join(ROOT, 'artifacts/show-mobile.png'), fullPage: true });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'Mobile page must not overflow horizontally');
  await page.locator('[data-action="home"]').first().click(); await page.locator('#query').fill('nothing'); await page.locator('#searchForm button').click(); await page.waitForSelector('#resultGrid .empty-state');
  // Explicit network failure, followed by retry UI.
  await context.route('https://api.tvmaze.com/search/shows?q=fail', route => route.abort());
  await page.locator('#query').fill('fail'); await page.locator('#searchForm button').click(); await page.waitForSelector('[data-action="retry-search"]'); assert.match(await page.locator('#message').textContent(), /Cannot reach/);
  assert.deepEqual(errors, []); console.log('PASS: browser search, details, pagination, dates, spoilers, progress, planning, persistence, ranked favourites, genre/year discovery, catalogue completion, invalid restore, mobile layout, empty results, and network failure.');
 } finally { if (browser) await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
