# ATLAS

**Your world of stories.**

ATLAS is a browser-based TV companion for discovering series, tracking viewing progress and finding episodes that fit the time available. Built with HTML, CSS and vanilla JavaScript, it retrieves show and episode information from TVmaze and stores personal collections locally in the browser.

## Features

| Feature | Description |
| --- | --- |
| Discovery | Search by title or browse by genre and premiere year. |
| Stable browsing | New catalogue matches join the end of the current list without displacing existing cards. More cards appear on scroll. |
| Personal top five | Save and reorder a ranked selection of five favourite shows. |
| Watchlist and progress | Track watched episodes and identify the next unwatched regular episode. |
| Episode guide | Filter by season, title and viewing status, with optional specials and spoiler protection. |
| Tonight’s plan | Build a sequential viewing plan within a selected time budget. |
| Spin the wheel | Receive a random show's unwatched episode plan matching a genre and available time. |
| Backup and restore | Export and import watchlists, favourites and episode progress. |
| Cinematic welcome | Rotating show posters, a pause control and support for reduced-motion preferences. |

ATLAS provides discovery and planning tools; it does not stream video.

## Running locally

From the project directory, start a static HTTP server:

```sh
python -m http.server 8000
```

On Windows, `py` can replace `python`; on macOS/Linux, `python3` may be required. Open [localhost:8000](http://localhost:8000). A modern browser and internet access are required. There are no production dependencies, API keys or build steps.

The application can also be hosted on a static web service such as GitHub Pages. Serve `index.html` with its accompanying `css`, `js` and `assets` directories.

## Architecture

| Module | Responsibility |
| --- | --- |
| `index.html` | Application screens, navigation and forms |
| `css/styles.css` | Responsive layout and visual presentation |
| `js/app.js` | UI rendering, interactions and personal state |
| `js/api.js` | HTTP requests, cancellation, timeout, retry and request cache |
| `js/catalogue.js` | Automatic catalogue loading and 24-hour browser cache |
| `js/discovery.js` | Catalogue filtering, stable queues, ranking and backup validation |
| `js/core.js` | Episode filtering, watched progress and sequential planning |
| `js/spin.js` | Random candidate selection and time-constrained recommendations |
| `tests/` | Automated logic tests and optional browser tests |
| `.github/workflows/tests.yml` | Continuous integration checks |

## Data and storage

Show metadata and episode information come from the [TVmaze API](https://www.tvmaze.com/api). Title search operates independently of catalogue loading. The full catalogue loads automatically in batches; only completed catalogues are cached in IndexedDB for up to 24 hours when browser storage is available.

Watchlists, top-five rankings and watched episode IDs are stored in localStorage. There are no user accounts or automatic cross-device synchronisation. Backups support transferring personal collections between browsers. Clearing browser storage removes local personal data.

## Recommendation behaviour

Tonight’s plan follows unwatched aired episodes in order, stopping when the next episode exceeds the budget or its runtime is unknown. Runtime estimates and specials are optional in that planner.

Spin the wheel shuffles the available shows matching the selected genre and scope, then checks up to 30 candidates for a fitting plan. It uses known runtimes and regular aired episodes only, with a 60-second search deadline. Unrecorded viewing history is treated as unwatched. Recommendations do not automatically mark episodes watched.

## Testing

Node.js 20 or newer is required for development checks:

```sh
npm test
npm run check
```

These commands require no installed npm dependencies. The validation record contains **37 passing automated logic tests**, JavaScript syntax checks and static asset-reference checks.

Optional browser tests use Playwright:

```sh
npm install --no-save playwright
npx playwright install chromium
npm run test:browser
```

Browser automation could not be executed successfully in the build environment because Chromium startup was restricted. Visual, live-service and cross-browser acceptance checks remain unverified. Details are recorded in [Testing and verification](docs/TESTING.md).

## Limitations

- Initial catalogue loading can take several minutes; filters cover the titles available so far.
- The active browse list preserves its order as new batches arrive. A selected sort is applied to the initial selection and incoming batches, not globally reapplied during loading.
- Metadata, artwork, dates and runtimes depend on TVmaze coverage.
- Random recommendations use the available candidate pool and are not an exhaustive search of every possible viewing plan.
- Personal storage is specific to the browser and website origin. Catalogue caching is optional and may be unavailable under restrictive browser settings.

## Documentation

- [User guide](docs/USER_GUIDE.md)
- [Technical project report](docs/PROJECT_REPORT.md)
- [Feature walkthrough](docs/DEMO_SCRIPT.md)
- [Testing and verification](docs/TESTING.md)
- [Attribution](ATTRIBUTION.md)

## Licence and development acknowledgement

Application code is distributed under the [MIT licence](LICENSE). TVmaze data and artwork are subject to separate attribution and licensing terms described in [ATTRIBUTION.md](ATTRIBUTION.md).

AI assistance was used in developing the application code, tests and documentation.
