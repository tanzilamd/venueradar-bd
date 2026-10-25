# VenueRadar BD

Dhaka-focused, static venue discovery. Find community centers and convention halls by area, check the address and phone, then open the map or call.

Live project: https://tanzilahmed.tech/venueradar-bd/

## Public directory

- English interface, Dhaka areas, name/alias search and optional nearby neighborhoods.
- Phone and Maps actions, a short detail view, Saved venues and comparison.
- Lazy-loaded Leaflet/OpenStreetMap map with clustering, selected cards, and list fallback.
- One-time nearby distance sorting; precise location is never saved or shared.
- Local Storage favorites and comparisons, with graceful storage failure handling.
- Clean home links and a static Open Graph/Twitter sharing image.

Capacity and facility research already collected is retained internally, but those fields and research filters are not displayed in the contact-first UI. Unknown contacts remain unknown. No ratings, reviews or unlicensed venue photos are copied into the directory. Public business contacts are not call-tested. Coverage is incomplete.

## Manage the directory

The visual manager is built at `/manage.html` and linked in the public footer. It supports **add, edit, remove, validated drafts, JSON import/export and optional direct GitHub publishing**. See [the manager instructions](docs/MANAGE_DIRECTORY.md).

Phone normalization, source/date metadata, missing-phone state, area indexes and collection membership are handled together. Direct publication uses a fine-grained token for the owner, held only in memory, and one normal commit with conflict protection. Removed records and prior edited versions are archived. A token-free alternative downloads one `venues.json` for upload through GitHub.

No account is needed to browse. There is no backend, paid API, compulsory database service, analytics, billing account or scheduled research workflow. GitHub Pages hosts the static build. The repository owner's root site and custom-domain configuration are separate and must not be changed.

## Development

Use Node24 and the pinned lockfile:

```sh
npm ci
npm run dev
npm test
npm run test:browser
npm run build
```

`npm run prepare:data` rebuilds collection membership and includes newly used Dhaka areas. Tests and build run it automatically. `npm run validate` checks the schema, field evidence, phone formats, IDs, regions, duplicates and the Dhaka boundary. Both `index.html` and `manage.html` are production entries and support the Pages repository subpath.

## Data and safe updates

The active dataset is `public/data/venues.json`. Sources, licensed discovery material and reviewed areas remain under `public/data/`; historical reviews and archived records live under `docs/`. Counts are calculated from the current active data, never hardcoded into the interface.

Read [research guidance](docs/RESEARCH_GUIDE.md), [safe-update rules](docs/DATA_UPDATE_GUIDE.md), [sources](docs/DATA_SOURCES.md), and the [26October contact-directory revision](docs/reports/2026-10-26-contact-directory.md) for the current checkpoint, known conflicts, unresolved contacts and actual deployment state. Existing reports are dated history, not a claim that their counts describe every later edit.

Combined map-derived data is © OpenStreetMap contributors under ODbL-1.0. Operator and public-business facts retain individual provenance. Do not scrape restricted sources, invent missing facts, infer WhatsApp, collect private contacts or publish private event information. Future research is performed only on explicit request.
