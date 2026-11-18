# ATLAS

**Your world of stories.** Version 2.2.

A TV companion with a cinematic welcome page, rotating show posters, genre and premiere-year discovery, a personal ranked top five, watchlists, episode tracking, spoiler control and an evening planner.

## Run the app

Extract the ZIP, open `episode-atlas`, then double-click `index.html`. Keep the folders together. Internet access is required for shows and images. No API key or installation is needed.

For consistent browser storage, serve the folder locally or use GitHub Pages. On Windows, open the folder in File Explorer, type `powershell` in the address bar, press Enter and run:

```powershell
py -m http.server 8000
```

Visit http://localhost:8000. Keep that terminal open; Ctrl+C stops it.

## Update your existing GitHub repository

1. Optionally download a personal backup from the old app first.
2. Extract this ZIP into a new folder; test its `index.html`.
3. Open the SAME repository and folder containing the old `index.html`.
4. Choose **Add file → Upload files**.
5. Drag all CONTENTS of the new `episode-atlas` folder into the upload area, keeping subfolders intact. Do not upload the ZIP or create a second nested `episode-atlas` folder.
6. Commit with `Redesign ATLAS with discovery and top-five favourites`.
7. GitHub Pages republishes from your configured branch. After deployment, refresh the website with Ctrl+F5.

No files need deleting. The new `js/discovery.js` must be uploaded alongside the updated files. Keep your existing Pages branch/folder settings. Website and repository names do not need to change for the visible brand to become ATLAS.

## Features

- Rotating poster wall (8-second interval), pause control, reduced-motion preference support.
- Top five: star any show, reorder with arrows, remove and replace favourites. Kept near the top of every screen, independent of the watchlist.
- Separate genre and premiere-year discovery screens, category shortcuts, combined filters and rating/date/title sorting.
- Automatic full-catalogue loading in batches of up to 250 shows, with no loading buttons. Results expand while loading; title search stays independent. A complete catalogue is cached in IndexedDB for 24 hours when browser storage is available.
- All listed episodes including specials; season, title and watch-state filters; pagination.
- Watchlist, aired-episode progress, spoiler control and a sequential time-budget planner.
- Version 2 JSON backups include ranked favourites; version 1 backups remain importable.
- No API-learning panels in the interface. Required TVmaze attribution remains in the footer.

## Files

| Path | Purpose |
| --- | --- |
| `index.html` | App screens and accessible navigation |
| `css/styles.css` | Responsive design |
| `js/app.js` | Browser interactions and rendering |
| `js/catalogue.js` | Automatic pagination and optional 24-hour IndexedDB cache |
| `js/discovery.js` | Catalogue filters, ranking and backup migration |
| `js/core.js` | Episode filters, progress and planning |
| `js/api.js` | HTTP requests, cache, timeout and retry |
| `tests/` | Automated logic tests and optional browser suite |
| `docs/` | User guide, report, demo and validation record |
| `.github/workflows/tests.yml` | Automated checks on GitHub |

## Development

Requires Node.js 20+ for tests only; production has no dependencies or build step.

```sh
npm test
npm run check
```

Optional browser checks:

```sh
npm install --no-save playwright
npx playwright install chromium
npm run test:browser
```

See `docs/TESTING.md` for verification limits. Source: https://www.tvmaze.com/api. No backend or secret key. Code is MIT licensed; TVmaze data and images have separate attribution/licensing requirements described in `ATTRIBUTION.md`.

Personal data stays in this browser, on this website origin. No accounts or automatic cross-device sync. Existing watchlist data is preserved when replacing files at the same website address. A different browser, local-file address or hosting origin may require exporting/importing a backup. The first full-catalogue load can take several minutes and substantial memory. Complete catalogues are cached for 24 hours where IndexedDB is available; blocked storage falls back to in-tab data.

This project was developed with AI assistance. Review the code, explain the design and disclose assistance according to your course requirements.

## New in 2.2

Genre/year browsing is now a stable, growing list. Newly downloaded matches append after existing entries, without replacing their DOM nodes or reshuffling cards. Scrolling reveals more results and a three-dot **Downloading titles…** indicator appears at the bottom while the catalogue is incomplete. Changing filters or sorting starts a fresh list. The current sort order is not reapplied globally when a new batch arrives.

**Spin the wheel** lets users select 1–1,440 minutes, a genre and either all discovered shows or their watchlist. It shuffles a snapshot of available candidates and checks up to 30 shows for a sequence of aired, unwatched regular episodes that fits. Runtime estimates and specials are excluded. A 60-second deadline and cancel button bound the search; failures are reported without claiming that no match exists anywhere. Watched status comes only from this user's saved progress. A recommendation does not automatically mark episodes watched.

`js/spin.js` implements random selection and is covered by `tests/spin.test.cjs`. No account or streaming service connection is required.
