# Attribution and licensing

## Data and images

TV-show details, episode information, ratings, network metadata and available posters come from **TVmaze**:

- Service: https://www.tvmaze.com/
- API documentation: https://www.tvmaze.com/api
- API data license stated by TVmaze: Creative Commons Attribution-ShareAlike (CC BY-SA).
- License reference: https://creativecommons.org/licenses/by-sa/4.0/

The interface links to TVmaze globally and to individual show/episode pages. It displays provider data in a reformatted interface and derives personal progress and viewing-time calculations. No catalogue dump or poster collection is bundled with the project. The synthetic browser fixtures are invented specifically for testing and are not represented as real TVmaze records.

Poster images are loaded from the provider's image host when supplied. Their underlying rights are not transferred by the application code's license. Retain provider attribution and comply with applicable data/image terms when redistributing or adapting material.

## Original application code

The HTML, CSS, JavaScript, vector app icon, tests and documentation prepared for this project are supplied under the MIT license in `LICENSE`. This does not relicense third-party data or images under MIT.

## Dependencies

The production app has no third-party JavaScript or CSS packages. Optional browser tests use Playwright, which is installed separately and is not bundled. Core/API tests use the Node.js standard library.

## AI assistance

The implementation and documentation were developed with AI assistance. The submitting student should review and understand the project and follow their institution's disclosure requirements.
