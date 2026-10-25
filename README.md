# VenueRadar BD

English-only, Dhaka-focused, static venue research and discovery platform for Bangladesh. No backend, mandatory login, paid API, database or scheduled scraping.

**Status: Dhaka-first starter directory. Eleven official-source venue records; incomplete, hotel-focused coverage. Deployment verification recorded in docs/QA.md.**

## Develop

Node 24 and npm 11. From this repository:

```sh
npm ci --cache /workspace/.npm-cache
npm run dev
npm test
npm run validate
npm run test:browser
npm run build
npm run preview
```

Browser tests use `/usr/bin/chromium` in this cloud environment. On another machine set `executablePath` in playwright.config.js to your installed Chromium, or install Playwright Chromium and omit the custom path. Fixtures exist only in tests, never the dataset.

Vite bundles Leaflet and clustering locally. Relative build URLs support GitHub Pages repository subpaths. No SPA routes need rewrite rules. User data stays in Local Storage. Geolocation is opt-in, one-shot and never persisted. All external links use HTTPS and safe target attributes. Source text is rendered using DOM textContent, not HTML interpolation.

## Features implemented

English interface with venue-name and alias search, Dhaka neighborhood filters, category/size/facility/evidence filters, dataset-derived statistics, map/list switching, clustered markers, marker/card selection, venue details and evidence, business call links, current Google review links, 2–3 venue comparisons, persistent favorites, and approximate proximity sorting. Unknown facts are explicitly labelled. Eleven source-checked Dhaka venues are indexed; broader community-center coverage remains incomplete.

## Deployment

`.github/workflows/pages.yml` builds and deploys via GitHub Actions on main, with limited job permissions. It **refuses to deploy an empty venue dataset**. After research and QA, push to main and configure only this repository's Settings → Pages → Source: GitHub Actions. Never modify the personal root site's repository, CNAME or domain settings. Read the actual Pages API `html_url` and deployment output; open that URL and verify the built data, assets and interactions. Do not assume a hostname or claim live verification from a workflow alone.

Sitemap/canonical/og:url should be generated only after the real Pages URL is known. The canonical URL and sitemap use GitHub’s reported project URL: https://tanzilahmed.tech/venueradar-bd/ . `robots.txt`, favicon, semantic markup, metadata and keyboard focus states are present. Local mobile Lighthouse scores: performance 98, accessibility 100, best practices 100, SEO 100. These are local build measurements, not live-site measurements.

## Data maintenance

Read [research guide](docs/RESEARCH_GUIDE.md), [safe update guide](docs/DATA_UPDATE_GUIDE.md), and [sources and limitations](docs/DATA_SOURCES.md). Version 1 focuses exclusively on Dhaka. Current coverage is eight hotel event venues and three independent convention/event-hall venues. This is not a complete community-center directory; many neighborhoods remain under-represented. Existing verified records must never be replaced by weaker or empty data.

## License

Application code: MIT (LICENSE). Administrative names retain attribution in docs/GEOCODE_LICENSE.txt. Venue sources require their own lawful reuse basis; no blanket license for third-party content is claimed. Leaflet and marker clustering retain their upstream licenses in dependency packages.
