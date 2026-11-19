# ATLAS — project report

## Purpose and architecture

ATLAS helps viewers discover shows and organise their viewing. The interface is designed for end users. Technical implementation is documented here rather than exposed in the product.

The browser loads static HTML, CSS and JavaScript, then requests JSON from TVmaze over HTTPS. `api.js` handles requests; `core.js` implements episode logic; `discovery.js` implements catalogue filtering, ranking and backup migration; `app.js` coordinates screens and local personal data. No server, authentication, secret key or production framework is required.

## Data sources

Official documentation: https://www.tvmaze.com/api

| Endpoint | Use |
| --- | --- |
| `/shows?page=N` | Sequential catalogue batches, max 250 records per page |
| `/search/shows?q=TITLE` | Global title search |
| `/shows/ID` | Show details |
| `/shows/ID/episodes?specials=1` | Complete listed episode guide |

The index is ID-paginated, not sorted by popularity or release date. Loading stops on HTTP 404, as documented. Filters only describe loaded records, and the app explicitly communicates that limitation. Search remains independent. Network errors preserve loaded records and permit retry; loading runs automatically through the last page. Only complete results are stored in a 24-hour IndexedDB cache; failed loads can be retried. Request pacing avoids a burst of parallel catalogue requests.

## Personal state

The existing `episode-atlas.v1` storage key is deliberately retained for continuity. Version 2 records contain `library` (show snapshots, watched IDs and last-known progress) and `favourites` (an ordered array of up to five show snapshots). Ranking is independent from watchlist membership. Backups validate fully before replacing state; version 1 imports produce an empty favourite list. No automatic cross-device sync.

## Algorithms

Genre and exact premiere-year filters intersect, including explicit Unknown and Unclassified values. Selected records sort by rating, date or title, with an initial 24 cards and more revealed on scroll. Existing cards retain their positions; new matching batches append at the end. Sorting applies to the initial selection and each new batch, not globally while a list is actively loading. A filter or sort change begins a new sorted list. Ranking uses immutable array swaps with boundary checks and rejects a sixth item. Cover rotation uses available source posters; it pauses on request, in background tabs and for reduced-motion preferences.

Episode progress counts aired episodes, using exact timestamps where available. The evening planner scans unwatched aired episodes in order, stopping when the next episode does not fit or has an unknown runtime. Estimates require explicit consent; specials are optional. Complexity is linear in the episode count, excluding optional sorting.

## Resilience and security

Requests use an 18-second timeout, cancellation, one bounded retry for 429/5xx responses and a five-minute bounded memory cache. Show/search operation tokens prevent stale responses replacing a later screen. Provider text is escaped; HTML summaries become plain text. Poster URLs are restricted to TVmaze's static host. External links accept only HTTP(S). Personal backups have size/count constraints and validate before mutation.

## Limitations and evaluation

The first full catalogue load may take minutes and considerable memory; no prebuilt local database is bundled. Posters, descriptions and other metadata depend on source coverage. TVmaze is not a streaming service or a guarantee of platform availability. Browser-local storage depends on origin and user settings. The welcome wall has a styled fallback if images fail.

See TESTING.md for executed checks versus unverified browser behaviour. See ATTRIBUTION.md for code/data licences. AI assistance was used in developing the implementation, tests and documentation.

## Stable lists and random planning

The browse queue preserves its existing prefix and deduplicates appended matches by show ID. Catalogue callbacks append DOM cards rather than rebuilding the active grid. An IntersectionObserver reveals additional groups of 24 near the end of the list. Deliberate filter/sort changes reset the queue. The bottom loading indicator distinguishes an incomplete catalogue from no matches after completion.

Spin uses a Fisher–Yates shuffle over a deduplicated snapshot of candidates matching the selected genre and scope. It checks at most 30 shows in random order, fetching episode lists and using the existing sequential planner with estimates and specials disabled. The first fitting plan wins. This is not a uniform draw over all possible episode combinations or over titles still downloading. A 60-second UI deadline and cancellation prevent stale recommendations; navigation cancels the active request. Missing viewing history means episodes are treated as unwatched, explicitly stated in the interface.
