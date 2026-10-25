# VenueRadar BD

English-only, Dhaka-focused, static venue research and discovery platform for Bangladesh. No backend, mandatory login, paid API, database or scheduled scraping.

**Status: 131 sourced Dhaka records plus one visibly pending owner submission (Jonaki): 124 hall/community/event records and 8 preserved hotels. 94 venues have sourced published phones: 118 contact entries, 114 distinct numbers. All original records individually reviewed; 5 additional source follow-ups remain access-limited. No complete-Dhaka or confirmed-operation claim.**

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

See the [UI/data audit report](docs/reports/2026-10-26-ui-data-audit.md), [all-record ledger](docs/research/2026-10-26-venue-review.json), and [unresolved list](docs/reports/2026-10-26-unresolved-data.md).

## Features implemented

English interface with venue-name and alias search, Dhaka neighborhood filters, category/size/facility/evidence filters, dataset-derived statistics, map/list switching, clustered markers, marker/card selection, venue details and evidence, business call links, current Google review links, 2–3 venue comparisons, persistent favorites, and approximate proximity sorting. Unknown facts are explicitly labelled. The area-first revision adds five neighborhood shortcuts, explicit nearby-area browsing, visible call numbers and identity/closure review notices. See [the change report](docs/reports/2026-10-25-area-contact-revision.md) for actual coverage, contacts, provenance and remaining gaps.

## Deployment

`.github/workflows/pages.yml` builds and deploys via GitHub Actions on main, with limited job permissions. It **refuses to deploy an empty venue dataset**. After research and QA, push to main and configure only this repository's Settings → Pages → Source: GitHub Actions. Never modify the personal root site's repository, CNAME or domain settings. Read the actual Pages API `html_url` and deployment output; open that URL and verify the built data, assets and interactions. Do not assume a hostname or claim live verification from a workflow alone.

Sitemap/canonical/og:url should be generated only after the real Pages URL is known. The canonical URL and sitemap use GitHub’s reported project URL: https://tanzilahmed.tech/venueradar-bd/ . `robots.txt`, favicon, semantic markup, metadata and keyboard focus states are present. An earlier local build measured Lighthouse performance 98, accessibility 100, best practices 100 and SEO 100. These are historical local measurements, not a claim about this revision or the live site.

## Data maintenance

Read [research guide](docs/RESEARCH_GUIDE.md), [safe update guide](docs/DATA_UPDATE_GUIDE.md), and [sources and limitations](docs/DATA_SOURCES.md). Version 1 focuses exclusively on Dhaka. Current coverage is 124 hall/community/event records including one pending submission, and 8 preserved hotel venues. 37 records lack a sourced phone; the additional submitted contact is independently unverified. 8 original records still lack coordinates. Map-reviewed localities are not surveyed boundaries or operator confirmation; many street addresses and capacities remain unknown. Existing verified records must never be replaced by weaker or empty data.

## License

Application code: MIT (LICENSE). Administrative names retain attribution in docs/GEOCODE_LICENSE.txt. The combined venue database and derived boundary use ODbL-1.0 with © OpenStreetMap contributors attribution and separately cited operator facts. Full data license: public/licenses/ODbL-1.0.txt. No blanket license for third-party photos, promotional text or restricted content is claimed. Leaflet and marker clustering retain their upstream licenses in dependency packages.
