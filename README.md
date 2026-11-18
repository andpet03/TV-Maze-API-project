# Episode Atlas

**Make time for a good story.**

Episode Atlas is a responsive TV-show companion built with HTML, CSS, vanilla JavaScript and the public TVmaze API. Search for a series, explore all listed episodes, save a personal watchlist, track your progress, and plan a viewing session that fits your available time.

There is no backend, database, secret API key, production dependency or build step.

## Start here

1. Download and extract the project ZIP. Do not run the app from inside the ZIP.
2. Open the extracted `episode-atlas` folder.
3. Double-click `index.html` to open it in a modern browser.
4. Search for a title and choose the correct series.

Keep `index.html`, `css`, `js`, and `assets` together. The app needs internet access to contact TVmaze. For predictable local storage and testing, a local server or GitHub Pages is preferable to a `file:` URL.

### Optional local server on Windows

Open the project folder in File Explorer, type `powershell` in its address bar, and press Enter. If Python is installed, run:

```powershell
py -m http.server 8000
```

Then open **http://localhost:8000** in your browser. Leave PowerShell running. Press Ctrl+C when finished. On macOS/Linux use `python3 -m http.server 8000`.

## What makes this project distinctive?

| Feature | User benefit | Implementation |
| --- | --- | --- |
| Full episode guide | Find every episode currently listed, including specials | TVmaze episode endpoint; local filters and pagination |
| Personal watchlist | Keep favourite shows together | Browser localStorage; no account required |
| Progress and next episode | Remember where you stopped | Watched episode IDs, aired-only denominator, next regular episode |
| Tonight's plan | Fit a sequence of episodes into a time budget | Sequential planner; no skipping episodes to fill gaps |
| Explicit runtime estimates | Avoid false precision when data is missing | Optional estimate from the show's typical runtime, visibly labelled |
| Spoiler control | Browse without reading plots accidentally | Episode descriptions hidden by default |
| API Lab | Understand the actual API calls | Request URL, HTTP status, duration, JSON preview and cache entries |
| Backup and restore | Move personal progress between browsers | Validated JSON backup; explicit replacement confirmation |
| Deep links | Share a particular show | `#show=ID`; works on a hosted site |
| Robust request handling | Recover from slow or unavailable services | Timeout, cancellation, bounded retry and five-minute in-memory cache |

## Project files

```text
episode-atlas/
  index.html                  Semantic application shell
  css/styles.css              Responsive visual design
  js/core.js                  Pure filtering, progress, planning and backup logic
  js/api.js                   TVmaze client and request cache
  js/app.js                   UI rendering, navigation and personal state
  assets/favicon.svg          Original vector app icon
  tests/core.test.cjs          Planner, filtering, dates and backup tests
  tests/api.test.cjs           Cache, HTTP errors, retry, timeout and cancellation tests
  tests/browser.cjs            Optional Playwright user-flow tests (mock API)
  docs/USER_GUIDE.md           Beginner-friendly usage and troubleshooting
  docs/PROJECT_REPORT.md      Architecture, algorithms, limitations and evaluation
  docs/DEMO_SCRIPT.md         Suggested presentation walkthrough
  docs/TESTING.md             Test commands and verification record
  ATTRIBUTION.md              Data/image sources and licensing distinction
  LICENSE                     MIT license for original project code
  package.json                Test and syntax-check commands
  .github/workflows/tests.yml Automated checks on pushes and pull requests
  .gitignore                  Ignore dependencies and generated test artifacts
  .nojekyll                   Static GitHub Pages marker
```

## API integration

Base URL: `https://api.tvmaze.com`

| Operation | Endpoint | Result |
| --- | --- | --- |
| Search | `GET /search/shows?q=TITLE` | An array of `{ score, show }` results |
| Show details | `GET /shows/ID` | A show object |
| All listed episodes | `GET /shows/ID/episodes?specials=1` | An episode array including specials |

Search text is URL-encoded. The user selects a show by ID rather than relying on an ambiguous title. Show details and episode requests run concurrently. TVmaze supports browser requests through CORS. This app only reads TVmaze data; watchlist changes never modify TVmaze.

## Upload to your GitHub repository

1. Extract the ZIP on your computer.
2. Open the inner `episode-atlas` folder.
3. On your repository's **Code** tab, choose **Add file → Upload files** (or **uploading an existing file** in an empty repository).
4. Upload the **contents of the inner folder**, not the ZIP. `index.html` must be at the root of your repository, next to `css`, `js` and `assets`.
5. Include the documentation and tests, then commit with a message such as `Add Episode Atlas final project`.
6. If an older `index.html` is present, replace it with this version. The old `episode_atlas.html` is not used by this project and can be removed separately if you no longer need it.

Hidden files such as `.github`, `.gitignore` and `.nojekyll` are included in the ZIP. Upload them as well if your file picker shows them. The website itself only requires `index.html`, `css`, `js` and `assets`; `.github` enables the automated tests.

### Publish the website

In the repository, open **Settings → Pages**. Under **Build and deployment**, select **Deploy from a branch**, choose **main** and **/(root)**, then **Save**. GitHub will display the site URL after deployment. This setting is separate from the included test workflow.

GitHub Pages availability depends on repository visibility and your account plan. Consult the official documentation linked below if the option is unavailable.

## Run tests

Node.js 20 or newer is required for the tests, but not to use the app.

```sh
npm run check
npm test
```

No `npm install` is needed for these checks. They use Node's built-in test runner and mocked API responses.

Optional browser tests:

```sh
npm install --no-save playwright
npx playwright install chromium
npm run test:browser
```

These tests start their own local server and use explicitly synthetic API fixtures. See `docs/TESTING.md` for the verification record and limitations.

## Privacy and limitations

- Personal data stays in localStorage on the current origin and browser. This is not cloud sync.
- JSON import replaces the current watchlist only after explicit confirmation and successful validation.
- API calls and poster downloads contact TVmaze; normal network metadata is visible to that service.
- TVmaze data may be incomplete, cached or changed. This is not a streaming or purchasing app.
- The planner includes only episodes known to have aired. Unknown airtimes on today's date are treated conservatively.
- A watched episode saves its show automatically. Removing a show with progress requires confirmation.
- The app remains dependent on an internet connection for show data. It does not claim offline catalogue access.

## Academic use

This project was developed with AI assistance. Review the code, run the tests, customise the presentation and follow your professor's disclosure requirements. The report and demo notes are intended to help you understand and explain the implementation; they do not claim independent authorship or guarantee a particular grade.

## References

- [TVmaze API documentation](https://www.tvmaze.com/api)
- [GitHub Pages publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [TVmaze data license: CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)

Original application code is MIT-licensed. TVmaze data and images are separate third-party materials; see `ATTRIBUTION.md`.
