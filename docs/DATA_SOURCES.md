# Data sources and present coverage

## Current directory

118 records in Dhaka: **110 community/event/convention/banquet hall records shown by default**, and **8 existing hotel records available separately**. Of these, 11 have manually inspected operator sources and 107 are OpenStreetMap listings requiring operator confirmation. There is no completeness, active-operation or wedding-only guarantee.

23 records have publicly sourced business contacts (26 numbers). Phone publication is not proof of an active line or WhatsApp support. 8 records have published capacity information, including a range. 111 have mapped positions. 98 have no confirmed neighborhood assignment and are explicitly labelled as such rather than assigned by guesswork.

## Bulk map source

OpenStreetMap contributors via the Geofabrik Bangladesh extract:

- https://download.geofabrik.de/asia/bangladesh.html
- https://www.openstreetmap.org/copyright
- Dhaka Metropolitan scope: https://www.openstreetmap.org/relation/13663697

The 24 October 2026 extract was acquired and checksum-verified during this explicitly requested manual research session. Each new listing retains its OSM identity, version, edit date and geometry method. `public/data/discovery.json` stores the extract metadata, checksums and relevant source tags. `public/data/curated.json` stores admissions, duplicate decisions, conflicts and held candidates. The raw country extract stays outside the repository.

A map edit date is not a business operating-status check. The source-review date means the map data was inspected. Map-only records have an explicit lower-evidence status. No numerical Google ratings, Google Places database content, restricted reviews, unlicensed photographs or copied promotional text are included.

The venue database and derived boundary are distributed under ODbL-1.0, with attribution to OpenStreetMap contributors and separate operator citations. The full text is in `public/licenses/ODbL-1.0.txt`; data licensing is distinguished from MIT application code.

## Operator sources

The original 11 records retain their original first-party source URLs, facts, dates, public business contacts and uncertainty notes. These include official event pages for the eight hotels, Police Convention Hall, RAOWA and SKS. No lower-confidence map field has overwritten an existing operator-sourced value. See `venues.json` for field-specific citations and the earlier change reports for their admission decisions.

## Administrative reference

`docs/reference/bangladesh-areas.json` was originally derived from https://github.com/nuhil/bangladesh-geocode under MIT (copyright 2014 Nuhil Mehdy; full notice in GEOCODE_LICENSE.txt). This is a development reference, not a nationwide directory or Version 1 navigation. Neighborhood labels require supplied address evidence; nearest-place inference is not used.

## Map display

Leaflet and marker clustering are bundled locally. Standard OSM tiles load only when users open the map, with visible attribution. No bulk tile download, prefetch or offline tile cache is implemented. See https://operations.osmfoundation.org/policies/tiles/ . All information remains accessible in the list if tiles fail.

## Research reports

- [Initial dataset](reports/2026-10-25.md)
- [First independent halls](reports/2026-10-25-community-halls.md)
- [Bulk Dhaka hall discovery](reports/2026-10-25-bulk-dhaka-halls.md)

Historical reports preserve their original counts. This document describes the current dataset. Future research must follow DATA_UPDATE_GUIDE.md and protect previously verified records.
