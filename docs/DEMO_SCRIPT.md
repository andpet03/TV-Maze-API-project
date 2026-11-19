# ATLAS — feature walkthrough

## Discovery

The welcome screen presents the ATLAS identity over rotating TV-show posters. Cover animation can be paused and respects reduced-motion preferences. Title search returns matching shows with identifying metadata.

Genre and premiere-year views provide intersecting filters. The catalogue loads automatically. Titles already displayed remain in place while newly matching records append at the end. Scrolling reveals more cards; a three-dot indicator communicates ongoing downloading.

## Personal collection

A star adds a show to the personal top five. Arrow controls change its rank, and removal makes room for another favourite. The top five is independent of watchlist membership.

The watchlist stores shows and viewing progress. Marking an aired episode watched also saves its show to the watchlist. Progress and next-episode information reflect the episodes recorded in the current browser.

## Episode exploration

A show's detail screen combines its summary, metadata and episode guide. Season, title and viewing-status filters narrow the list. Episode summaries remain hidden until spoiler protection is disabled. Specials can be included in the guide.

## Time-based planning

Tonight’s plan takes a time budget and proposes sequential unwatched aired episodes. The planner stops at an episode that does not fit instead of skipping it. Missing runtimes require an explicit estimate setting; estimates are labelled.

Spin the wheel combines a time budget, genre and candidate scope. It randomly checks available shows and returns a fitting episode plan. Suggestions exclude watched episodes, specials, future episodes and unknown runtimes. The result displays the selected show, episode sequence, total runtime and remaining time.

## Persistence and portability

Personal collections persist in the browser across visits. Backup export creates a JSON file containing watchlist entries, ranked favourites and watched episode IDs. Restore validates the file before replacing personal state. There is no account-based or cross-device synchronisation.

## Technical reference

The module structure, endpoint usage and algorithms are documented in [PROJECT_REPORT.md](PROJECT_REPORT.md). Executed tests and outstanding verification are documented in [TESTING.md](TESTING.md).
