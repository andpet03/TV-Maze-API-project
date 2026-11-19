# Testing and verification

## Verification record

Recorded validation status:

- **Passed:** 37 automated logic tests using Node's built-in runner.
- **Passed:** JavaScript syntax checks for the application modules.
- **Passed:** static checks for local asset references and HTML ID uniqueness.
- **Not executed successfully:** Playwright end-to-end browser suite. The environment prevented Chromium from starting (process singleton socket permission error). The browser test script is included for execution on a normal development computer.
- **Not claimed:** successful live API integration test, visual screenshot review, formal accessibility audit or exhaustive cross-browser validation.

The official TVmaze API documentation was checked. Unit tests mock HTTP responses; they do not prove that a particular network permits live API access.

## Reproduce the checks

Install Node.js 20 or newer. Open a terminal in the project folder:

```sh
npm run check
npm test
```

These commands need no npm dependencies.

## Unit coverage

- Exact and date-only air-state classification.
- Sequential planner: budget stop, exact fit, no skipping, unknown runtimes, opt-in estimates, specials, watched and future episode exclusion.
- Aired-only progress and next regular episode.
- Combined filtering, accent-insensitive search and non-mutating sorting.
- Backup validation, duplicate rejection, ID deduplication and unsafe image removal.
- Empty datasets and invalid budgets.
- API cache reuse and explicit clearing.
- One bounded retry after 429 or server errors.
- 404 without retry.
- Pre-cancelled request handling.
- Malformed responses and request timeout.

## Optional browser suite

```sh
npm install --no-save playwright
npx playwright install chromium
npm run test:browser
```

The script starts an ephemeral localhost server, intercepts TVmaze calls with synthetic fixtures and exercises search, detail views, pagination, future-episode restrictions, spoiler control, watched progress, planner estimates, persistence, ranked favourites, genre/year browsing, catalogue completion, invalid backup restore, mobile overflow, empty results and network failure.

Screenshots are written to `artifacts/`, which is excluded from Git. To use an existing Chromium executable instead of Playwright's browser, set `BROWSER_EXECUTABLE` to its absolute path.

## Manual acceptance checklist

- [ ] Serve the project locally and confirm styling and JavaScript load.
- [ ] Search a real title and select the correct series by year.
- [ ] Confirm details and at least one episode against TVmaze.
- [ ] Include/exclude specials and switch seasons.
- [ ] Browse all pages; confirm the shown count is the full filtered count.
- [ ] Open an episode and toggle spoiler protection.
- [ ] Save a show, mark an aired episode watched, reload and verify persistence.
- [ ] Remove a show with progress; cancel the confirmation and verify it remains.
- [ ] Build a time-budget plan and verify the total does not exceed the budget.
- [ ] Test an unknown runtime and confirm estimates are labelled.
- [ ] Export a backup and restore it in another browser/site origin.
- [ ] Import an invalid backup and confirm existing progress survives.
- [ ] Fill all five favourite slots, reject a sixth, reorder, remove, reload and verify persistence.
- [ ] Combine genre and year filters, verify automatic completion without clicking a loading control, then reload to check the cache.
- [ ] Pause the cover wall and test reduced-motion settings.
- [ ] Restore a legacy version 1 backup and confirm favourites become empty.
- [ ] Test on a narrow mobile viewport and with keyboard-only navigation.
- [ ] Publish to GitHub Pages and test a shared #show=ID link.
- [ ] Test interrupted connectivity and the retry controls.

Unchecked acceptance items have not been recorded as passed.

### Stable browsing and recommendation checks

- Select a premiere year while catalogue batches are arriving. Remember the first few titles; confirm they stay in the same order and no existing card is replaced by incoming data.
- Scroll to the bottom, observe the three dots and confirm matching new cards appear after old cards. When loading finishes the download indicator disappears.
- Change genre/year/sort intentionally; confirm the new selection starts a fresh list.
- Spin with 60 minutes and a genre. Verify every suggested episode is aired, unwatched in local progress and has a known runtime; check the total is <=60.
- Mark a suggested episode watched in its guide and spin using the watchlist; it must be excluded.
- Cancel a spin, navigate away during one, test missing runtimes and interrupted connectivity.

The 37 logic tests pass. Browser execution remains blocked in this environment; the expanded Playwright script and visual/manual checks are not claimed as passed.
